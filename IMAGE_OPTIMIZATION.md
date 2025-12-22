# Image Optimization Guide

## 🎨 Overview
This project uses optimized WebP images for faster loading and better performance. The optimization script converts PNG images to WebP format, reducing file sizes by 70-90% while maintaining quality.

## 📋 Setup & Usage

### 1. Install Dependencies
```bash
npm install
```

This installs `sharp` - a high-performance image processing library.

### 2. Optimize Images
```bash
npm run optimize-images
```

This will:
- Convert all 920 PNG images to WebP format
- Resize images to max 600px (maintains aspect ratio)
- Compress with 85% quality
- Save to `assets/optimized_signs/` folder
- Show statistics on file size reduction

### 3. Build & Deploy
```bash
npm run build
```

The app automatically uses WebP images when supported by the browser, falling back to PNG for older browsers.

## 🔄 How It Works

### AssetLoader Smart Loading
The `AssetLoader.js` service intelligently handles image loading:

1. **WebP Detection**: Checks if browser supports WebP
2. **Try WebP First**: Attempts to load from `assets/optimized_signs/` (WebP)
3. **PNG Fallback**: Falls back to `assets/all_extracted_signs/` (PNG) if WebP unavailable
4. **Cache Everything**: Stores images in IndexedDB for offline use
5. **Lazy Loading**: Only loads images when they come into view

### Benefits
- **70-90% smaller files**: WebP is much more efficient than PNG
- **Faster loading**: Smaller files = faster page loads
- **Better UX**: Images appear quickly with smooth lazy loading
- **Offline support**: Images cached for offline use
- **Universal compatibility**: Falls back to PNG for older browsers

## 📊 Expected Results

For 920 sign images:
- **Before**: ~50-100 MB (PNG files)
- **After**: ~5-15 MB (WebP files)
- **Reduction**: ~85% average file size reduction

## 🎯 Visual Improvements

### Black Background Removal ✅
All black backgrounds have been replaced with:
- **Modal overlays**: White with 85% opacity + blur
- **Shadows**: Red-tinted shadows matching Uganda flag colors
- **Certificates**: White background with subtle red glow
- **Accent colors**: Changed from black (#000000) to red (#D90000)

### Color Scheme
The app now uses a bright, welcoming color palette:
- **Primary Yellow**: #FCD116 (Uganda flag)
- **Secondary Red**: #D90000 (Uganda flag)
- **Accent**: Red instead of black
- **Shadows**: Subtle red tints
- **Backgrounds**: White and light colors

## 🚀 Performance Tips

1. **First Build**: Run `npm run optimize-images` before first deployment
2. **New Images**: Re-run optimization if you add new sign images
3. **Monitor**: Check browser DevTools Network tab to see WebP in action
4. **Cache**: Service worker caches images for instant repeat loads

## 📁 File Structure
```
assets/
├── all_extracted_signs/     # Original PNG files (920 images)
└── optimized_signs/         # WebP files (920 images) - auto-generated

tools/
└── optimize-images.js       # Optimization script

src/services/
└── AssetLoader.js          # Smart image loading with WebP support
```

## 🛠️ Troubleshooting

### "sharp not found" error
```bash
npm install sharp --save-dev
```

### Images not optimizing
Check that:
- PNG files exist in `assets/all_extracted_signs/`
- You have write permissions to create `assets/optimized_signs/`
- Node.js version is 18+ (required by sharp)

### WebP not loading
- Check browser console for errors
- Verify `assets/optimized_signs/` folder exists
- Ensure Vite config includes the folder in public assets

## ✨ Next Steps

1. Run `npm install` to get sharp
2. Run `npm run optimize-images` to convert images
3. Run `npm run build` to build the app
4. Test in browser to see the improvements!

---

**Note**: The original PNG files are preserved in `assets/all_extracted_signs/` as a backup. WebP files are in `assets/optimized_signs/`.
