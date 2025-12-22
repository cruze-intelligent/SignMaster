# 🚀 Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```
This installs all dependencies including `sharp` for image optimization.

---

## Step 2: Optimize Images
```bash
npm run optimize-images
```

**What this does:**
- Converts 920 PNG images to WebP format
- Resizes to optimal size (max 600px)
- Compresses with 85% quality
- Saves to `assets/optimized_signs/`
- Shows progress and statistics

**Expected output:**
```
🎨 Starting image optimization to WebP...

Found 920 PNG images to optimize

✓ p2_0001.png → p2_0001.webp - 87.3% smaller
✓ p2_0002.png → p2_0002.webp - 85.1% smaller
...

Progress: 920/920 images processed

==================================================
✨ Optimization Complete!

📊 Statistics:
   - Processed: 920 images
   - Errors: 0
   - Original size: 65.34 MB
   - Optimized size: 8.12 MB
   - Total reduction: 87.6%
   - Format: WebP for modern browsers
==================================================
```

**Time estimate:** 2-5 minutes for 920 images

---

## Step 3: Build the App
```bash
npm run build
```

**What this does:**
- Bundles all JavaScript, CSS, and assets
- Generates service worker for PWA
- Optimizes code for production
- Creates `dist/` folder ready for deployment

**Expected output:**
```
vite v7.2.4 building for production...
✓ 47 modules transformed.
dist/index.html                    2.86 kB │ gzip:  1.23 kB
dist/assets/index-[hash].css      20.75 kB │ gzip:  5.41 kB
dist/assets/index-[hash].js       47.90 kB │ gzip: 16.84 kB
✓ built in 16.96s
```

---

## Step 4: Test Locally
```bash
npm run preview
```

Opens the built app at `http://localhost:4173`

**What to check:**
- ✅ No black backgrounds anywhere
- ✅ Modal overlays are white/light
- ✅ Images load smoothly
- ✅ Open DevTools → Network tab
- ✅ Should see `.webp` files loading (if browser supports)

---

## Step 5: Deploy
```bash
npm run deploy
```

This builds and deploys to GitHub Pages.

---

## 🎯 Quick Checklist

Before deployment:
- [ ] Run `npm install` ✓
- [ ] Run `npm run optimize-images` ✓
- [ ] Check `assets/optimized_signs/` has 920 .webp files ✓
- [ ] Run `npm run build` ✓
- [ ] Run `npm run preview` and test ✓
- [ ] Verify no black backgrounds ✓
- [ ] Verify images load smoothly ✓
- [ ] Check Network tab shows .webp files ✓
- [ ] Deploy! 🚀

---

## 🔧 Troubleshooting

### "sharp not found"
```bash
npm install sharp --save-dev
```

### Optimization fails
- Check Node.js version: `node --version` (needs 18+)
- Check PNG files exist: `ls assets/all_extracted_signs/`
- Check write permissions

### Build fails
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for syntax errors
- Review build output for specific errors

### Images not loading
- Clear browser cache
- Check browser console for errors
- Verify paths in AssetLoader.js
- Check that `assets/optimized_signs/` folder exists

---

## 📚 Documentation

- **[VISUAL_IMPROVEMENTS.md](VISUAL_IMPROVEMENTS.md)** - Complete changelog
- **[IMAGE_OPTIMIZATION.md](IMAGE_OPTIMIZATION.md)** - Detailed optimization guide
- **[BEFORE_AFTER.md](BEFORE_AFTER.md)** - Visual comparisons
- **[README.md](README.md)** - Main project documentation

---

## ⚡ One-Command Setup (Advanced)

```bash
npm install && npm run optimize-images && npm run build && npm run preview
```

This runs all steps in sequence. Perfect for quick testing!

---

**Need help?** Check the documentation files or open an issue on GitHub.

**Ready to go?** Start with Step 1! 🚀
