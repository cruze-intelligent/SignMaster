#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'signs-manifest.json');
const GLOSSARY_PATH = path.join(ROOT, 'src', 'data', 'acholi-glossary.json');
const REVIEW_JSON_PATH = path.join(ROOT, 'src', 'data', 'content-review.json');
const REVIEW_CSV_PATH = path.join(ROOT, 'tools', 'content-review.csv');

const SOURCE_REFS = [
  'https://unadeaf.or.ug/',
  'https://unadeaf.or.ug/IWDP2025/',
  'https://ncdc.go.ug/wp-content/uploads/2024/02/UGANDAN-SIGN-LANGUAGE-SYLLABUS-BOOK.pdf',
  'https://glottolog.org/resource/reference/id/319429',
  'https://fsnr.kyu.ac.ug/master-of-science-in-ugandan-sign-language-translation-and-interpreting-gmni/'
];

const SUSPICIOUS_PATTERNS = [
  /\bintro\b/i,
  /\bvariation\b/i,
  /\bresponse\b/i,
  /\bwhere is\b/i,
  /\bpractice\b/i,
  /\bdialogue\b/i,
  /\binstruction\b/i,
  /\bconcept\b/i,
  /\btemplate\b/i,
  /\.\.\./,
  /\?/,
  /location\/place/i
];

const CATEGORY_HOLD_PATTERNS = {
  numbers: [
    /chart/i,
    /correct/i,
    /wrong/i,
    /try again/i,
    /well done/i,
    /addition/i,
    /subtraction/i,
    /multiplication/i,
    /division/i,
    /equals/i,
    /greater than/i,
    /less than/i,
    /fraction/i,
    /counting end/i,
    /single/i,
    /double/i,
    /triple/i,
    /many/i,
    /few/i,
    /enough/i,
    /pattern/i,
    /grouping/i,
    /balance/i,
    /change/i
  ],
  greetings: [
    /^Success$/i,
    /^Well done$/i,
    /^Crowd$/i,
    /^Meeting$/i,
    /^Visit$/i,
    /^Introduce$/i,
    /^Socializing$/i,
    /^Group$/i,
    /^Together$/i,
    /^Alone$/i,
    /^Conversation$/i,
    /^Speech$/i,
    /^Language$/i,
    /^Communication$/i,
    /^Community$/i,
    /^Society$/i,
    /^Culture$/i,
    /^Tradition$/i,
    /^History$/i,
    /^Rights$/i,
    /^Duty$/i,
    /^Freedom$/i,
    /^Justice$/i,
    /^Peace$/i,
    /^Respect$/i,
    /^Unity$/i,
    /^Progress$/i,
    /^Change$/i,
    /^Action$/i,
    /^Movement$/i,
    /^Skill$/i,
    /^Ability$/i,
    /^Effort$/i,
    /^Goal$/i,
    /^Achievement$/i,
    /^Challenge$/i,
    /^Opportunity$/i,
    /^Result$/i,
    /^Experience$/i,
    /^Knowledge$/i,
    /^Wisdom$/i,
    /^Understanding$/i,
    /^Learning$/i,
    /^Failure$/i,
    /^Results$/i
  ],
  family: [
    /^Single$/i,
    /^Marriage$/i,
    /^Wedding$/i,
    /^Divorced$/i,
    /^Widow$/i,
    /^Widower$/i,
    /^Engagement$/i,
    /^Relationship$/i,
    /^Care$/i,
    /^Responsibility$/i,
    /^Family House$/i,
    /^Ancestry$/i
  ],
  emotions: [
    /^Health$/i,
    /^Treatment$/i,
    /^Recovery$/i,
    /^Emergency$/i
  ],
  school: [
    /^Education$/i,
    /^Subject$/i,
    /^Result$/i,
    /^Success$/i,
    /^Failure$/i
  ],
  food: [
    /^Healthy Food$/i,
    /^Vegetables & Fruits$/i
  ],
  colors: [
    /^Light$/i,
    /^Dark$/i,
    /^Bright$/i,
    /^Dull$/i,
    /^Rainbow$/i,
    /^Mixture$/i,
    /^Pattern$/i,
    /^Striped$/i,
    /^Spotted$/i,
    /^Plain$/i,
    /^Beautiful$/i,
    /^Ugly$/i,
    /^Choice$/i
  ],
  places: [
    /^Map$/i,
    /^Road$/i,
    /^Street$/i,
    /^Path$/i,
    /^Bridge$/i,
    /^Border$/i,
    /^Distance$/i,
    /^Near$/i,
    /^Far$/i,
    /^Direction$/i,
    /^North$/i,
    /^South$/i,
    /^East$/i,
    /^West$/i,
    /^Compass$/i,
    /^Left$/i,
    /^Right$/i,
    /^Straight$/i,
    /^Mountain$/i,
    /^Hill$/i,
    /^River$/i,
    /^Lake$/i,
    /^Forest$/i,
    /^Desert$/i,
    /^Island$/i
  ]
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalLabel(label) {
  return String(label || '')
    .replace(/^(Alphabet|Number|Greeting|Family|Emotion|Animal):\s*/i, '')
    .replace(/\s+\((Color|Direction)\)$/i, '')
    .trim();
}

function inferStatus(originalLabel, cleanedLabel) {
  const matchedPattern = SUSPICIOUS_PATTERNS.find(pattern =>
    pattern.test(originalLabel) || pattern.test(cleanedLabel)
  );

  if (matchedPattern) {
    return {
      status: 'hold',
      reviewNotes: `Auto-held during initial cleanup seed because "${originalLabel}" matched a risky content pattern.`
    };
  }

  return {
    status: 'approved',
    reviewNotes: 'Approved in the initial cleanup seed because the label is concrete and free of obvious meta markers.'
  };
}

function inferCategoryStatus(category, originalLabel, cleanedLabel) {
  const patterns = CATEGORY_HOLD_PATTERNS[category] || [];
  const matchedPattern = patterns.find(pattern => pattern.test(cleanedLabel) || pattern.test(originalLabel));

  if (matchedPattern) {
    return {
      status: 'hold',
      reviewNotes: `Auto-held during second-pass review because "${originalLabel}" is too abstract or weakly anchored for the current accuracy-first release.`
    };
  }

  return null;
}

function buildAcholiLookup(glossary) {
  const lookup = new Map();
  for (const entry of glossary.searchTerms || []) {
    const key = normalizeText(entry.english);
    if (!lookup.has(key)) {
      lookup.set(key, entry.term);
    }
  }
  return lookup;
}

function inferAcholiLabel(cleanedLabel, acholiLookup) {
  const normalizedLabel = normalizeText(cleanedLabel);
  if (!normalizedLabel) return '';
  if (acholiLookup.has(normalizedLabel)) {
    return acholiLookup.get(normalizedLabel);
  }

  let bestMatch = '';
  let bestLength = 0;
  for (const [english, acholi] of acholiLookup.entries()) {
    if (normalizedLabel.includes(english) && english.length > bestLength) {
      bestMatch = acholi;
      bestLength = english.length;
    }
  }

  return bestMatch;
}

function buildReviewRecords() {
  const manifest = readJson(MANIFEST_PATH);
  const glossary = readJson(GLOSSARY_PATH);
  const acholiLookup = buildAcholiLookup(glossary);
  const generatedAt = new Date().toISOString();
  const records = [];

  for (const [category, categoryData] of Object.entries(manifest.categories)) {
    for (const sign of categoryData.signs) {
      const approvedLabel = canonicalLabel(sign.label);
      const statusInfo = inferCategoryStatus(category, sign.label, approvedLabel)
        || inferStatus(sign.label, approvedLabel);

      records.push({
        id: sign.id,
        category,
        originalLabel: sign.label,
        status: statusInfo.status,
        approvedLabel,
        acholiLabel: inferAcholiLabel(approvedLabel, acholiLookup),
        reviewNotes: statusInfo.reviewNotes,
        sourceRefs: SOURCE_REFS,
        licenseStatus: 'existing-repo-asset',
        instruction: {
          handshape: '',
          location: '',
          orientation: '',
          movement: '',
          usageTip: ''
        },
        assetOverride: null,
        seededAt: generatedAt
      });
    }
  }

  return records;
}

function summarizeRecords(records) {
  return records.reduce((summary, record) => {
    summary.total += 1;
    summary[record.status] = (summary[record.status] || 0) + 1;
    return summary;
  }, { total: 0, approved: 0, hold: 0, rejected: 0 });
}

function escapeCsv(value) {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(records) {
  const headers = [
    'id',
    'category',
    'originalLabel',
    'status',
    'approvedLabel',
    'acholiLabel',
    'reviewNotes',
    'sourceRefs',
    'licenseStatus',
    'instruction.handshape',
    'instruction.location',
    'instruction.orientation',
    'instruction.movement',
    'instruction.usageTip',
    'assetOverride'
  ];

  const rows = [headers.join(',')];
  for (const record of records) {
    rows.push([
      record.id,
      record.category,
      record.originalLabel,
      record.status,
      record.approvedLabel,
      record.acholiLabel,
      record.reviewNotes,
      (record.sourceRefs || []).join('|'),
      record.licenseStatus,
      record.instruction?.handshape || '',
      record.instruction?.location || '',
      record.instruction?.orientation || '',
      record.instruction?.movement || '',
      record.instruction?.usageTip || '',
      record.assetOverride || ''
    ].map(escapeCsv).join(','));
  }

  return rows.join('\n') + '\n';
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function fromCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() || '');

  return lines
    .filter(Boolean)
    .map(line => {
      const values = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      return {
        id: row.id,
        category: row.category,
        originalLabel: row.originalLabel,
        status: row.status || 'hold',
        approvedLabel: row.approvedLabel,
        acholiLabel: row.acholiLabel,
        reviewNotes: row.reviewNotes,
        sourceRefs: row.sourceRefs ? row.sourceRefs.split('|').filter(Boolean) : [],
        licenseStatus: row.licenseStatus || 'existing-repo-asset',
        instruction: {
          handshape: row['instruction.handshape'] || '',
          location: row['instruction.location'] || '',
          orientation: row['instruction.orientation'] || '',
          movement: row['instruction.movement'] || '',
          usageTip: row['instruction.usageTip'] || ''
        },
        assetOverride: row.assetOverride || null
      };
    });
}

function writeReviewArtifacts(records, mode) {
  const summary = summarizeRecords(records);
  const payload = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    mode,
    sourceAnchors: SOURCE_REFS,
    summary,
    records
  };

  ensureParent(REVIEW_JSON_PATH);
  ensureParent(REVIEW_CSV_PATH);
  writeJson(REVIEW_JSON_PATH, payload);
  fs.writeFileSync(REVIEW_CSV_PATH, toCsv(records));

  console.log(`Wrote ${summary.total} review rows (${summary.approved} approved, ${summary.hold} hold, ${summary.rejected} rejected).`);
}

function seed() {
  writeReviewArtifacts(buildReviewRecords(), 'seed');
}

function exportCsv() {
  const payload = readJson(REVIEW_JSON_PATH);
  ensureParent(REVIEW_CSV_PATH);
  fs.writeFileSync(REVIEW_CSV_PATH, toCsv(payload.records || []));
  console.log(`Exported ${payload.records?.length || 0} rows to ${REVIEW_CSV_PATH}`);
}

function importCsv() {
  const records = fromCsv(fs.readFileSync(REVIEW_CSV_PATH, 'utf8'));
  writeReviewArtifacts(records, 'import');
}

const command = process.argv[2] || 'seed';

switch (command) {
  case 'seed':
    seed();
    break;
  case 'export':
    exportCsv();
    break;
  case 'import':
    importCsv();
    break;
  default:
    console.error(`Unknown command "${command}". Use seed, export, or import.`);
    process.exit(1);
}
