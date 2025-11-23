/**
 * StateManager - Centralized game state management
 * 
 * Manages all game state including progress, settings, and integrates
 * with CacheManager for persistence.
 */

import cacheManager from './CacheManager.js';
import badgeManager from './BadgeManager.js';
import { validatePlayerName, sanitizeXP, sanitizeInput } from '../utils/security.js';

class StateManager {
  constructor() {
    this.state = {
      // Player info
      playerName: 'Player',
      
      // Progress
      xp: 0,
      level: 1,
      currentCategory: null,
      completedSigns: [],
      
      // Current game session
      currentSignIndex: 0,
      currentSigns: [],
      sessionCorrect: 0,
      sessionTotal: 0,
      streak: 0,
      longestStreak: 0,
      
      // Statistics
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
      
      // Settings
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

  /**
   * Initialize state from cache
   */
  async init() {
    if (this.initialized) return;

    try {
      await cacheManager.init();
      
      // Load saved progress
      const savedProgress = await cacheManager.getProgress('gameState');
      if (savedProgress) {
        this.state = { ...this.state, ...savedProgress };
      }
      
      // Load settings
      const savedSettings = await cacheManager.getProgress('settings');
      if (savedSettings) {
        this.state.settings = { ...this.state.settings, ...savedSettings };
      }
      
      this.initialized = true;
      console.log('✅ State initialized:', this.state);
      
    } catch (error) {
      console.error('State init error:', error);
    }
  }

  /**
   * Save current state to cache
   */
  async saveState() {
    try {
      await cacheManager.setProgress('gameState', {
        playerName: this.state.playerName,
        xp: this.state.xp,
        level: this.state.level,
        completedSigns: this.state.completedSigns,
        stats: this.state.stats,
        streak: this.state.streak,
        longestStreak: this.state.longestStreak
      });
      
      await cacheManager.setProgress('settings', this.state.settings);
      
      this.emit('stateSaved', this.state);
      
    } catch (error) {
      console.error('Save state error:', error);
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state and save
   */
  async setState(updates) {
    const oldState = { ...this.state };
    
    // Sanitize and validate updates
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
    
    this.state = { ...this.state, ...sanitizedUpdates };
    
    await this.saveState();
    this.emit('stateChanged', { oldState, newState: this.state });
  }

  /**
   * Add XP and check for level up
   */
  async addXP(amount, reason = 'game') {
    // Sanitize XP amount
    amount = sanitizeXP(amount);
    if (amount <= 0) return;
    
    const oldXP = this.state.xp;
    const oldLevel = this.state.level;
    
    this.state.xp += amount;
    this.state.stats.totalXPEarned += amount;
    
    // Calculate level (10 XP per level, increasing)
    const newLevel = Math.floor(1 + Math.sqrt(this.state.xp / 10));
    
    if (newLevel > oldLevel) {
      this.state.level = newLevel;
      await this.saveState();
      
      this.emit('levelUp', {
        oldLevel,
        newLevel: this.state.level,
        xp: this.state.xp
      });
      
      // Check for level-based badges
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

  /**
   * Record completed sign
   */
  async completeSign(signId, isCorrect, timeMs) {
    if (!this.state.completedSigns.includes(signId)) {
      this.state.completedSigns.push(signId);
      this.state.stats.totalSignsLearned++;
    }
    
    this.state.sessionTotal++;
    if (isCorrect) {
      this.state.sessionCorrect++;
      this.state.streak++;
      
      if (this.state.streak > this.state.longestStreak) {
        this.state.longestStreak = this.state.streak;
      }
    } else {
      this.state.streak = 0;
    }
    
    // Update fastest match
    if (isCorrect && (!this.state.stats.fastestMatch || timeMs < this.state.stats.fastestMatch)) {
      this.state.stats.fastestMatch = timeMs;
    }
    
    await this.saveState();
    
    // Check badges
    const stats = this.getStats();
    await badgeManager.checkAndUnlockBadge('first_sign', stats);
    await badgeManager.checkAndUnlockBadge('five_signs', stats);
    await badgeManager.checkAndUnlockBadge('ten_signs', stats);
    await badgeManager.checkAndUnlockBadge('speed_demon', stats);
    await badgeManager.checkAndUnlockBadge('lightning_fast', stats);
    await badgeManager.checkAndUnlockBadge('five_streak', stats);
    await badgeManager.checkAndUnlockBadge('ten_streak', stats);
    
    this.emit('signCompleted', {
      signId,
      isCorrect,
      timeMs,
      streak: this.state.streak,
      accuracy: this.getAccuracy()
    });
  }

  /**
   * Complete category
   */
  async completeCategory(category, score, isPerfect) {
    if (!this.state.stats.categoriesCompleted.includes(category)) {
      this.state.stats.categoriesCompleted.push(category);
    }
    
    if (isPerfect) {
      this.state.stats.perfectGames++;
    }
    
    this.state.stats.totalGamesPlayed++;
    
    await this.saveState();
    
    // Check badges
    const stats = this.getStats();
    await badgeManager.checkAndUnlockBadge('alphabet_master', stats);
    await badgeManager.checkAndUnlockBadge('number_master', stats);
    await badgeManager.checkAndUnlockBadge('greeting_master', stats);
    await badgeManager.checkAndUnlockBadge('perfect_match', stats);
    await badgeManager.checkAndUnlockBadge('perfectionist', stats);
    
    this.emit('categoryCompleted', {
      category,
      score,
      isPerfect
    });
  }

  /**
   * Update daily streak
   */
  async updateDailyStreak() {
    const today = new Date().toDateString();
    const lastPlayed = this.state.stats.lastPlayedDate;
    
    if (lastPlayed !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastPlayed === yesterday) {
        this.state.stats.dailyStreak++;
      } else if (lastPlayed !== null) {
        this.state.stats.dailyStreak = 1;
      } else {
        this.state.stats.dailyStreak = 1;
      }
      
      this.state.stats.lastPlayedDate = today;
      await this.saveState();
      
      // Check badges
      const stats = this.getStats();
      await badgeManager.checkAndUnlockBadge('daily_return', stats);
      await badgeManager.checkAndUnlockBadge('weekly_warrior', stats);
      
      this.emit('dailyStreakUpdated', {
        streak: this.state.stats.dailyStreak
      });
    }
  }

  /**
   * Get current accuracy
   */
  getAccuracy() {
    if (this.state.sessionTotal === 0) return 0;
    return Math.round((this.state.sessionCorrect / this.state.sessionTotal) * 100);
  }

  /**
   * Get stats for badge checking
   */
  getStats() {
    return {
      signsLearned: this.state.stats.totalSignsLearned,
      categoriesCompleted: this.state.stats.categoriesCompleted,
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

  /**
   * Reset session stats
   */
  resetSession() {
    this.state.sessionCorrect = 0;
    this.state.sessionTotal = 0;
    this.state.currentSignIndex = 0;
    this.state.currentSigns = [];
    
    this.emit('sessionReset');
  }

  /**
   * Update settings
   */
  async updateSettings(settings) {
    this.state.settings = { ...this.state.settings, ...settings };
    await this.saveState();
    
    this.emit('settingsChanged', this.state.settings);
  }

  /**
   * Event system
   */
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

// Export singleton
const stateManager = new StateManager();
export default stateManager;
