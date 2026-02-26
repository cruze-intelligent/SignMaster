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
import translationService from './services/TranslationService.js';

// PWA install handling --------------------------------------------------
let deferredPrompt = null;

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent) || window.matchMedia('(max-width: 768px)').matches;
}

function showInstallButton() {
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'block';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (isMobile()) {
    showInstallButton();
  }
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed');
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.createElement('button');
  installBtn.id = 'install-app-btn';
  installBtn.className = 'btn-primary btn-install';
  installBtn.textContent = 'Install App';
  installBtn.style.display = 'none';
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('📥 Install outcome:', outcome);
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
  document.body.appendChild(installBtn);
});


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
        manifestLoader.loadManifest(),
        translationService.init()
      ]);

      // Listen for language changes
      translationService.onLanguageChange(() => {
        this.updateTranslations();
      });

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
    switch (screen) {
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
    console.log('🔵 Loading categories...');
    const categories = await manifestLoader.getCategories();
    console.log('📋 Categories loaded:', categories);
    const container = document.getElementById('categories-list');

    if (!container) {
      console.error('❌ Categories container not found!');
      return;
    }

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
    console.log(`🟢 Starting category: ${category}`);

    this.currentCategory = category;

    // Load signs for category
    const signs = await manifestLoader.getCategorySigns(category);
    console.log(`📝 Loaded ${signs.length} signs for category: ${category}`);

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
      console.log('✅ Signs rendered!');
    } else {
      console.error('❌ SignGrid not initialized!');
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

    // Update placeholder based on language
    searchInput.placeholder = translationService.getSearchPlaceholder();

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
    const emptyTitle = translationService.getLanguage() === 'ach' ? 'Yeny Lanyut' : 'Search for Signs';
    const emptyDesc = translationService.getLanguage() === 'ach'
      ? 'Ket lok, ceke, namba, onyo lok me nongo lanyut mere'
      : 'Enter a word, letter, number, or phrase to find its sign language translation';

    resultsEl.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon">🔍</div>
        <h3>${emptyTitle}</h3>
        <p>${emptyDesc}</p>
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

    // Translate query if in Acholi mode
    let searchQuery = query;
    let translatedFrom = null;

    if (translationService.getLanguage() === 'ach') {
      const translated = await translationService.translateSearchQuery(query);
      if (translated.toLowerCase() !== query.toLowerCase()) {
        translatedFrom = query;
        searchQuery = translated;
      }
    }

    const results = searchEngine.search(searchQuery);

    if (results.length === 0) {
      const noResultsMsg = translatedFrom
        ? `No signs match "${query}" (searched: "${searchQuery}").`
        : `No signs match "${query}".`;

      resultsEl.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">😔</div>
          <h3>${translationService.getLanguage() === 'ach' ? 'Pe Ononge' : 'No Results Found'}</h3>
          <p>${noResultsMsg} ${translationService.getLanguage() === 'ach' ? 'Tem lok mukene onyo nen buce.' : 'Try different words or browse categories.'}</p>
          <button class="btn-primary" data-nav="categories">${translationService.t('categories')}</button>
        </div>
      `;

      // Add navigation handler
      const browseBtn = resultsEl.querySelector('[data-nav]');
      if (browseBtn) {
        browseBtn.onclick = () => this.navigate('categories');
      }
    } else {
      const headerText = translatedFrom
        ? `Found ${results.length} sign${results.length > 1 ? 's' : ''} for "${query}" → "${searchQuery}"`
        : `Found ${results.length} sign${results.length > 1 ? 's' : ''} for "${query}"`;

      resultsEl.innerHTML = `
        <div class="search-results-header">
          <h3>${headerText}</h3>
          ${translatedFrom ? `<p class="translation-note">🔤 Translated from Acholi</p>` : ''}
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
  async loadQuiz() {
    const setupEl = document.getElementById('quiz-setup');
    const activeEl = document.getElementById('quiz-active');
    const resultsEl = document.getElementById('quiz-results');

    // Reset to setup view
    if (setupEl) setupEl.style.display = 'block';
    if (activeEl) activeEl.style.display = 'none';
    if (resultsEl) resultsEl.style.display = 'none';

    // Populate category dropdown
    const categorySelect = document.getElementById('quiz-category');
    if (categorySelect) {
      const categories = await manifestLoader.getCategories();
      // Keep the "all" option, remove old dynamic options
      while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
      }
      for (const cat of categories) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categorySelect.appendChild(opt);
      }
    }

    // Start button handler
    const startBtn = document.getElementById('quiz-start-btn');
    if (startBtn) {
      startBtn.onclick = () => this.startQuiz();
    }

    // Retry button handler
    const retryBtn = document.getElementById('quiz-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => this.startQuiz();
    }
  }

  /**
   * Start a quiz session
   */
  async startQuiz() {
    const categorySelect = document.getElementById('quiz-category');
    const countSelect = document.getElementById('quiz-count');
    const selectedCategory = categorySelect?.value || 'all';
    const questionCount = parseInt(countSelect?.value || '10');

    const manifest = await manifestLoader.loadManifest();

    // Build per-category sign pools for same-category wrong answers
    const categoryPools = {};
    let allSigns = [];
    for (const [catKey, cat] of Object.entries(manifest.categories)) {
      const valid = cat.signs.filter(s => s.label && !s.label.startsWith('Sign '));
      categoryPools[catKey] = valid;
      valid.forEach(s => { s._category = catKey; });
      allSigns.push(...valid);
    }

    // Build question pool based on selection
    let signPool;
    if (selectedCategory === 'all') {
      signPool = allSigns;
    } else {
      signPool = categoryPools[selectedCategory] || [];
    }

    // Need at least 4 signs for multiple-choice options
    if (signPool.length < 4) {
      const feedbackEl = document.getElementById('quiz-feedback');
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.textContent = 'Not enough signs in this category for a quiz. Try "All Categories"!';
        feedbackEl.className = 'quiz-feedback quiz-feedback-wrong';
      }
      return;
    }

    // Shuffle and pick questions
    const shuffled = this.shuffleArray([...signPool]);
    const questions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Store quiz state
    this.quizState = {
      questions,
      signPool,
      categoryPools,
      allSigns,
      currentIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      totalXP: 0,
      comboMultiplier: 1,
      selectedCategory,
      questionStartTime: null
    };

    // Switch to active view
    document.getElementById('quiz-setup').style.display = 'none';
    document.getElementById('quiz-active').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';

    this.showQuizQuestion();
  }

  /**
   * Get combo multiplier based on streak
   */
  getComboMultiplier(streak) {
    if (streak >= 10) return { mult: 5, label: '🔥🔥🔥 5× ON FIRE!', cssClass: 'combo-fire' };
    if (streak >= 5) return { mult: 3, label: '🔥🔥 3× Combo!', cssClass: 'combo-hot' };
    if (streak >= 3) return { mult: 2, label: '🔥 2× Combo!', cssClass: 'combo-warm' };
    return { mult: 1, label: '', cssClass: '' };
  }

  /**
   * Get time bonus based on answer speed
   */
  getTimeBonus(elapsedMs) {
    if (elapsedMs < 3000) return { bonus: 5, label: '⚡ Speed Bonus +5!' };
    if (elapsedMs < 6000) return { bonus: 2, label: '⏱️ Quick +2!' };
    return { bonus: 0, label: '' };
  }

  /**
   * Show the current quiz question
   */
  async showQuizQuestion() {
    const qs = this.quizState;
    const question = qs.questions[qs.currentIndex];

    // Update progress
    const total = qs.questions.length;
    document.getElementById('quiz-question-num').textContent = `${qs.currentIndex + 1}/${total}`;
    document.getElementById('quiz-score-display').textContent = `Score: ${qs.score}`;
    const combo = this.getComboMultiplier(qs.streak);
    document.getElementById('quiz-streak-display').textContent = combo.label || `🔥 ${qs.streak}`;
    document.getElementById('quiz-progress-fill').style.width = `${((qs.currentIndex) / total) * 100}%`;

    // Hide feedback, next button, and combo overlay
    document.getElementById('quiz-feedback').style.display = 'none';
    document.getElementById('quiz-next-btn').style.display = 'none';
    const comboOverlay = document.getElementById('quiz-combo-overlay');
    if (comboOverlay) comboOverlay.style.display = 'none';

    // Show question prompt
    let promptEl = document.getElementById('quiz-prompt');
    if (!promptEl) {
      const activeEl = document.getElementById('quiz-active');
      promptEl = document.createElement('div');
      promptEl.id = 'quiz-prompt';
      promptEl.className = 'quiz-prompt';
      const imgContainer = document.getElementById('quiz-sign-image')?.parentElement;
      if (imgContainer) imgContainer.parentElement.insertBefore(promptEl, imgContainer);
    }
    promptEl.textContent = '🤔 What sign is this?';

    // Load image
    const imgEl = document.getElementById('quiz-sign-image');
    const loaderEl = document.getElementById('quiz-image-loader');
    if (loaderEl) loaderEl.style.display = 'flex';
    imgEl.style.opacity = '0';

    try {
      const url = await assetLoader.loadSignImage(question.filename, qs.selectedCategory);
      imgEl.src = url;
      imgEl.style.opacity = '1';
    } catch (e) {
      imgEl.alt = 'Image unavailable';
      imgEl.style.opacity = '1';
    }
    if (loaderEl) loaderEl.style.display = 'none';

    // Generate 4 options — same category when possible
    const questionCat = question._category || qs.selectedCategory;
    let wrongPool = (qs.categoryPools[questionCat] || qs.allSigns)
      .filter(s => s.id !== question.id);

    // If same-category pool has < 3, supplement from all signs
    if (wrongPool.length < 3) {
      const extra = qs.allSigns.filter(s => s.id !== question.id && !wrongPool.find(w => w.id === s.id));
      wrongPool = [...wrongPool, ...extra];
    }

    const wrongAnswers = this.shuffleArray([...wrongPool]).slice(0, 3);
    const options = this.shuffleArray([question, ...wrongAnswers]);

    // Render options
    const optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = '';
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = opt.label;
      btn.dataset.signId = opt.id;
      btn.onclick = () => this.handleQuizAnswer(opt.id === question.id, btn, question);
      optionsEl.appendChild(btn);
    }

    // Start timer for time bonus
    qs.questionStartTime = Date.now();

    // Show timer bar
    let timerBar = document.getElementById('quiz-timer-bar');
    if (!timerBar) {
      timerBar = document.createElement('div');
      timerBar.id = 'quiz-timer-bar';
      timerBar.className = 'quiz-timer-bar';
      timerBar.innerHTML = '<div class="quiz-timer-fill" id="quiz-timer-fill"></div>';
      optionsEl.parentElement.insertBefore(timerBar, optionsEl);
    }
    const timerFill = document.getElementById('quiz-timer-fill');
    timerFill.style.width = '100%';
    timerFill.style.transition = 'none';
    requestAnimationFrame(() => {
      timerFill.style.transition = 'width 10s linear';
      timerFill.style.width = '0%';
    });
  }

  /**
   * Handle quiz answer selection
   */
  async handleQuizAnswer(isCorrect, btnEl, correctSign) {
    const qs = this.quizState;
    const elapsed = Date.now() - (qs.questionStartTime || Date.now());

    // Stop timer
    const timerFill = document.getElementById('quiz-timer-fill');
    if (timerFill) {
      timerFill.style.transition = 'none';
      timerFill.style.width = timerFill.getBoundingClientRect().width + 'px';
    }

    // Disable all buttons
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.signId === correctSign.id) {
        btn.classList.add('quiz-option-correct');
      }
    });

    const feedbackEl = document.getElementById('quiz-feedback');
    feedbackEl.style.display = 'block';

    if (isCorrect) {
      btnEl.classList.add('quiz-option-correct');
      qs.correct++;
      qs.streak++;
      if (qs.streak > qs.bestStreak) qs.bestStreak = qs.streak;

      // Combo multiplier
      const combo = this.getComboMultiplier(qs.streak);
      qs.comboMultiplier = combo.mult;

      // Time bonus
      const timeBonus = this.getTimeBonus(elapsed);

      // Score: (base 10) × combo + time bonus
      const basePoints = 10;
      const points = (basePoints * combo.mult) + timeBonus.bonus;
      qs.score += points;
      qs.totalXP += points;

      // Build feedback message
      let feedbackParts = [`✅ Correct! +${points} pts`];
      if (combo.mult > 1) feedbackParts.push(combo.label);
      if (timeBonus.bonus > 0) feedbackParts.push(timeBonus.label);
      feedbackEl.innerHTML = feedbackParts.join(' &nbsp;·&nbsp; ');
      feedbackEl.className = 'quiz-feedback quiz-feedback-correct';

      // Show confetti
      this.showConfetti();

      // Show combo overlay if multiplier active
      if (combo.mult > 1) {
        this.showComboOverlay(combo);
      }

      // Add XP
      await stateManager.addXP(points, 'quiz');

      // Check streak badges
      if (qs.streak >= 5) await badgeManager.checkAndUnlockBadge('five_streak', stateManager.getStats());
      if (qs.streak >= 10) await badgeManager.checkAndUnlockBadge('ten_streak', stateManager.getStats());
      if (qs.streak >= 20) await badgeManager.checkAndUnlockBadge('twenty_streak', stateManager.getStats());
    } else {
      btnEl.classList.add('quiz-option-wrong');
      const oldStreak = qs.streak;
      qs.streak = 0;
      qs.comboMultiplier = 1;

      // Educational feedback
      feedbackEl.innerHTML = `❌ The correct answer is <strong>"${correctSign.label}"</strong>. Look at the hand shape carefully!`;
      feedbackEl.className = 'quiz-feedback quiz-feedback-wrong';

      // Shake animation on wrong answer
      btnEl.style.animation = 'shake 0.4s ease';
      if (oldStreak >= 3) {
        this.showComboLost();
      }
    }

    // Update displays
    document.getElementById('quiz-score-display').textContent = `Score: ${qs.score}`;
    const newCombo = this.getComboMultiplier(qs.streak);
    document.getElementById('quiz-streak-display').textContent = newCombo.label || `🔥 ${qs.streak}`;

    // Show next button
    const nextBtn = document.getElementById('quiz-next-btn');
    if (qs.currentIndex < qs.questions.length - 1) {
      nextBtn.textContent = 'Next Question →';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        qs.currentIndex++;
        this.showQuizQuestion();
      };
    } else {
      nextBtn.textContent = 'See Results 🏆';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => this.showQuizResults();
    }
  }

  /**
   * Show confetti burst animation
   */
  showConfetti() {
    const container = document.getElementById('quiz-active');
    if (!container) return;
    const emojis = ['🤟', '✨', '🎉', '⭐', '🌟', '💫'];
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.left = `${20 + Math.random() * 60}%`;
      particle.style.animationDelay = `${Math.random() * 0.3}s`;
      particle.style.fontSize = `${16 + Math.random() * 16}px`;
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1500);
    }
  }

  /**
   * Show combo multiplier overlay
   */
  showComboOverlay(combo) {
    let overlay = document.getElementById('quiz-combo-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quiz-combo-overlay';
      document.getElementById('quiz-active')?.appendChild(overlay);
    }
    overlay.textContent = combo.label;
    overlay.className = `quiz-combo-overlay ${combo.cssClass}`;
    overlay.style.display = 'block';
    overlay.style.animation = 'none';
    requestAnimationFrame(() => {
      overlay.style.animation = 'comboPopIn 0.6s ease forwards';
    });
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
  }

  /**
   * Show combo lost message
   */
  showComboLost() {
    let overlay = document.getElementById('quiz-combo-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quiz-combo-overlay';
      document.getElementById('quiz-active')?.appendChild(overlay);
    }
    overlay.textContent = '💔 Combo Lost!';
    overlay.className = 'quiz-combo-overlay combo-lost';
    overlay.style.display = 'block';
    overlay.style.animation = 'none';
    requestAnimationFrame(() => {
      overlay.style.animation = 'comboPopIn 0.6s ease forwards';
    });
    setTimeout(() => { overlay.style.display = 'none'; }, 1200);
  }

  /**
   * Show quiz results
   */
  async showQuizResults() {
    const qs = this.quizState;
    const total = qs.questions.length;
    const pct = Math.round((qs.correct / total) * 100);

    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';

    // Icon and title based on performance
    const icon = document.getElementById('quiz-results-icon');
    const title = document.getElementById('quiz-results-title');
    if (pct === 100) {
      icon.textContent = '💎';
      title.textContent = 'Perfect Score!';
    } else if (pct >= 80) {
      icon.textContent = '🏆';
      title.textContent = 'Excellent!';
    } else if (pct >= 60) {
      icon.textContent = '⭐';
      title.textContent = 'Good Job!';
    } else if (pct >= 40) {
      icon.textContent = '📚';
      title.textContent = 'Keep Practicing!';
    } else {
      icon.textContent = '💪';
      title.textContent = 'Don\'t Give Up!';
    }

    document.getElementById('quiz-final-score').textContent = qs.score;
    document.getElementById('quiz-correct-count').textContent = `${qs.correct}/${total}`;
    document.getElementById('quiz-best-streak').textContent = qs.bestStreak;
    document.getElementById('quiz-xp-earned').textContent = `+${qs.totalXP} XP`;

    // Check perfect score badge
    if (pct === 100) {
      await badgeManager.checkAndUnlockBadge('perfect_match', stateManager.getStats());
    }

    // Update header XP display
    this.updateXPDisplay(stateManager.getState().xp, stateManager.getState().level);
  }

  /**
   * Shuffle an array (Fisher-Yates)
   */
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Load progress screen with polished UI
   */
  async loadProgress() {
    const state = stateManager.getState();
    const stats = stateManager.getStats();
    const badgeStats = await badgeManager.getBadgeStats();
    const manifest = manifestLoader.getManifest();
    const t = (key) => translationService.t(key);

    // Calculate additional stats — manifest.categories is an object keyed by category name
    const categories = manifest?.categories || {};
    const categoryNames = Object.keys(categories);
    const totalSigns = categoryNames.reduce((sum, cat) => sum + (categories[cat]?.signs?.length || 0), 0);
    const signsLearned = stats.signsLearned || 0;
    const progressPercent = Math.round((signsLearned / totalSigns) * 100);
    const categoriesTotal = categoryNames.length || 12;
    const categoriesCompleted = state.stats?.categoriesCompleted?.length || 0;
    const accuracy = state.stats?.averageAccuracy || 0;
    const dailyStreak = state.stats?.dailyStreak || 0;

    const container = document.getElementById('progress-content');
    if (!container) return;

    container.innerHTML = `
      <div class="progress-dashboard">
        <!-- Hero Section -->
        <div class="progress-hero">
          <div class="progress-hero__avatar">
            <div class="avatar-circle">
              <span class="avatar-icon">${badgeStats.rank.icon}</span>
            </div>
            <div class="avatar-level">Lv.${state.level}</div>
          </div>
          <div class="progress-hero__info">
            <h2 class="player-name">${state.playerName}</h2>
            <div class="player-rank">
              <span class="rank-badge">${badgeStats.rank.icon}</span>
              <span class="rank-name">${badgeStats.rank.name}</span>
            </div>
          </div>
        </div>
        
        <!-- XP Progress Bar -->
        <div class="xp-progress-section">
          <div class="xp-header">
            <span class="xp-label">⭐ ${t('total_xp')}</span>
            <span class="xp-value">${state.xp.toLocaleString()}</span>
          </div>
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" style="width: ${Math.min(progressPercent, 100)}%"></div>
          </div>
          <div class="xp-footer">
            <span>${signsLearned} / ${totalSigns} ${t('signs_learned').toLowerCase()}</span>
            <span>${progressPercent}%</span>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-dashboard">
          <div class="stat-card stat-card--primary">
            <div class="stat-card__icon">📚</div>
            <div class="stat-card__content">
              <div class="stat-card__value">${signsLearned}</div>
              <div class="stat-card__label">${t('signs_learned')}</div>
            </div>
          </div>
          
          <div class="stat-card stat-card--secondary">
            <div class="stat-card__icon">🏆</div>
            <div class="stat-card__content">
              <div class="stat-card__value">${badgeStats.total}</div>
              <div class="stat-card__label">${t('badges_earned')}</div>
            </div>
          </div>
          
          <div class="stat-card stat-card--accent">
            <div class="stat-card__icon">🔥</div>
            <div class="stat-card__content">
              <div class="stat-card__value">${dailyStreak}</div>
              <div class="stat-card__label">${t('learning_streak')}</div>
            </div>
          </div>
          
          <div class="stat-card stat-card--success">
            <div class="stat-card__icon">🎯</div>
            <div class="stat-card__content">
              <div class="stat-card__value">${accuracy}%</div>
              <div class="stat-card__label">${t('accuracy')}</div>
            </div>
          </div>
        </div>
        
        <!-- Categories Progress -->
        <div class="categories-progress">
          <h3>📂 ${t('categories_completed')}</h3>
          <div class="categories-bar">
            <div class="categories-fill" style="width: ${(categoriesCompleted / categoriesTotal) * 100}%"></div>
          </div>
          <div class="categories-count">${categoriesCompleted} / ${categoriesTotal}</div>
        </div>
        
        <!-- Badge Points -->
        <div class="badge-points-section">
          <div class="badge-points-card">
            <span class="badge-points-icon">💎</span>
            <span class="badge-points-value">${badgeStats.points}</span>
            <span class="badge-points-label">Badge Points</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="progress-actions">
          <button id="download-certificate" class="btn-primary btn-certificate">
            <span class="btn-icon">📜</span>
            <span class="btn-text">${t('download_certificate')}</span>
          </button>
        </div>
      </div>
    `;

    // Certificate download handler
    document.getElementById('download-certificate')?.addEventListener('click', async () => {
      try {
        const earnedBadges = await badgeManager.getEarnedBadges();
        await certificateGenerator.generateCertificate({
          playerName: state.playerName,
          xp: state.xp,
          signsLearned: signsLearned,
          accuracy: accuracy,
          dailyStreak: dailyStreak,
          categoriesCompleted: categoriesCompleted,
          categoriesTotal: categoriesTotal,
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
   * Load settings screen with language option
   */
  loadSettings() {
    const state = stateManager.getState();
    const container = document.getElementById('settings-content');
    const t = (key) => translationService.t(key);
    const currentLang = translationService.getLanguage();
    const languages = translationService.getAvailableLanguages();

    if (!container) return;

    container.innerHTML = `
      <div class="settings-dashboard">
        <h2>⚙️ ${t('settings')}</h2>
        
        <!-- Player Profile Section -->
        <div class="settings-section">
          <h3>👤 ${t('player_name')}</h3>
          <div class="settings-input-group">
            <input type="text" id="player-name-input" 
                   class="settings-input" 
                   value="${state.playerName}" 
                   placeholder="${t('player_name')}" 
                   maxlength="30">
            <button id="save-name-btn" class="btn-secondary btn-sm">Save</button>
          </div>
        </div>
        
        <!-- Language Section -->
        <div class="settings-section">
          <h3>🌍 ${t('language')}</h3>
          <div class="language-selector">
            ${languages.map(lang => `
              <label class="language-option ${lang.code === currentLang ? 'active' : ''}">
                <input type="radio" name="language" value="${lang.code}" 
                       ${lang.code === currentLang ? 'checked' : ''}>
                <div class="language-option__content">
                  <span class="language-flag">${lang.code === 'en' ? '🇬🇧' : '🇺🇬'}</span>
                  <span class="language-name">${lang.name}</span>
                  <span class="language-native">${lang.native}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <!-- Preferences Section -->
        <div class="settings-section">
          <h3>🎨 Preferences</h3>
          <div class="settings-toggles">
            <label class="settings-toggle">
              <span class="toggle-icon">🔊</span>
              <span class="toggle-label">${t('sound_effects')}</span>
              <input type="checkbox" id="setting-sound" 
                     ${state.settings.soundEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            
            <label class="settings-toggle">
              <span class="toggle-icon">🗣️</span>
              <span class="toggle-label">${t('voice_narration')}</span>
              <input type="checkbox" id="setting-voice" 
                     ${state.settings.voiceEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            
            <label class="settings-toggle">
              <span class="toggle-icon">🌓</span>
              <span class="toggle-label">${t('high_contrast')}</span>
              <input type="checkbox" id="setting-contrast" 
                     ${state.settings.highContrast ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <!-- About Section -->
        <div class="settings-section settings-about">
          <h3>ℹ️ ${t('about')}</h3>
          <p class="about-text">
            SignMaster is an educational game for learning Uganda Sign Language (USL).
            Developed by <strong>Cruze Tech</strong>.
          </p>
          <p class="version-text">Version 2.0.0</p>
        </div>
      </div>
    `;

    // Player name save handler
    document.getElementById('save-name-btn')?.addEventListener('click', async () => {
      const nameInput = document.getElementById('player-name-input');
      if (nameInput && nameInput.value.trim()) {
        await stateManager.setState({ playerName: nameInput.value.trim() });
        // Show saved feedback
        const btn = document.getElementById('save-name-btn');
        btn.textContent = '✓ Saved';
        btn.classList.add('saved');
        setTimeout(() => {
          btn.textContent = 'Save';
          btn.classList.remove('saved');
        }, 2000);
      }
    });

    // Language change handler
    container.querySelectorAll('input[name="language"]').forEach(input => {
      input.addEventListener('change', async (e) => {
        const langCode = e.target.value;
        await translationService.setLanguage(langCode);

        // Update active class
        container.querySelectorAll('.language-option').forEach(opt => {
          opt.classList.toggle('active', opt.querySelector('input').value === langCode);
        });

        // Reload settings to update translations
        this.loadSettings();
      });
    });

    // Settings handlers
    container.querySelectorAll('.settings-toggle input[type="checkbox"]').forEach(input => {
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
   * Update all translations when language changes
   */
  updateTranslations() {
    // Re-render current screen if needed
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
      const screen = activeNav.dataset.nav;
      if (screen) {
        // Reload screen content with new translations
        switch (screen) {
          case 'progress':
            this.loadProgress();
            break;
          case 'settings':
            this.loadSettings();
            break;
        }
      }
    }
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
    const toast = document.createElement('div');
    toast.className = 'toast toast-levelup';
    toast.innerHTML = `
      <div class="toast-icon">🎉</div>
      <div class="toast-body">
        <strong>Level Up!</strong>
        <span>You reached Level ${data?.level || '?'}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  /**
   * Handle sign completed
   */
  onSignCompleted(data) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <div class="toast-icon">✅</div>
      <div class="toast-body">
        <strong>Learned!</strong>
        <span>${data?.label || 'Sign'} mastered</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
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
   * Show error message as styled toast
   */
  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <div class="toast-icon">⚠️</div>
      <div class="toast-body">
        <strong>Error</strong>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

// Initialize app when DOM is ready (single instance)
const app = new SignMasterApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging (same instance, not a duplicate)
window.signMasterApp = app;
