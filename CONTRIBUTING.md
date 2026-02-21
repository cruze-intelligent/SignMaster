# Contributing to SignMaster

## Development Setup

```bash
npm install
npm run dev     # http://localhost:5173/SignMaster/
```

---

## 🎨 Design System

### Color Palette (Uganda Flag)

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#FCDC04` (Yellow) | Highlights, badges |
| `--color-secondary` | `#D90000` (Red) | Primary actions, accents |
| `--color-success` | `#10B981` | Correct answers |
| `--color-error` | `#EF4444` | Incorrect answers |
| `--color-warning` | `#F59E0B` | Notifications |
| `--color-info` | `#3B82F6` | Information |

### Badge Tier Colors
- **Bronze** `#CD7F32` · **Silver** `#C0C0C0` · **Gold** `#FFD700` · **Platinum** `#E5E4E2` · **Diamond** `#B9F2FF`

### Typography
- System fonts (SF Pro, Segoe UI, Roboto)
- Sizes: `2rem` (titles) → `1.25rem` (headers) → `1rem` (body) → `0.875rem` (labels) → `0.75rem` (badges)

### Responsive Breakpoints
| Breakpoint | Layout |
|---|---|
| < 480px | Single column, extra padding |
| < 768px | Mobile, bottom nav |
| 769–1024px | Tablet, 2-column grid |
| > 1024px | Desktop, multi-column |

### Accessibility
- High contrast mode via `prefers-contrast: more`
- Reduced motion via `prefers-reduced-motion: reduce`
- Keyboard focus indicators on all interactive elements
- Minimum 44px touch targets
- WCAG AA color contrast

---

## 🏗️ Architecture

### Services (`src/services/`)

| Service | Responsibility |
|---|---|
| `AssetLoader` | Lazy loading, WebP/PNG fallback, blob caching |
| `ManifestLoader` | Loads `signs-manifest.json` via static import |
| `CacheManager` | IndexedDB wrapper for images, progress, badges |
| `StateManager` | Player state, XP, settings, event emitter |
| `BadgeManager` | Badge conditions, progressive reveal, ranks |
| `SearchEngine` | Full-text search with fuzzy matching |
| `TranslationService` | Google Translate API + local Acholi dictionary |
| `CertificateGenerator` | Canvas-based certificate with QR codes |

### Asset Loading Flow
```
AssetLoader.loadSignImage(filename)
  → Try WebP: assets/optimized_signs/{name}.webp
  → Fallback PNG: assets/all_extracted_signs/{name}.png
  → Create blob URL → Render in <img>
  → Cache to IndexedDB for offline use
```

### PWA Configuration (`vite.config.js`)
- **Precache:** App shell only (12 entries, ~450KB)
- **Runtime cache:** Sign images via `CacheFirst` strategy
- **Navigate fallback:** `index.html` with denylist for image paths
- **Base path:** `/SignMaster/`

---

## 🖼️ Image Optimization

### Converting PNGs → WebP
```bash
npm run optimize-images
```

Converts 920 PNGs to WebP (85% quality, max 600px). Results in ~85% file size reduction.

| | PNG | WebP |
|---|---|---|
| Total size | ~50–100 MB | ~5–15 MB |
| Per image | 50–80 KB | 5–15 KB |
| Browser support | Universal | 90%+ (auto-fallback) |

### Asset Mapping Workflow
```bash
npm run map-assets              # Step 1: OCR → CSV (15-20 min)
# Edit tools/asset-review.csv   # Step 2: Review low-confidence items
node tools/generate-manifest.js  # Step 3: CSV → JSON manifest
```

---

## 📝 Making Changes

### Styling
1. Edit design tokens in `src/styles/theme.css`
2. Edit component styles in `src/styles/enhancements.css`
3. Test with `npm run dev`

### Adding a Service
1. Create `src/services/YourService.js`
2. Use the event system from `StateManager` for cross-service communication
3. Initialize in `main.js` during app startup

### Build & Test
```bash
npm run build     # Verify production build
npm run preview   # Test at http://localhost:4173/SignMaster/
```

---

## 🌐 Browser Support

| Browser | Support |
|---|---|
| Chrome/Edge 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| iOS Safari 13 | ⚠️ No service worker |
| IE 11 | ❌ Not supported |
