# 🤟 SignMaster: Learn Uganda Sign Language

An interactive educational game for learning Uganda Sign Language (USL) with 1,020+ real signs, gamification, and offline support.

![Build Status](https://github.com/cruze-tech/SignMaster/actions/workflows/deploy.yml/badge.svg)

## 🎯 Features

- **1,020+ Real Signs** - Authentic Uganda Sign Language images mapped via AI-powered OCR
- **30 Progressive Badges** - 5-tier achievement system (Bronze → Diamond) with 1,540 total points
- **Motivational Certificates** - Downloadable certificates with Cruze Tech branding and QR codes
- **Offline PWA** - Works completely offline with IndexedDB caching
- **Mobile installation** - Installable on phones/tablets via a prompt or custom button (supports Android/iOS web apps)
- **12 Categories** - Alphabet, Numbers, Greetings, Emotions, Family, School, Food, Colors, Animals, Places, and more
- **Gamification** - XP system, levels, streaks, leaderboard ranks
- **Voice Narration** - Audio pronunciation for accessibility
- **High Contrast Mode** - Improved visibility for low-vision users
- **Progressive Reveal** - Shows next 3 unlockable badges to maintain motivation
- **Performance Optimized** - Lazy loading, code splitting, <500KB initial bundle

## 🚀 Quick Start

### Installation

```powershell
# Clone repository
git clone https://github.com/cruze-tech/SignMaster.git
cd SignMaster

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000/SignMaster/` to see the app.

### Production Build

```powershell
# Build for production
npm run build

# Preview production build
npm run preview
```

## � Mobile PWA & Installation

The application is configured as a Progressive Web App using [VitePWA](https://github.com/antfu/vite-plugin-pwa) and Workbox. A service worker (`dist/sw.js`) is generated during the production build, providing offline access to all core assets and data.

**Testing on mobile:**

1. Run a production build (`npm run build`) and serve the `dist` folder over HTTPS. You can use `npm run preview` locally, but real‑device testing requires HTTPS or a hosted environment.
2. Open the URL in a mobile browser (Chrome, Edge, Safari, etc.).
3. After a few seconds the browser will fire `beforeinstallprompt` and a small **Install App** button will appear at the bottom‑right of the screen (only on devices with a narrow viewport).
4. Tap the button or choose **Add to Home screen** from the browser menu. The app will launch in **standalone** mode from then on and continue to work offline.

> Note: `start_url` and `scope` are now defined as `.` in `vite.config.js` so the app installs correctly regardless of the hosting path.

You can also install the app manually through the browser's menu on desktop, but the custom button is intentionally hidden on wider screens.

## �📦 Asset Mapping Workflow

The hybrid asset mapping system uses Tesseract.js OCR with manual verification:

### Quick Start: 3-Step Process

**Total time: ~30-50 minutes**

#### Step 1: Generate CSV with OCR (15-20 min)
```powershell
npm run map-assets
```
✅ Processes 1,020 images and creates `tools/asset-review.csv`

#### Step 2: Manual Review (10-30 min)
1. Open `tools/asset-review.csv` in Excel/Google Sheets
2. Review rows with confidence < 70%
3. Correct `manualLabel` column where needed
4. Mark as `verified = yes`
5. Save file

#### Step 3: Generate Manifest (2 min)
```powershell
node tools/generate-manifest.js
```
✅ Creates `src/data/signs-manifest.json` for production

**For detailed instructions, see [ASSET_MAPPING_GUIDE.md](./ASSET_MAPPING_GUIDE.md)**

### What Each Tool Does

- **asset-mapper.js** - Runs Tesseract.js OCR on sign images
- **generate-manifest.js** - Converts reviewed CSV to JSON manifest
- **generate-icons.html** - (Optional) Create icons from SVG template

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite 5.4** | Build system with code splitting |
| **IndexedDB (idb)** | 50MB offline storage with Blob caching |
| **Tesseract.js** | AI-powered OCR for asset categorization |
| **GSAP 3.12** | Smooth animations and transitions |
| **QRCode 1.5** | Certificate QR codes linking to game site |
| **Workbox (PWA)** | Service worker with cache strategies |
| **GitHub Actions** | Automated CI/CD to GitHub Pages |

## 🎮 Badge System

### Tiers & Points

- **Bronze** - 5 points each (First Sign, Five Signs, etc.)
- **Silver** - 10 points (Alphabet Master, Speed Demon, etc.)
- **Gold** - 25 points (Perfectionist, Twenty Streak, etc.)
- **Platinum** - 50 points (Grand Master, Weekly Warrior, etc.)
- **Diamond** - 100 points (Legendary achievements)

### Leaderboard Ranks

| Rank | Required Points |
|------|-----------------|
| Beginner | 0-24 |
| Rising Star | 25-99 |
| Advanced Learner | 100-249 |
| Expert Signer | 250-499 |
| Elite Champion | 500-999 |
| Legendary Master | 1000+ |

### Progressive Reveal

Players see their **top 3 unlockable badges** within ±2 levels, sorted by completion progress. This maintains motivation without overwhelming.

## 📜 Certificate Generation

Certificates include:

- **Cruze Tech Branding** - "Tech For You, Tech For Me" tagline
- **Player Stats** - XP, badges earned, badge points, rank
- **Top 5 Badges** - Visual showcase of achievements
- **QR Code** - Links to `https://games.cruze-tech.com/signmaster`
- **Unique ID** - Format: `SM-{timestamp}-{hash}`
- **Verification Link** - `games.cruze-tech.com/signmaster`

Certificates are **motivational** (not formal accreditation) and link back to the game to encourage sharing.

## 🔧 Development

### Project Structure

```
SignMaster/
├── src/
│   ├── components/        # UI components (WIP)
│   ├── services/          # Core services
│   │   ├── AssetLoader.js       # Lazy loading with caching
│   │   ├── BadgeManager.js      # Badge tracking & unlock
│   │   ├── CacheManager.js      # IndexedDB wrapper
│   │   ├── CertificateGenerator.js  # Canvas certificates
│   │   ├── ManifestLoader.js    # Signs manifest loader
│   │   └── StateManager.js      # Game state management
│   ├── data/              # Static data (badges, manifest)
│   ├── styles/            # CSS modules (WIP)
│   └── utils/             # Helper functions (WIP)
├── public/                # Static assets
│   └── manifest.json      # PWA manifest
├── tools/                 # Build tools
│   ├── asset-mapper.js          # OCR processing
│   └── generate-manifest.js     # Manifest generator
├── assets/
│   └── all_extracted_signs/     # 1,020 PNG sign images
└── dist/                  # Build output (ignored)
```

### NPM Scripts

```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",            // Production build
  "preview": "vite preview",        // Preview production build
  "map-assets": "node tools/asset-mapper.js",  // Run OCR
  "deploy": "npm run build && gh-pages -d dist" // Manual deploy
}
```

### Environment Variables

No secrets required! All configuration is in `vite.config.js`:

- **Base Path**: `/SignMaster/` (GitHub Pages)
- **Build Target**: ES2020
- **Chunk Size Warning**: 500KB
- **PWA Cache**: 1,100 sign images

## 🚢 Deployment

### Automatic (Recommended)

Push to `main` branch triggers GitHub Actions:

1. `npm ci` - Clean install dependencies
2. `npm run build` - Build to `dist/`
3. Deploy to `gh-pages` branch
4. Live at `https://cruze-tech.github.io/SignMaster/`

### Manual Deployment

```powershell
npm run deploy
```

This builds and pushes to `gh-pages` branch using the `gh-pages` package.

### GitHub Pages Setup

1. Repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Custom domain (optional): `games.cruze-tech.com`

## 🎓 Educational Use

SignMaster is designed for **real-world classroom use** with:

- **Offline-first** - Works without internet after first load
- **Device caching** - Images stored locally for fast access
- **Progress persistence** - Students can resume on any device
- **Motivational feedback** - Badges and certificates encourage return visits
- **Accessibility** - Voice narration and high contrast modes

### Classroom Deployment

1. Students visit `games.cruze-tech.com/signmaster` once to cache
2. App works offline for subsequent sessions
3. Progress auto-saves to device (no accounts needed)
4. Teachers can track engagement via certificate generation

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- [ ] Add more sign categories (Sports, Weather, Days/Months)
- [ ] Implement voice recording for student practice
- [ ] Create teacher dashboard for class progress
- [ ] Add multiplayer sign matching games
- [ ] Improve OCR accuracy for difficult signs
- [ ] Translate UI to Luganda and other local languages

## 📄 License

MIT License - See LICENSE file

## 🌐 Credits

**Cruze Tech** - "Tech For You, Tech For Me"

- Website: [cruze-tech.com](https://cruze-tech.com)
- Games: [games.cruze-tech.com](https://games.cruze-tech.com)
- Repository: [github.com/cruze-tech/SignMaster](https://github.com/cruze-tech/SignMaster)

## 📞 Support

For issues or questions:

- GitHub Issues: [github.com/cruze-tech/SignMaster/issues](https://github.com/cruze-tech/SignMaster/issues)
- Email: contact@cruze-tech.com

---

Made with ❤️ for Uganda's Deaf community
