# 🤟 SignMaster: Learn Uganda Sign Language

An interactive PWA for learning Uganda Sign Language (USL) with a reviewed sign set, gamification, and offline support.

![Build Status](https://github.com/cruze-tech/SignMaster/actions/workflows/deploy.yml/badge.svg)

## ✨ Features

- **Reviewed Sign Set** — Runtime content is filtered through a local review ledger before it appears in the app
- **Quiz with Combo System** — Same-category questions, 2×/3×/5× multipliers, time bonuses, confetti
- **Progressive Badges** — 5-tier achievements (Bronze → Diamond) with 1,540 total points
- **Certificates** — Downloadable with QR codes and Cruze Intelligent Systems(U) Ltd branding
- **Offline PWA** — Works without internet after first load (IndexedDB caching)
- **Bilingual** — English + Acholi (Lwo) with offline glossary-backed search
- **Gamification** — XP, levels, streaks, combos, daily challenges
- **Accessibility** — Voice narration, high contrast mode, 44px touch targets
- **Responsive** — Mobile, tablet, and desktop with safe-area support

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173/SignMaster/** in your browser.

### Production Build & Preview

```bash
npm run build      # Build optimized bundle
npm run preview    # Preview at http://localhost:4173/SignMaster/
```

## 📱 Mobile PWA & Installation

The application is configured as a Progressive Web App using [VitePWA](https://github.com/antfu/vite-plugin-pwa) and Workbox. A service worker (`dist/sw.js`) is generated during the production build, providing offline access to all core assets and data.

**Testing on mobile:**

1. Run a production build (`npm run build`) and serve the `dist` folder over HTTPS. You can use `npm run preview` locally, but real‑device testing requires HTTPS or a hosted environment.
2. Open the URL in a mobile browser (Chrome, Edge, Safari, etc.).
3. After a few seconds the browser will fire `beforeinstallprompt` and a small **Install App** button will appear at the bottom‑right of the screen (only on devices with a narrow viewport).
4. Tap the button or choose **Add to Home screen** from the browser menu. The app will launch in **standalone** mode from then on and continue to work offline.

> Note: `start_url` and `scope` are configured as `/SignMaster/` in `vite.config.js`, matching the project's `base` path. If you host the app at a subpath, confirm these values before publishing.

You can also install the app manually through the browser's menu on desktop, but the custom button is intentionally hidden on wider screens.

## �📦 Asset Mapping Workflow

## 📦 Asset Mapping (First Time Only)

The game ships with a pre-built manifest. If you need to regenerate it from the sign images:

### Step 1: Run OCR (15–20 min)
```bash
npm run map-assets
```
Scans images with Tesseract.js and creates `tools/asset-review.csv`.

### Step 2: Review OCR CSV (Optional, 10 min)
Open `tools/asset-review.csv` in a spreadsheet editor. Sort by `confidence`, fix `manualLabel` for rows below 70%, and keep the raw OCR audit data up to date.

### Step 3: Generate Manifest (2 min)
```bash
node tools/generate-manifest.js
```
Creates `src/data/signs-manifest.json` with all categories and signs.

### Step 4: Audit & Clean (1 min)
```bash
node tools/audit-manifest.cjs        # Report-only
node tools/audit-manifest.cjs --clean # Remove obvious legacy OCR/meta noise
```

### Step 5: Seed or Sync the Runtime Review Ledger
```bash
npm run content-review:seed    # Build src/data/content-review.json + tools/content-review.csv
npm run content-review:export  # Re-export CSV from the JSON ledger
npm run content-review:import  # Import edited CSV back into the JSON ledger
```
Only rows marked `approved` in `src/data/content-review.json` are exposed at runtime.

### Image Optimization
```bash
npm run optimize-images
```
Converts PNGs → WebP (85% smaller). The app tries WebP first and falls back to PNG automatically.

---

## 🚢 Deployment

### GitHub Pages (Automatic)

Push to `main` → GitHub Actions builds and deploys to `gh-pages`.

**Live URL:** `https://cruzeintelligentsystems.com`

### Manual Deploy
```bash
npm run deploy     # Builds + pushes to gh-pages branch
```

### GitHub Pages Setup
1. Repository Settings → Pages
2. Source: **GitHub Actions**
3. Custom domain (optional): `cruzeintelligentsystems.com`

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| Vite 5.4 | Build system with code splitting |
| vite-plugin-pwa | Service worker + PWA manifest |
| IndexedDB (idb) | 50MB offline image caching |
| Tesseract.js | OCR for asset categorization |
| GSAP 3.12 | Animations and transitions |
| sharp | WebP image optimization |

---

## 📁 Project Structure

```
SignMaster/
├── index.html                  # App entry point + CSP
├── vite.config.js              # Vite + PWA config (base: /SignMaster/)
├── src/
│   ├── main.js                 # App initialization, quiz, & routing
│   ├── components/             # SignCard, SignModal
│   ├── services/               # AssetLoader, BadgeManager, CacheManager,
│   │                             ManifestLoader, StateManager,
│   │                             TranslationService (EN + Acholi)
│   ├── styles/                 # theme.css, enhancements.css
│   ├── utils/                  # security.js
│   └── data/                   # signs-manifest.json, badge-definitions.json
├── public/
│   ├── assets/
│   │   ├── optimized_signs/    # WebP images
│   │   └── all_extracted_signs/# PNG fallbacks
│   └── icon-*.svg              # PWA icons
├── tools/
│   ├── asset-mapper.js         # OCR processor
│   ├── generate-manifest.js    # CSV → JSON manifest
│   ├── optimize-images.js      # PNG → WebP converter
│   └── audit-manifest.cjs      # Content quality auditor
├── tests/                      # Vitest test suite
└── .github/workflows/deploy.yml
```

---

## 🎮 Badge System

| Tier | Points | Examples |
|---|---|---|
| Bronze | 5 each | First Sign, Five Signs |
| Silver | 10 each | Alphabet Master, Speed Demon |
| Gold | 25 each | Perfectionist, Twenty Streak |
| Platinum | 50 each | Grand Master, Weekly Warrior |
| Diamond | 100 each | Legendary achievements |

**Ranks:** Beginner (0) → Rising Star (25) → Advanced (100) → Expert (250) → Elite (500) → Legendary (1000+)

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| Images won't load | Run `npm run build` then `npm run preview` |
| Dev server won't start | `rm -rf node_modules && npm install && npm run dev` |
| Wrong image labels | Edit `tools/content-review.csv`, then run `npm run content-review:import` |
| Terminal frozen during OCR | Normal — wait 15–20 min for completion |
| `sharp` not found | `npm install sharp --save-dev` |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for design system, architecture, and development guidelines.

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for CSP, input sanitization, and security implementation details.

## 📄 License

MIT License — See LICENSE file

---

**Cruze Intelligent Systems(U) Ltd**

Made with ❤️ for Uganda's Deaf community
