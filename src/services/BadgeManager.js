/**
 * BadgeManager - Progressive badge reveal and achievement tracking
 * 
 * Manages badge unlocking, progressive reveal (showing next unlockable badges),
 * and badge point calculations for leaderboard ranking
 */

import badgesData from '../data/badges.json';
import cacheManager from './CacheManager.js';

class BadgeManager {
  constructor() {
    this.badges = badgesData.badges;
    this.tiers = badgesData.tiers;
    this.listeners = new Map();
  }

  /**
   * Check if badge conditions are met and unlock if eligible
   */
  async checkAndUnlockBadge(badgeId, stats) {
    const badge = this.badges.find(b => b.id === badgeId);
    if (!badge) return false;

    // Check if already earned
    const existing = await cacheManager.getBadge(badgeId);
    if (existing) return false;

    // Check unlock level requirement
    const playerLevel = stats.currentLevel || stats.level || 1;
    if (playerLevel < badge.unlockLevel) return false;

    // Check condition
    const isMet = this.checkCondition(badge.condition, stats);
    
    if (isMet) {
      await this.unlockBadge(badge);
      return true;
    }

    return false;
  }

  /**
   * Check if a specific condition is met
   */
  checkCondition(condition, stats) {
    switch (condition.type) {
      case 'signsLearned':
        return (stats.totalSignsLearned || stats.signsLearned || 0) >= condition.value;
      
      case 'categoryComplete':
        return (stats.categoriesCompleted || []).includes(condition.value);
      
      case 'perfectScore':
        return (stats.lastMatchScore || 0) >= condition.value;
      
      case 'matchTime':
        return (stats.lastMatchTime || stats.fastestMatch || Infinity) <= condition.value;
      
      case 'streak':
        return (stats.streak || 0) >= condition.value;
      
      case 'totalXP':
        return (stats.totalXP || stats.xp || 0) >= condition.value;
      
      case 'dailyStreak':
        return (stats.dailyStreak || 0) >= condition.value;
      
      case 'perfectGames':
        return (stats.perfectGames || 0) >= condition.value;
      
      case 'timeOfDay': {
        const hour = stats.timeOfDay !== undefined ? stats.timeOfDay : new Date().getHours();
        if (condition.value === 'morning') return hour < 9;
        if (condition.value === 'night') return hour >= 22;
        return false;
      }
      
      case 'shareCount':
        return (stats.shareCount || 0) >= condition.value;
      
      case 'perfectLevels':
        return (stats.perfectGames || stats.perfectLevels || 0) >= condition.value;
      
      case 'allComplete': {
        // Check if all known categories are completed
        const completed = stats.categoriesCompleted || [];
        if (stats.allCategoriesComplete) return true;
        // Fallback: require at least 11 categories (all mastery badge categories)
        return completed.length >= 11;
      }
      
      case 'secret':
        return stats.secretsFound && stats.secretsFound.includes(condition.value);
      
      case 'voiceUsage':
        return (stats.voiceUsageCount || 0) >= condition.value;
      
      case 'special':
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Unlock a badge and save to cache
   */
  async unlockBadge(badge) {
    const earnedBadge = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      category: badge.category,
      points: this.tiers[badge.tier].points,
      earnedAt: new Date().toISOString()
    };

    await cacheManager.addBadge(earnedBadge);
    console.log(`🏆 Badge unlocked: ${badge.name} (+${earnedBadge.points} points)`);
    
    // Emit event for UI updates
    this.emit('badgeUnlocked', earnedBadge);
    
    return earnedBadge;
  }

  /**
   * Get all badges (earned and unearned)
   */
  getAllBadges() {
    return this.badges;
  }

  /**
   * Get all earned badges
   */
  async getEarnedBadges() {
    return await cacheManager.getAllBadges();
  }

  /**
   * Calculate total badge points
   */
  async getTotalBadgePoints() {
    const earned = await this.getEarnedBadges();
    return earned.reduce((sum, badge) => sum + (badge.points || 0), 0);
  }

  /**
   * Progressive reveal - show next unlockable badges based on current progress
   * Returns up to 3 badges that are within reach (±2 levels)
   */
  async getProgressiveReveal(currentLevel, stats) {
    const earnedIds = (await this.getEarnedBadges()).map(b => b.id);
    
    // Filter badges: not earned, within level range, not hidden
    const available = this.badges.filter(b => 
      !earnedIds.includes(b.id) &&
      !b.hidden &&
      b.unlockLevel <= currentLevel + 2 &&
      b.unlockLevel >= currentLevel - 2
    );

    // Sort by proximity to completion
    const scored = available.map(badge => {
      const progress = this.calculateProgress(badge, stats);
      return { badge, progress };
    });

    scored.sort((a, b) => b.progress - a.progress);

    // Return top 3
    return scored.slice(0, 3).map(s => ({
      ...s.badge,
      progress: s.progress,
      points: this.tiers[s.badge.tier].points
    }));
  }

  /**
   * Calculate progress percentage toward a badge (0-100)
   */
  calculateProgress(badge, stats) {
    const condition = badge.condition;
    
    switch (condition.type) {
      case 'signsLearned':
        return Math.min(100, ((stats.totalSignsLearned || stats.signsLearned || 0) / condition.value) * 100);
      
      case 'categoryComplete':
        return (stats.categoriesCompleted || []).includes(condition.value) ? 100 : 0;
      
      case 'perfectScore':
        return Math.min(100, ((stats.lastMatchScore || 0) / condition.value) * 100);
      
      case 'matchTime': {
        const matchTime = stats.lastMatchTime || stats.fastestMatch;
        return matchTime ? Math.min(100, (condition.value / matchTime) * 100) : 0;
      }
      
      case 'streak':
        return Math.min(100, ((stats.streak || 0) / condition.value) * 100);
      
      case 'totalXP':
        return Math.min(100, ((stats.totalXP || stats.xp || 0) / condition.value) * 100);
      
      case 'dailyStreak':
        return Math.min(100, ((stats.dailyStreak || 0) / condition.value) * 100);
      
      case 'perfectLevels':
        return Math.min(100, ((stats.perfectGames || stats.perfectLevels || 0) / condition.value) * 100);
      
      case 'perfectGames':
        return Math.min(100, ((stats.perfectGames || 0) / condition.value) * 100);
      
      default:
        return 0;
    }
  }

  /**
   * Get badges by category
   */
  getBadgesByCategory(category) {
    return this.badges.filter(b => b.category === category);
  }

  /**
   * Get badges by tier
   */
  getBadgesByTier(tier) {
    return this.badges.filter(b => b.tier === tier);
  }

  /**
   * Get badge leaderboard ranking based on points
   */
  async getBadgeRank() {
    const points = await this.getTotalBadgePoints();
    const rank = (name, tier, icon) => ({ rank: name, name, tier, icon });
    
    // Define rank thresholds
    if (points >= 1000) return rank('Legendary Master', 'diamond', '👑');
    if (points >= 500) return rank('Elite Champion', 'platinum', '🏆');
    if (points >= 250) return rank('Expert Signer', 'gold', '⭐');
    if (points >= 100) return rank('Advanced Learner', 'silver', '🌟');
    if (points >= 25) return rank('Rising Star', 'bronze', '✨');
    return rank('Beginner', 'bronze', '🌱');
  }

  /**
   * Check all possible badges for unlocking
   */
  async checkAllBadges(stats) {
    const unlocked = [];
    
    for (const badge of this.badges) {
      const wasUnlocked = await this.checkAndUnlockBadge(badge.id, stats);
      if (wasUnlocked) {
        unlocked.push(badge);
      }
    }

    return unlocked;
  }

  /**
   * Get badge statistics
   */
  async getBadgeStats() {
    const earned = await this.getEarnedBadges();
    const points = await this.getTotalBadgePoints();
    const rank = await this.getBadgeRank();
    
    const tierCounts = {};
    const categoryCounts = {};
    
    earned.forEach(badge => {
      tierCounts[badge.tier] = (tierCounts[badge.tier] || 0) + 1;
      categoryCounts[badge.category] = (categoryCounts[badge.category] || 0) + 1;
    });

    return {
      total: earned.length,
      available: this.badges.filter(b => !b.hidden).length,
      points,
      rank,
      byTier: tierCounts,
      byCategory: categoryCounts,
      completion: Math.round((earned.length / this.badges.length) * 100)
    };
  }

  /**
   * Event system for badge unlocks
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
const badgeManager = new BadgeManager();
export default badgeManager;
