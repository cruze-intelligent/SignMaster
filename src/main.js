/**
 * SignMaster Main Entry Point
 * 
 * Initializes all services and starts the application
 */

// Import styles
import './styles/theme.css';
import './styles/enhancements.css';

// Import services
import cacheManager from './services/CacheManager.js';
import stateManager from './services/StateManager.js';
import badgeManager from './services/BadgeManager.js';
import manifestLoader from './services/ManifestLoader.js';
import assetLoader from './services/AssetLoader.js';
import certificateGenerator from './services/CertificateGenerator.js';
import searchEngine from './services/SearchEngine.js';

// Import components
import { SignGrid } from './components/SignCard.js';
import badgeUnlockModal from './components/BadgeUnlock.js';

/**
 * Main Application Class
 */
class SignMasterApp {
  constructor() {
    this.initialized = false;
    this.signGrid = null;
    this.currentCategory = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    console.log('🚀 Initializing SignMaster...');

    try {
      // Show loading screen
      this.showLoader();

      // Initialize services
      await Promise.all([
        cacheManager.init(),
        stateManager.init(),
        assetLoader.init(),
        manifestLoader.loadManifest()
      ]);

      // Initialize search engine with manifest
      const manifest = manifestLoader.getManifest();
      await searchEngine.init(manifest);

      // Update daily streak
      await stateManager.updateDailyStreak();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize UI
      this.initUI();

      this.initialized = true;
      console.log('✅ SignMaster initialized successfully');

      // Hide loading screen
      this.hideLoader();

      // Show welcome screen
      this.showWelcome();

    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.showError('Failed to initialize app. Please refresh.');
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Badge unlocked
    stateManager.on('badgeUnlocked', (badge) => {
      badgeUnlockModal.show(badge);
    });

    // Level up
    stateManager.on('levelUp', (data) => {
      this.showLevelUp(data);
    });

    // XP gained
    stateManager.on('xpGained', (data) => {
      this.updateXPDisplay(data.newXP, data.level);
    });

    // Sign completed
    stateManager.on('signCompleted', (data) => {
      this.onSignCompleted(data);
    });

    // Listen for badge manager unlocks
    badgeManager.on('badgeUnlocked', async (badge) => {
      await badgeUnlockModal.show(badge);
    });
  }

  /**
   * Initialize UI components
   */
  initUI() {
    // Initialize sign grid
    const gridContainer = document.getElementById('sign-grid');
    if (gridContainer) {
      this.signGrid = new SignGrid(gridContainer);
    }

    // Setup navigation
    this.setupNavigation();

    // Update progress display
    this.updateProgressDisplay();
  }

  /**
   * Setup navigation handlers
   */
  setupNavigation() {
    const navButtons = document.querySelectorAll('[data-nav]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const button = e.target.closest('[data-nav]');
        const screen = button?.dataset.nav;
        if (screen) this.navigate(screen);
      });
    });
  }

  /**
   * Navigate to screen
   */
  navigate(screen) {
    console.log(`Navigate to: ${screen}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
      s.style.display = 'none';
    });

    // Show requested screen
    const targetScreen = document.getElementById(`${screen}-screen`);
    if (targetScreen) {
      targetScreen.style.display = 'block';
    }

    // Update active nav button
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-nav="${screen}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Load screen content
    switch(screen) {
      case 'welcome':
        // No special loading needed
        break;
      case 'categories':
        this.loadCategories();
        break;
      case 'search':
        this.loadSearch();
        break;
      case 'quiz':
        this.loadQuiz();
        break;
      case 'progress':
        this.loadProgress();
        break;
      case 'badges':
        this.loadBadges();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  /**
   * Load categories screen
   */
  async loadCategories() {
    const categories = await manifestLoader.getCategories();
    const container = document.getElementById('categories-list');
    
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <div class="category-card" data-category="${cat}">
        <h3>${cat}</h3>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const category = card.dataset.category;
        this.startCategory(category);
      });
    });
  }

  /**
   * Start learning a category
   */
  async startCategory(category) {
    console.log(`Starting category: ${category}`);
    
    this.currentCategory = category;
    
    // Load signs for category
    const signs = await manifestLoader.getCategorySigns(category);
    
    // Navigate to game screen
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('game-screen').style.display = 'block';
    
    // Update category title
    const titleEl = document.getElementById('category-title');
    if (titleEl) {
      titleEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    // Setup back button
    const backBtn = document.getElementById('back-to-categories');
    if (backBtn) {
      backBtn.onclick = () => this.navigate('categories');
    }
    
    // Render signs
    if (this.signGrid) {
      await this.signGrid.renderSigns(signs, category);
    }
  }

  /**
   * Load search screen
   */
  loadSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsEl = document.getElementById('search-suggestions');
    const resultsEl = document.getElementById('search-results');

    if (!searchInput || !searchBtn) return;

    // Show popular suggestions initially
    this.showSearchSuggestions([]);

    // Search button handler
    searchBtn.onclick = () => this.performSearch(searchInput.value);

    // Enter key handler
    searchInput.onkeyup = (e) => {
      if (e.key === 'Enter') {
        this.performSearch(searchInput.value);
      } else {
        // Show suggestions as user types
        const query = searchInput.value.trim();
        if (query.length > 0) {
          const suggestions = searchEngine.getSuggestions(query, 8);
          this.showSearchSuggestions(suggestions);
        } else {
          this.showSearchSuggestions([]);
        }
      }
    };

    // Clear results when navigating to search
    resultsEl.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon">🔍</div>
        <h3>Search for Signs</h3>
        <p>Enter a word, letter, number, or phrase to find its sign language translation</p>
      </div>
    `;
  }

  /**
   * Show search suggestions
   */
  showSearchSuggestions(suggestions) {
    const suggestionsEl = document.getElementById('search-suggestions');
    if (!suggestionsEl) return;

    if (suggestions.length === 0) {
      // Show popular terms
      const popular = searchEngine.getPopularTerms(12);
      suggestionsEl.innerHTML = `
        <h4>Popular Searches</h4>
        <div class="suggestion-chips">
          ${popular.map(term => `
            <button class="suggestion-chip" data-term="${term}">
              ${term}
            </button>
          `).join('')}
        </div>
      `;
      suggestionsEl.classList.add('visible');
    } else {
      suggestionsEl.innerHTML = `
        <h4>Suggestions</h4>
        <div class="suggestion-chips">
          ${suggestions.map(term => `
            <button class="suggestion-chip" data-term="${term}">
              ${term}
            </button>
          `).join('')}
        </div>
      `;
      suggestionsEl.classList.add('visible');
    }

    // Add click handlers to suggestion chips
    suggestionsEl.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.onclick = () => {
        const term = chip.dataset.term;
        document.getElementById('search-input').value = term;
        this.performSearch(term);
      };
    });
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl || !query) return;

    const results = searchEngine.search(query);

    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">😔</div>
          <h3>No Results Found</h3>
          <p>No signs match "${query}". Try different words or browse categories.</p>
          <button class="btn-primary" data-nav="categories">Browse Categories</button>
        </div>
      `;
      
      // Add navigation handler
      const browseBtn = resultsEl.querySelector('[data-nav]');
      if (browseBtn) {
        browseBtn.onclick = () => this.navigate('categories');
      }
    } else {
      resultsEl.innerHTML = `
        <div class="search-results-header">
          <h3>Found ${results.length} sign${results.length > 1 ? 's' : ''} for "${query}"</h3>
        </div>
        <div class="search-results-grid" id="search-results-grid"></div>
      `;

      // Render signs using SignGrid
      const gridEl = document.getElementById('search-results-grid');
      if (gridEl && this.signGrid) {
        // Temporarily replace grid container
        const originalContainer = this.signGrid.container;
        this.signGrid.container = gridEl;
        await this.signGrid.renderSigns(results, 'search-results');
        this.signGrid.container = originalContainer;
      }
    }
  }

  /**
   * Load quiz screen
   */
  loadQuiz() {
    // Quiz mode is placeholder for now
    console.log('Quiz mode - Coming soon!');
  }

  /**
   * Load progress screen
   */
  async loadProgress() {
    const state = stateManager.getState();
    const stats = stateManager.getStats();
    const badgeStats = await badgeManager.getBadgeStats();
    
    const container = document.getElementById('progress-content');
    if (!container) return;

    container.innerHTML = `
      <div class="progress-summary">
        <h2>Your Progress</h2>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-value">${state.xp}</div>
            <div class="stat-label">Total XP</div>
          </div>
          <div class="stat">
            <div class="stat-value">${state.level}</div>
            <div class="stat-label">Level</div>
          </div>
          <div class="stat">
            <div class="stat-value">${stats.signsLearned}</div>
            <div class="stat-label">Signs Learned</div>
          </div>
          <div class="stat">
            <div class="stat-value">${badgeStats.total}</div>
            <div class="stat-label">Badges Earned</div>
          </div>
        </div>
        
        <div class="rank-display">
          <h3>Rank: ${badgeStats.rank.name}</h3>
          <div class="rank-icon">${badgeStats.rank.icon}</div>
        </div>

        <button id="download-certificate" class="btn-primary">
          📜 Download Certificate
        </button>
      </div>
    `;

    // Certificate download handler
    document.getElementById('download-certificate')?.addEventListener('click', async () => {
      try {
        const earnedBadges = await badgeManager.getEarnedBadges();
        await certificateGenerator.generateCertificate({
          playerName: state.playerName,
          xp: state.xp,
          badges: earnedBadges,
          stats: badgeStats
        });
      } catch (error) {
        console.error('Certificate generation error:', error);
      }
    });
  }

  /**
   * Load badges screen
   */
  async loadBadges() {
    const allBadges = await badgeManager.getEarnedBadges();
    const progressive = await badgeManager.getProgressiveReveal();
    
    const container = document.getElementById('badges-content');
    if (!container) return;

    // Group by tier
    const byTier = {};
    allBadges.forEach(badge => {
      if (!byTier[badge.tier]) byTier[badge.tier] = [];
      byTier[badge.tier].push(badge);
    });

    let html = '<h2>Your Badges</h2>';
    
    // Progressive reveal
    if (progressive.length > 0) {
      html += `<div class="progressive-badges">
        <h3>Next to Unlock</h3>
        ${progressive.map(b => `
          <div class="badge-preview">
            <div class="badge-icon">${b.badge.icon}</div>
            <div class="badge-name">${b.badge.name}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${b.progress}%"></div>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    // All badges by tier
    Object.entries(byTier).forEach(([tier, badges]) => {
      html += `<div class="badge-tier">
        <h3>${tier.toUpperCase()}</h3>
        <div class="badge-grid">
          ${badges.map(b => `
            <div class="badge-card ${b.earnedAt ? 'earned' : 'locked'}">
              <div class="badge-icon">${b.icon}</div>
              <div class="badge-name">${b.name}</div>
              ${b.earnedAt ? `<div class="badge-points">+${b.points}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;
    });

    container.innerHTML = html;
  }

  /**
   * Load settings screen
   */
  loadSettings() {
    const state = stateManager.getState();
    const container = document.getElementById('settings-content');
    
    if (!container) return;

    container.innerHTML = `
      <h2>Settings</h2>
      <div class="settings-form">
        <label>
          <input type="checkbox" id="setting-sound" ${state.settings.soundEnabled ? 'checked' : ''}>
          Sound Effects
        </label>
        <label>
          <input type="checkbox" id="setting-voice" ${state.settings.voiceEnabled ? 'checked' : ''}>
          Voice Narration
        </label>
        <label>
          <input type="checkbox" id="setting-contrast" ${state.settings.highContrast ? 'checked' : ''}>
          High Contrast Mode
        </label>
      </div>
    `;

    // Settings handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', async (e) => {
        const setting = e.target.id.replace('setting-', '');
        const value = e.target.checked;
        
        const updates = {};
        if (setting === 'sound') updates.soundEnabled = value;
        if (setting === 'voice') updates.voiceEnabled = value;
        if (setting === 'contrast') {
          updates.highContrast = value;
          document.body.classList.toggle('high-contrast', value);
        }
        
        await stateManager.updateSettings(updates);
      });
    });
  }

  /**
   * Update progress display
   */
  updateProgressDisplay() {
    const state = stateManager.getState();
    
    const xpDisplay = document.getElementById('xp-display');
    const levelDisplay = document.getElementById('level-display');
    
    if (xpDisplay) xpDisplay.textContent = state.xp;
    if (levelDisplay) levelDisplay.textContent = state.level;
  }

  /**
   * Update XP display
   */
  updateXPDisplay(xp, level) {
    const xpDisplay = document.getElementById('xp-display');
    const levelDisplay = document.getElementById('level-display');
    
    if (xpDisplay) xpDisplay.textContent = xp;
    if (levelDisplay) levelDisplay.textContent = level;
  }

  /**
   * Show level up celebration
   */
  showLevelUp(data) {
    console.log('🎉 Level Up!', data);
    // TODO: Implement level up animation
  }

  /**
   * Handle sign completed
   */
  onSignCompleted(data) {
    console.log('Sign completed:', data);
    // TODO: Show feedback animation
  }

  /**
   * Show loading screen
   */
  showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
  }

  /**
   * Hide loading screen
   */
  hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }

  /**
   * Show welcome screen
   */
  showWelcome() {
    this.navigate('welcome');
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(message); // TODO: Better error UI
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new SignMasterApp();
    app.init();
  });
} else {
  const app = new SignMasterApp();
  app.init();
}

// Export for debugging
window.signMasterApp = new SignMasterApp();
