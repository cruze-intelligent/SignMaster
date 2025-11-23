# Asset Mapping & Manifest Generation Guide

## Overview

SignMaster uses a **hybrid AI + Manual Verification workflow** to categorize and label 1,020+ Uganda Sign Language sign images. This guide walks you through the complete process.

## Prerequisites

✅ **Already installed in your project:**
- Node.js 16+ (verify: `node --version`)
- npm (verify: `npm --version`)
- All dependencies in `node_modules/` (if not, run `npm install`)

## 3-Step Workflow

### Step 1: Generate Asset CSV with OCR (15-20 minutes)

This step uses **Tesseract.js** to read sign images and extract text.

```powershell
npm run map-assets
```

**What happens:**
- Scans `assets/all_extracted_signs/` directory
- Runs OCR on each PNG image
- Assigns category based on page number patterns
- Generates `tools/asset-review.csv` file

**Expected output:**
```
✅ Initializing Tesseract.js worker...
📦 Processing 1,020 sign images...
✓ 100% complete - Processed 1,020 images
📋 CSV export complete: tools/asset-review.csv
```

**Note:** Processing takes 15-20 minutes. The terminal may appear frozen - this is normal. CPU usage will spike to 50-80%.

---

### Step 2: Manual Verification (10-30 minutes)

Review and correct the generated CSV file.

**Open `tools/asset-review.csv` in:**
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Any CSV editor

**Columns to review:**

| Column | What to Do | Example |
|--------|-----------|---------|
| **filename** | Don't change | `p2_1.png` |
| **pageNum** | Don't change | `2` |
| **sequence** | Don't change | `1` |
| **ocrText** | AI-extracted text | `"A"` (confidence: 95%) |
| **confidence** | OCR accuracy score | `95` = high confidence |
| **suggestedLabel** | AI's best guess | `"A"` |
| **manualLabel** | **← YOU EDIT THIS** | Change if OCR is wrong |
| **category** | Category assigned | `"alphabet"` |
| **verified** | Mark after review | Set to `yes` when done |
| **notes** | Optional comments | `"Unclear - hand angle"` |

**Review workflow:**

1. **Filter by confidence < 70%**
   - These need manual review
   - Right-click column header → Filter → Custom filter → < 70

2. **For each low-confidence row:**
   - Look at the sign image
   - Read the `suggestedLabel`
   - If correct: Type `yes` in `verified` column
   - If wrong: Type the correct label in `manualLabel`, then `yes` in verified

3. **Example fixes:**
   ```
   Filename: p16_5.png (greeting page)
   ocrText: "Hlo" (confidence: 45%)
   suggestedLabel: "Hlo"
   manualLabel: → Type "Hello"
   verified: → Type "yes"
   ```

4. **Save the file** (Ctrl+S or Cmd+S)

**Tips:**
- Start with confidence < 50% for major corrections
- If unsure, leave `manualLabel` blank and check category is correct
- Don't worry about perfect spelling - be consistent with existing labels

---

### Step 3: Generate Production Manifest (2 minutes)

Convert the verified CSV into the production manifest.

```powershell
node tools/generate-manifest.js
```

**What happens:**
- Reads `tools/asset-review.csv`
- Groups signs by category
- Creates `src/data/signs-manifest.json`
- Validates structure

**Expected output:**
```
📦 SignMaster Manifest Generator - Starting...

📖 Reading CSV file...
✅ Loaded 1,020 records

📊 Processing signs...
✓ Alphabet: 26 signs (26 verified)
✓ Numbers: 15 signs (15 verified)
✓ Greetings: 18 signs (18 verified)
...
✅ Manifest generated: src/data/signs-manifest.json
📊 Summary: 1,020 total | 1,020 verified | 12 categories
```

---

## File Locations

| File | Purpose | Created By |
|------|---------|-----------|
| `assets/all_extracted_signs/` | 1,020 PNG sign images | You (extract from source) |
| `tools/asset-mapper.js` | OCR processing script | Project |
| `tools/asset-review.csv` | CSV for manual review | Step 1 (npm run map-assets) |
| `tools/generate-manifest.js` | Manifest generator | Project |
| `src/data/signs-manifest.json` | Final production data | Step 3 (node tools/generate-manifest.js) |

---

## Verification Checklist

After generating the manifest, verify it works:

```powershell
# Start development server
npm run dev
```

**Check:**
- ✅ Browser opens to http://localhost:3000/SignMaster/
- ✅ 12+ categories visible in "Categories" screen
- ✅ Each category shows multiple signs
- ✅ Sign images load and display correctly
- ✅ Can click cards without errors

If you see errors, the manifest was not generated correctly. Go back to **Step 3**.

---

## Troubleshooting

### Error: "asset-review.csv not found"
**Solution:** Run Step 1 first:
```powershell
npm run map-assets
```

### Error: "Cannot read properties of undefined (reading 'length')"
**Solution:** Your CSV might be corrupted. Delete it and re-run Step 1:
```powershell
Remove-Item tools/asset-review.csv
npm run map-assets
```

### Manifest has only 2 categories
**Solution:** You didn't complete Step 2 (manual verification). The CSV needs to be marked as reviewed before Step 3 works.

### Some images don't load in game
**Solution:** Check image filenames match exactly in the manifest. Run Step 3 again:
```powershell
node tools/generate-manifest.js
```

### Terminal appears frozen during "npm run map-assets"
**Don't stop it!** OCR processing is CPU-intensive. Let it run (15-20 mins). Watch for "✓ 100% complete" message.

---

## Performance Notes

- **Step 1 (OCR):** Takes 15-20 minutes. Processor will run hot. This is normal.
- **Step 2 (Review):** Time depends on accuracy needed. 10 minutes minimum for quick review.
- **Step 3 (Generate):** Takes 2-5 minutes.
- **Total time:** ~30-50 minutes for full workflow.

---

## Next Steps

After manifest generation:

1. **Build for production:**
   ```powershell
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```powershell
   npm run deploy
   ```

3. **Or manual GitHub deployment:**
   - Push to `main` branch
   - GitHub Actions automatically builds & deploys to `gh-pages`

---

## Questions?

See full documentation in `README.md` or check the GitHub Issues page.
