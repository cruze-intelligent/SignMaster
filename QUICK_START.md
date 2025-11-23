# 🎮 Quick Start Guide - Running SignMaster

## Prerequisites Check ✅

Before starting, verify you have:
- Node.js 16+ installed (`node --version`)
- npm installed (`npm --version`)  
- Dependencies installed (`npm install` if you haven't run this)

## Running the Game - 3 Stages

### Stage 1: Generate Asset Manifest (REQUIRED FIRST TIME ONLY)

**What this does:** Scans 1,020 sign images and creates the game data file.

```powershell
npm run map-assets
```

**Duration:** 15-20 minutes (your computer will work hard - this is normal!)

**What you'll see:**
```
✅ Initializing Tesseract.js worker...
📦 Processing 1,020 sign images...
⏳ [████████░░] 50% - Processed 512 images...
✓ 100% complete - Processed 1,020 images
📋 CSV export complete: tools/asset-review.csv
```

**Important:** Do NOT stop this process, even if it looks frozen. CPU usage will spike to 50-80%. Let it finish completely.

---

### Stage 2: Review Assets (OPTIONAL BUT RECOMMENDED)

**What this does:** Let's you fix any OCR errors before the game uses the data.

1. **Locate the file:** `tools/asset-review.csv`

2. **Open in Excel, Google Sheets, or any CSV editor**

3. **Quick review (5-10 minutes):**
   - Sort by `confidence` column
   - Filter for values < 70%
   - For each row, look at the image and correct `manualLabel` if needed
   - Set `verified = yes` when done

4. **Save the file** (Ctrl+S)

**Skip this?** That's OK - the game will still work with AI-detected labels, just less accurate.

---

### Stage 3: Build Game Data (REQUIRED)

**What this does:** Converts the CSV into the format the game uses.

```powershell
node tools/generate-manifest.js
```

**Duration:** 2 minutes

**Expected output:**
```
📦 SignMaster Manifest Generator - Starting...
📖 Reading CSV file...
✅ Loaded 1,020 records

📊 Processing signs...
✓ Alphabet: 26 signs (26 verified)
✓ Numbers: 15 signs (15 verified)
✓ Greetings: 18 signs (18 verified)
✓ (... 9 more categories ...)

✅ Manifest generated: src/data/signs-manifest.json
```

---

### Stage 4: Run the Game! 🎮

```powershell
npm run dev
```

**Duration:** 5 seconds to start

**What happens:**
- Dev server starts on http://localhost:3000/SignMaster/
- Browser opens automatically
- Welcome screen appears

**If browser didn't open:**
- Click the link shown in terminal: `http://localhost:3000/SignMaster/`

---

## Playing the Game

### Welcome Screen
- Click **"🎮 Start Learning"** to choose a category

### Category Selection
- Tap any category (Alphabet, Numbers, Greetings, etc.)
- Game loads signs for that category

### Learning Mode
- See sign images with labels
- Swipe left/right to browse
- Or tap image to see next

### Match Mode (Coming Soon)
- Select the correct sign label
- Gain XP for correct answers
- Earn badges for achievements

### Badges Screen
- View unlocked and upcoming badges
- See your rank (Beginner → Legendary Master)

### Progress Screen
- Track stats:
  - Total signs learned
  - XP earned
  - Games played
  - Current streak
  - Download certificate

---

## Common Issues & Fixes

### ❌ "manifest.json not found" error
**Solution:** Run Stage 3:
```powershell
node tools/generate-manifest.js
```

### ❌ "Only 2 categories showing"
**Solution:** The manifest is outdated. Run stages 1-3 again:
```powershell
npm run map-assets
node tools/generate-manifest.js
```

### ❌ "Images won't load"
**Solution:** Rebuild:
```powershell
npm run build
npm run preview
```

### ❌ "Dev server won't start"
**Solution:** Clear cache and restart:
```powershell
Remove-Item -Path node_modules -Recurse -Force
npm install
npm run dev
```

### ❌ Terminal appears "frozen" during map-assets
**This is normal!** OCR processing takes 15-20 minutes. Don't close terminal. Wait for completion message.

---

## Building for Production

When ready to deploy:

```powershell
# Create optimized build
npm run build

# Test production build locally
npm run preview
```

Then deploy to GitHub Pages:
```powershell
npm run deploy
```

---

## Testing Without Manifest

If you just want to test the UI without full asset mapping:

```powershell
npm run dev
```

The app will load with 2 sample categories. You can:
- ✅ Test navigation between screens
- ✅ View category selections
- ✅ See badges system
- ✅ Check responsive design
- ❌ Can't play full game (need full manifest)

---

## Network/Offline Play

After first load, the game works offline:
1. App caches 1,100 sign images on first visit
2. No internet needed on subsequent plays
3. Perfect for classroom or offline learning

---

## Need Help?

📖 **Full documentation:** See `ASSET_MAPPING_GUIDE.md` and `README.md`

🐛 **Report issues:** GitHub Issues page

📧 **Contact:** contact@cruze-tech.com

---

## Summary

**First time setup:**
1. `npm run map-assets` (15-20 min) - generates CSV
2. Manual review of CSV (optional, 10 min)
3. `node tools/generate-manifest.js` (2 min) - creates manifest
4. `npm run dev` - play!

**After first setup:**
- Just run `npm run dev` to play
- Or `npm run build` for production

**Total time:** ~30 minutes first time, instant after that!
