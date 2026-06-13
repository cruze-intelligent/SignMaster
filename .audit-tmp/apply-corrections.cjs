// One-off script to apply the 9-batch visual content audit results to
// src/data/content-review.json, src/data/signs-manifest.json and
// src/data/acholi-glossary.json.
//
// Usage: node .audit-tmp/apply-corrections.cjs [--dry-run]

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CR_PATH = path.join(ROOT, 'src/data/content-review.json');
const MANIFEST_PATH = path.join(ROOT, 'src/data/signs-manifest.json');
const GLOSSARY_PATH = path.join(ROOT, 'src/data/acholi-glossary.json');

const DRY_RUN = process.argv.includes('--dry-run');

const VALID_CATEGORIES = new Set([
  'alphabet', 'numbers', 'greetings', 'family', 'emotions', 'school', 'food',
  'colors', 'animals', 'places', 'actions', 'time', 'money', 'math', 'quantities'
]);

const cr = JSON.parse(fs.readFileSync(CR_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf8'));

const recMap = new Map(cr.records.map((r) => [r.id, r]));

const manifestIndex = new Map();
for (const [catKey, catObj] of Object.entries(manifest.categories)) {
  catObj.signs.forEach((sign) => manifestIndex.set(sign.id, { category: catKey, sign }));
}

// --- Editorial override rules -------------------------------------------

// numbers_8_31 ("Wrong/Error") was rejected by the batch-1 agent, but the
// image is clearly a Type-A "hand to forehead" gesture (the agent's own
// description matches a "Think" sign). Accept its own suggested relabel
// instead of discarding a real gesture illustration.
const NUMBERS_8_31_OVERRIDE = {
  finalStatus: 'approved',
  finalLabel: 'Think',
  finalCategory: 'actions',
  acholiLabel: 'Tamo',
  acholiConfidence: 'medium',
  notes: "Reclassified from rejected to approved: image shows a clear 'hand to forehead' Think gesture (Type A sign illustration), originally mislabeled 'Wrong/Error'. Relabeled to 'Think' / 'Tamo'."
};

// Fallback Acholi translations for Type-A entries that the audit agents
// left with an empty acholiLabel while still flagging them hold/rejected.
const ACHOLI_FALLBACK = {
  numbers_13_253: { acholiLabel: 'Pe agikki', acholiConfidence: 'low' }, // Infinity
  numbers_15_299: { acholiLabel: 'Sente', acholiConfidence: 'medium' }, // Coin
  greetings_16_95: { acholiLabel: 'Yom ic me nyutte', acholiConfidence: 'low' } // Nice to meet you
};

// greetings_16_95 was relabeled "Quran" (based on a stray caption in the
// crop) and rejected for having no fitting category. The image is still a
// Type-A gesture that was previously shown as "Nice to meet you" -- revert
// to the original label/category rather than adopting the stray caption.
const LABEL_REVERT_TO_ORIGINAL = new Set(['greetings_16_95']);

const TYPE_A_PRESERVATION_NOTE =
  ' [Editorial override: kept approved -- confirmed Type-A sign-language gesture/pose illustration. ' +
  'USL vocabulary is largely conventional rather than pictorial, so visual non-iconicity alone is not ' +
  'grounds to hide a previously-published sign.]';

// --- Apply batch results ---------------------------------------------------

const moves = []; // { id, from, to, label }
const newGlossaryTerms = [];
let processed = 0;
const statusChanges = { approvedToHold: 0, approvedToRejected: 0, holdToApproved: 0, rejectedToApproved: 0, holdToRejected: 0, holdToHold: 0, other: 0 };

for (let b = 1; b <= 9; b++) {
  const results = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-tmp', `batch${b}-results.json`), 'utf8'));
  for (const r of results) {
    const rec = recMap.get(r.id);
    if (!rec) {
      throw new Error(`No content-review record found for id ${r.id} (batch ${b})`);
    }
    const previousStatus = rec.status;

    let finalStatus = r.finalStatus;
    let finalLabel = r.finalLabel;
    let finalCategory = r.finalCategory;
    let acholiLabel = r.acholiLabel || '';
    let acholiConfidence = r.acholiConfidence;
    let notes = r.notes || rec.reviewNotes;

    if (r.id === 'numbers_8_31') {
      ({ finalStatus, finalLabel, finalCategory, acholiLabel, acholiConfidence, notes } = NUMBERS_8_31_OVERRIDE);
    } else if (previousStatus === 'approved' && r.imageType === 'A' && r.finalStatus !== 'approved') {
      finalStatus = 'approved';
      if (LABEL_REVERT_TO_ORIGINAL.has(r.id)) {
        finalLabel = rec.approvedLabel;
        finalCategory = rec.category;
      }
      notes = (notes || '') + TYPE_A_PRESERVATION_NOTE;
    }

    if (!acholiLabel) {
      const fallback = ACHOLI_FALLBACK[r.id];
      if (fallback) {
        acholiLabel = fallback.acholiLabel;
        acholiConfidence = fallback.acholiConfidence;
      } else if (rec.acholiLabel) {
        acholiLabel = rec.acholiLabel;
      }
    }

    if (!VALID_CATEGORIES.has(finalCategory)) {
      throw new Error(`Invalid finalCategory "${finalCategory}" for ${r.id}`);
    }
    if (!['approved', 'hold', 'rejected'].includes(finalStatus)) {
      throw new Error(`Invalid finalStatus "${finalStatus}" for ${r.id}`);
    }

    // tally transition stats
    if (previousStatus === 'approved' && finalStatus === 'hold') statusChanges.approvedToHold++;
    else if (previousStatus === 'approved' && finalStatus === 'rejected') statusChanges.approvedToRejected++;
    else if (previousStatus === 'hold' && finalStatus === 'approved') statusChanges.holdToApproved++;
    else if (previousStatus === 'rejected' && finalStatus === 'approved') statusChanges.rejectedToApproved++;
    else if (previousStatus === 'hold' && finalStatus === 'rejected') statusChanges.holdToRejected++;
    else if (previousStatus === 'hold' && finalStatus === 'hold') statusChanges.holdToHold++;
    else statusChanges.other++;

    // update content-review record
    rec.status = finalStatus;
    rec.approvedLabel = finalLabel;
    rec.acholiLabel = acholiLabel;
    rec.category = finalCategory;
    rec.reviewNotes = notes;

    // track manifest moves
    const entry = manifestIndex.get(r.id);
    if (!entry) {
      throw new Error(`No signs-manifest entry found for id ${r.id}`);
    }
    if (entry.category !== finalCategory) {
      moves.push({ id: r.id, from: entry.category, to: finalCategory, label: finalLabel });
    }

    // always sync label/description on the manifest sign to match the
    // approved label (mergeReviewedSign overrides `label` at runtime, but
    // keep the source manifest consistent, especially `description`).
    entry.sign.label = finalLabel;
    entry.sign.description = `Learn to sign "${finalLabel}" in Uganda Sign Language`;

    if (r.newGlossaryTerm && r.newGlossaryTerm.term) {
      newGlossaryTerms.push(r.newGlossaryTerm);
    }

    processed++;
  }
}

console.log(`Processed ${processed} records (expected 675).`);
console.log('Status transitions:', JSON.stringify(statusChanges, null, 2));
console.log(`Category moves: ${moves.length}`);
for (const m of moves) {
  console.log(`  ${m.id}: ${m.from} -> ${m.to}  ("${m.label}")`);
}

// --- Apply manifest moves ---------------------------------------------------

for (const move of moves) {
  const fromArr = manifest.categories[move.from].signs;
  const idx = fromArr.findIndex((s) => s.id === move.id);
  if (idx === -1) {
    throw new Error(`Could not find ${move.id} in categories.${move.from}.signs for move`);
  }
  const [signObj] = fromArr.splice(idx, 1);
  manifest.categories[move.to].signs.push(signObj);
}

// --- Recompute summary -------------------------------------------------------

let approved = 0, hold = 0, rejected = 0;
for (const rec of cr.records) {
  if (rec.status === 'approved') approved++;
  else if (rec.status === 'hold') hold++;
  else if (rec.status === 'rejected') rejected++;
  else throw new Error(`Unexpected status "${rec.status}" on ${rec.id}`);
}
console.log(`\nNew summary: total=${cr.records.length} approved=${approved} hold=${hold} rejected=${rejected}`);
cr.summary = { total: cr.records.length, approved, hold, rejected, lastUpdated: new Date().toISOString() };

// --- Merge new glossary terms ------------------------------------------------

const existingTerms = new Set(glossary.searchTerms.map((t) => t.term.toLowerCase()));
let addedTerms = 0;
for (const term of newGlossaryTerms) {
  const key = term.term.toLowerCase();
  if (!existingTerms.has(key)) {
    glossary.searchTerms.push({
      term: term.term,
      english: term.english,
      aliases: term.aliases || []
    });
    existingTerms.add(key);
    addedTerms++;
  }
}
console.log(`New glossary terms added: ${addedTerms} (of ${newGlossaryTerms.length} proposed, after de-dup)`);

// --- Check for remaining empty acholiLabel on approved records --------------

const missingAcholi = cr.records.filter((r) => r.status === 'approved' && !r.acholiLabel);
console.log(`Approved records still missing acholiLabel: ${missingAcholi.length}`);
for (const r of missingAcholi) {
  console.log(`  ${r.id}: "${r.approvedLabel}"`);
}

// --- Write files ---------------------------------------------------------------

if (!DRY_RUN) {
  fs.writeFileSync(CR_PATH, JSON.stringify(cr, null, 2) + '\n');
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(GLOSSARY_PATH, JSON.stringify(glossary, null, 2) + '\n');
  console.log('\nFiles written.');
} else {
  console.log('\nDRY RUN -- no files written.');
}
