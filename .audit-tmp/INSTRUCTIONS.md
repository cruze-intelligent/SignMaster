# SignMaster Content Audit — Batch Instructions

You are reviewing entries from SignMaster, an educational app teaching
Uganda Sign Language (USL) to a general audience (with an Acholi/Lwo
bilingual UI). Each entry is one "sign card": an extracted illustration
+ an English label. Only entries with `status: "approved"` are shown
in-game.

## Your input

Read your assigned batch file: `/tmp/sm-audit/<BATCH>.json` — an array
of objects:
```
{ id, category, manifestCategory, filename, status, originalLabel,
  approvedLabel, acholiLabel, reviewNotes }
```

Images live at:
`/Users/starthelight/Desktop/Edutainment Games/SignMaster/public/assets/all_extracted_signs/<filename>`

Also read `/Users/starthelight/Desktop/Edutainment Games/SignMaster/src/data/acholi-glossary.json`
(`searchTerms` array) for existing Acholi/Lwo vocabulary — match its
spelling/style conventions for any new translations.

## For EACH entry, do this

### 1. Open the image and classify it

- **Type A — Gesture/pose illustration**: shows a person, hand(s), or
  arm(s) performing a sign-language handshape/gesture/pose. This IS a
  sign.
- **Type B — Object/icon illustration**: a single concrete
  object/animal/food/symbol with no human figure (e.g. a drawing of a
  fish, corn cob, coin). This counts as a valid vocabulary item (the
  "referent" being taught) IF the label names that object correctly.
- **Type C — Non-sign reference material**: printed text blocks,
  multi-row tables/charts, multi-item collages, axis/diagram labels, or
  anything that is clearly textbook page furniture rather than a single
  vocabulary item. NOT a sign.

### 2. Decide the final label

`approvedLabel` is already a cleaned-up version of the original PDF
caption. Your job is to make sure it describes **one concrete
vocabulary item that matches what the image actually shows**:

- If `approvedLabel`/`originalLabel` already accurately describes the
  image → keep it (do not change for the sake of change).
- If the image clearly shows something else (e.g. label says "Fractions
  (Intro)" but the picture is a corn cob) → replace `finalLabel` with
  the correct, concrete name for what's shown (e.g. "Maize" or "Corn"),
  and set `finalCategory` to the best-fitting category for that new
  label (see valid list below) — even if that's different from the
  entry's current category.
- Strip meta/section wording that describes a *section* rather than a
  *single sign* — e.g. "(Intro)", "(Conclusion)", "Quiz", "List",
  "Counting 1-10", "Pattern" — UNLESS the image genuinely depicts that
  exact single concept. If you strip such wording, replace `finalLabel`
  with what the image actually depicts (Type A or B). If nothing
  concrete can be salvaged, mark it Type C (see below).
- "(Variation)" suffixes: if the image shows a plausible alternate
  handshape/gesture for the same word, you may keep the base word (drop
  "(Variation)") as `finalLabel`. If the image shows something
  unrelated to that word entirely, treat it like any other mismatch
  (relabel to what's shown).

### 3. Decide `finalStatus`

- `"approved"` — Type A or Type B, with a `finalLabel` that accurately
  matches the image. (Promote hold→approved here if it qualifies; keep
  approved entries approved if they still qualify.)
- `"rejected"` — Type C (non-sign reference material), or an image so
  generic/illegible that no concrete label can be justified. Hidden
  either way, but `"rejected"` documents *why* for entries that were
  previously shown.
- `"hold"` — only for genuinely ambiguous cases you can't confidently
  resolve either way (use sparingly — most entries should resolve to
  approved or rejected).

### 4. Pick `finalCategory`

Must be one of these existing category keys:
`alphabet, numbers, greetings, family, emotions, school, food, colors,
animals, places, actions, time, money, math, quantities`

Usually this is just `manifestCategory` unchanged. Only change it when
you've relabeled the entry to something that clearly belongs elsewhere
(e.g. a corn-cob image relabeled "Maize" → `food`).

### 5. Provide an accurate Acholi (Lwo) translation

Set `acholiLabel` to an accurate Acholi/Lwo translation of `finalLabel`:

- Reuse exact terms from `acholi-glossary.json` `searchTerms` where the
  English meaning matches (match their spelling conventions).
- For everyday vocabulary not yet in the glossary, provide your best
  accurate Acholi/Lwo translation (Acholi is a Western Nilotic / Luo
  language spoken in Northern Uganda — closely related to Lango and
  Alur).
- For modern/technical/abstract terms with no traditional one-word
  equivalent, use the natural descriptive phrase an Acholi speaker
  would use (not a literal/awkward word-for-word gloss).
- Set `acholiConfidence` to `"high"` (common everyday word, confident),
  `"medium"` (reasonable, but a native reviewer should double check), or
  `"low"` (best-effort guess for an obscure/technical term).
- If this is a useful new search term (a common word not already in the
  glossary), include it in `newGlossaryTerm: { term, english, aliases }`
  (Acholi term, English meaning, any alternate spellings) — otherwise
  `null`.

## Output

Write your results to `/tmp/sm-audit/<BATCH>-results.json` as a JSON
array, one object per input entry, **in the same order as the input**:

```json
{
  "id": "numbers_12_238",
  "imageType": "B",
  "imageDescription": "A maize/corn cob with husk leaves",
  "finalLabel": "Maize",
  "finalCategory": "food",
  "finalStatus": "approved",
  "acholiLabel": "Kal",
  "acholiConfidence": "high",
  "newGlossaryTerm": { "term": "kal", "english": "maize", "aliases": ["corn"] },
  "notes": "Originally mislabeled 'Fractions (Intro)' under numbers; image is clearly a maize cob, moved to food."
}
```

Do not edit any source files — this is a read-only audit. Just produce
the results JSON. Work through every entry; do not skip any. When done,
report back a short summary: counts of approved/rejected/hold, and a
list of any recategorizations or notable mislabels you found.
