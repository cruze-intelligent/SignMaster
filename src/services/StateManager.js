/**
 * StateManager - Centralized game state management.
 *
 * Learner progress is tracked separately from quiz/session metrics so a manual
 * "I've learned this" action does not inflate accuracy or streak numbers.
 */

import cacheManager from './CacheManager.js';
import badgeManager from './BadgeManager.js';
import manifestLoader from './ManifestLoader.js';
import { validatePlayerName, sanitizeXP } from '../utils/security.js';

class StateManager {
  constructor() {
    this.state = {
      playerName: 'Player',
      xp: 0,
      level: 1,
      currentCategory: null,
      learnedSigns: [],
      completedSigns: [],
      currentSignIndex: 0,
      currentSigns: [],
      sessionCorrect: 0,
      sessionTotal: 0,
      streak: 0,
      longestStreak: 0,
      stats: {
        totalSignsLearned: 0,
        totalGamesPlayed: 0,
        totalXPEarned: 0,
        averageAccuracy: 0,
        categoriesCompleted: [],
        perfectGames: 0,
        fastestMatch: null,
        dailyStreak: 0,
        lastPlayedDate: null
      },
      settings: {
        soundEnabled: true,
        voiceEnabled: true,
        highContrast: false,
        difficulty: 'beginner',
        showHints: true
      }
    };

    this.listeners = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      await cacheManager.init();

      const savedProgress = await cacheManager.getProgress('gameState');
      if (savedProgress) {
        this.state = { ...this.state, ...savedProgress };
      }

      const savedSettings = await cacheManager.getProgress('settings');
      if (savedSettings) {
        this.state.settings = { ...this.state.settings, ...savedSettings };
      }

      if (!Array.isArray(this.state.learnedSigns)) {
        this.state.learnedSigns = Array.isArray(this.state.completedSigns) ? [...this.state.completedSigns] : [];
      }

      this.state.completedSigns = [...this.state.learnedSigns];

      await manifestLoader.loadManifest();
      await this.reconcileLearningProgress();

      this.initialized = true;
      console.log('✅ State initialized:', this.state);
    } catch (error) {
      console.error('State init error:', error);
    }
  }

  async saveState() {
    try {
      this.state.completedSigns = [...this.state.learnedSigns];

      await cacheManager.setProgress('gameState', {
        playerName: this.state.playerName,
        xp: this.state.xp,
        level: this.state.level,
        learnedSigns: this.state.learnedSigns,
        completedSigns: this.state.completedSigns,
        stats: this.state.stats,
        streak: this.state.streak,
        longestStreak: this.state.longestStreak
      });

      await cacheManager.setProgress('settings', this.state.settings);
      this.emit('stateSaved', this.getState());
    } catch (error) {
      console.error('Save state error:', error);
    }
  }

  getState() {
    return {
      ...this.state,
      learnedSigns: [...this.state.learnedSigns],
      completedSigns: [...this.state.completedSigns],
      stats: {
        ...this.state.stats,
        categoriesCompleted: [...this.state.stats.categoriesCompleted]
      },
      settings: { ...this.state.settings }
    };
  }

  async setState(updates) {
    const oldState = this.getState();
    const sanitizedUpdates = { ...updates };

    if (updates.playerName !== undefined) {
      const validation = validatePlayerName(updates.playerName);
      if (!validation.valid) {
        console.warn('Invalid player name:', validation.error);
        delete sanitizedUpdates.playerName;
      } else {
        sanitizedUpdates.playerName = validation.sanitized;
      }
    }

    if (updates.xp !== undefined) {
      sanitizedUpdates.xp = sanitizeXP(updates.xp);
    }

    if (updates.learnedSigns) {
      sanitizedUpdates.learnedSigns = [...new Set(updates.learnedSigns)];
      sanitizedUpdates.completedSigns = [...sanitizedUpdates.learnedSigns];
    }

    this.state = { ...this.state, ...sanitizedUpdates };
    await this.saveState();
    this.emit('stateChanged', { oldState, newState: this.getState() });
  }

  async addXP(amount, reason = 'game') {
    amount = sanitizeXP(amount);
    if (amount <= 0) return;

    const oldXP = this.state.xp;
    const oldLevel = this.state.level;

    this.state.xp += amount;
    this.state.stats.totalXPEarned += amount;

    const newLevel = Math.floor(1 + Math.sqrt(this.state.xp / 10));

    if (newLevel > oldLevel) {
      this.state.level = newLevel;
      await this.saveState();

      this.emit('levelUp', {
        oldLevel,
        newLevel: this.state.level,
        xp: this.state.xp
      });

      await badgeManager.checkAndUnlockBadge('hundred_xp', this.getStats());
      await badgeManager.checkAndUnlockBadge('five_hundred_xp', this.getStats());
      await badgeManager.checkAndUnlockBadge('thousand_xp', this.getStats());
      await badgeManager.checkAndUnlockBadge('five_thousand_xp', this.getStats());
    } else {
      await this.saveState();
    }

    this.emit('xpGained', {
      amount,
      reason,
      oldXP,
      newXP: this.state.xp,
      level: this.state.level
    });
  }

  isSignLearned(signId) {
    return this.state.learnedSigns.includes(signId);
  }

  async getCategoryLearningProgress(category) {
    const categorySigns = await manifestLoader.getCategorySigns(category);
    const learned = categorySigns.filter(sign => this.state.learnedSigns.includes(sign.id)).length;
    const total = categorySigns.length;

    return {
      category,
      learned,
      total,
      percent: total > 0 ? Math.round((learned / total) * 100) : 0,
      completed: total > 0 && learned === total
    };
  }

  async reconcileLearningProgress() {
    const manifest = await manifestLoader.loadManifest();
    const approvedIds = new Set();

    Object.values(manifest.categories || {}).forEach(category => {
      category.signs.forEach(sign => approvedIds.add(sign.id));
    });

    this.state.learnedSigns = this.state.learnedSigns.filter(signId => approvedIds.has(signId));
    this.state.completedSigns = [...this.state.learnedSigns];
    this.state.stats.totalSignsLearned = this.state.learnedSigns.length;

    const categoriesCompleted = [];
    for (const categoryKey of Object.keys(manifest.categories || {})) {
      const progress = await this.getCategoryLearningProgress(categoryKey);
      if (progress.completed) {
        categoriesCompleted.push(categoryKey);
      }
    }

    this.state.stats.categoriesCompleted = categoriesCompleted;
    await this.saveState();
    this.emit('learningReconciled', this.getState());
  }

  async markSignLearned(signId, category, label = null) {
    const alreadyLearned = this.isSignLearned(signId);
    const previousCategories = new Set(this.state.stats.categoriesCompleted);

    if (!alreadyLearned) {
      this.state.learnedSigns.push(signId);
    }

    await this.reconcileLearningProgress();
    const progress = category ? await this.getCategoryLearningProgress(category) : null;
    const categoryCompleted = category ? progress?.completed && !previousCategories.has(category) : false;

    if (!alreadyLearned) {
      const stats = this.getStats();
      await badgeManager.checkAndUnlockBadge('first_sign', stats);
      await badgeManager.checkAndUnlockBadge('five_signs', stats);
      await badgeManager.checkAndUnlockBadge('ten_signs', stats);
    }

    if (categoryCompleted) {
      await badgeManager.checkAndUnlockBadge('alphabet_master', this.getStats());
      await badgeManager.checkAndUnlockBadge('number_master', this.getStats());
      await badgeManager.checkAndUnlockBadge('greeting_master', this.getStats());
    }

    const payload = {
      signId,
      category,
      label,
      newlyLearned: !alreadyLearned,
      progress,
      totalLearned: this.state.stats.totalSignsLearned
    };

    this.emit('signLearned', payload);

    if (categoryCompleted) {
      this.emit('categoryCompleted', {
        category,
        score: progress.percent,
        isPerfect: true
      });
    }

    return payload;
  }

  async completeSign(signId, isCorrect, timeMs) {
    this.state.sessionTotal += 1;

    if (isCorrect) {
      this.state.sessionCorrect += 1;
      this.state.streak += 1;
      if (this.state.streak > this.state.longestStreak) {
        this.state.longestStreak = this.state.streak;
      }
    } else {
      this.state.streak = 0;
    }

    if (isCorrect && (!this.state.stats.fastestMatch || timeMs < this.state.stats.fastestMatch)) {
      this.state.stats.fastestMatch = timeMs;
    }

    await this.saveState();

    await badgeManager.checkAndUnlockBadge('speed_demon', this.getStats());
    await badgeManager.checkAndUnlockBadge('lightning_fast', this.getStats());
    await badgeManager.checkAndUnlockBadge('five_streak', this.getStats());
    await badgeManager.checkAndUnlockBadge('ten_streak', this.getStats());

    this.emit('signCompleted', {
      signId,
      isCorrect,
      timeMs,
      streak: this.state.streak,
      accuracy: this.getAccuracy()
    });
  }

  async completeCategory(category, score, isPerfect) {
    if (!this.state.stats.categoriesCompleted.includes(category)) {
      this.state.stats.categoriesCompleted.push(category);
    }

    if (isPerfect) {
      this.state.stats.perfectGames += 1;
    }

    this.state.stats.totalGamesPlayed += 1;
    await this.saveState();

    await badgeManager.checkAndUnlockBadge('alphabet_master', this.getStats());
    await badgeManager.checkAndUnlockBadge('number_master', this.getStats());
    await badgeManager.checkAndUnlockBadge('greeting_master', this.getStats());
    await badgeManager.checkAndUnlockBadge('perfect_match', this.getStats());
    await badgeManager.checkAndUnlockBadge('perfectionist', this.getStats());

    this.emit('categoryCompleted', {
      category,
      score,
      isPerfect
    });
  }

  async updateDailyStreak() {
    const today = new Date().toDateString();
    const lastPlayed = this.state.stats.lastPlayedDate;

    if (lastPlayed !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (lastPlayed === yesterday) {
        this.state.stats.dailyStreak += 1;
      } else if (lastPlayed !== null) {
        this.state.stats.dailyStreak = 1;
      } else {
        this.state.stats.dailyStreak = 1;
      }

      this.state.stats.lastPlayedDate = today;
      await this.saveState();

      await badgeManager.checkAndUnlockBadge('daily_return', this.getStats());
      await badgeManager.checkAndUnlockBadge('weekly_warrior', this.getStats());

      this.emit('dailyStreakUpdated', {
        streak: this.state.stats.dailyStreak
      });
    }
  }

  getAccuracy() {
    if (this.state.sessionTotal === 0) return 0;
    return Math.round((this.state.sessionCorrect / this.state.sessionTotal) * 100);
  }

  getStats() {
    return {
      signsLearned: this.state.stats.totalSignsLearned,
      categoriesCompleted: [...this.state.stats.categoriesCompleted],
      streak: this.state.streak,
      longestStreak: this.state.longestStreak,
      perfectGames: this.state.stats.perfectGames,
      totalXP: this.state.xp,
      level: this.state.level,
      dailyStreak: this.state.stats.dailyStreak,
      fastestMatch: this.state.stats.fastestMatch,
      totalGamesPlayed: this.state.stats.totalGamesPlayed
    };
  }

  resetSession() {
    this.state.sessionCorrect = 0;
    this.state.sessionTotal = 0;
    this.state.currentSignIndex = 0;
    this.state.currentSigns = [];
    this.emit('sessionReset');
  }

  async updateSettings(settings) {
    this.state.settings = { ...this.state.settings, ...settings };
    await this.saveState();
    this.emit('settingsChanged', this.state.settings);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error (${event}):`, error);
      }
    });
  }
}

const stateManager = new StateManager();
export default stateManager;
