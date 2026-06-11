import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import badgeManager from '../src/services/BadgeManager.js';
import cacheManager from '../src/services/CacheManager.js';
import manifestLoader from '../src/services/ManifestLoader.js';
import stateManager from '../src/services/StateManager.js';

function createBaseState() {
  return {
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
    },
    quests: {
      date: null,
      items: []
    }
  };
}

beforeAll(async () => {
  cacheManager.init = vi.fn().mockResolvedValue();
  cacheManager.getProgress = vi.fn().mockResolvedValue(null);
  cacheManager.setProgress = vi.fn().mockResolvedValue();
  badgeManager.checkAndUnlockBadge = vi.fn().mockResolvedValue();
  await manifestLoader.loadManifest();
});

describe('StateManager learner progress', () => {
  beforeEach(() => {
    stateManager.state = createBaseState();
    stateManager.listeners = new Map();
    stateManager.initialized = true;
  });

  it('marks a sign learned without affecting quiz metrics', async () => {
    stateManager.state.sessionCorrect = 4;
    stateManager.state.sessionTotal = 5;
    stateManager.state.streak = 2;

    const first = await stateManager.markSignLearned('alphabet_2_1', 'alphabet', 'A');
    const second = await stateManager.markSignLearned('alphabet_2_1', 'alphabet', 'A');

    expect(first.newlyLearned).toBe(true);
    expect(second.newlyLearned).toBe(false);
    expect(stateManager.state.learnedSigns).toEqual(['alphabet_2_1']);
    expect(stateManager.state.stats.totalSignsLearned).toBe(1);
    expect(stateManager.state.sessionCorrect).toBe(4);
    expect(stateManager.state.sessionTotal).toBe(5);
    expect(stateManager.state.streak).toBe(2);
  });

  it('updates daily quests from unique learning and quiz results', async () => {
    stateManager.state.quests = {
      date: new Date().toDateString(),
      items: [
        { id: 'q_learn', type: 'learn', target: 2, description: 'Learn 2 signs', xp: 30, progress: 0, completed: false },
        { id: 'q_games', type: 'play', target: 1, description: 'Play 1 quiz game', xp: 20, progress: 0, completed: false },
        { id: 'q_combo', type: 'combo', target: 10, description: 'Achieve a 5x Combo', xp: 50, progress: 0, completed: false },
        { id: 'q_perfect', type: 'perfect', target: 1, description: 'Get a perfect score', xp: 50, progress: 0, completed: false }
      ]
    };

    await stateManager.markSignLearned('alphabet_2_1', 'alphabet', 'A');
    await stateManager.markSignLearned('alphabet_2_1', 'alphabet', 'A');
    await stateManager.recordQuizResult({ score: 100, isPerfect: true, bestStreak: 10, category: 'alphabet' });

    const quests = Object.fromEntries(stateManager.state.quests.items.map(quest => [quest.id, quest]));
    expect(quests.q_learn.progress).toBe(1);
    expect(quests.q_learn.completed).toBe(false);
    expect(quests.q_games.completed).toBe(true);
    expect(quests.q_combo.completed).toBe(true);
    expect(quests.q_perfect.completed).toBe(true);
    expect(stateManager.state.stats.totalGamesPlayed).toBe(1);
    expect(stateManager.state.stats.perfectGames).toBe(1);
    expect(stateManager.state.stats.averageAccuracy).toBe(100);
    expect(stateManager.state.stats.lastMatchScore).toBe(100);
  });

  it('completes a category only after every approved sign is learned', async () => {
    await stateManager.markSignLearned('actions_60_450', 'actions', 'Stand up');
    await stateManager.markSignLearned('actions_60_451', 'actions', 'Walk');

    let progress = await stateManager.getCategoryLearningProgress('actions');
    expect(progress.completed).toBe(false);

    await stateManager.markSignLearned('actions_60_453', 'actions', 'Jump');
    progress = await stateManager.getCategoryLearningProgress('actions');

    expect(progress.completed).toBe(true);
    expect(stateManager.state.stats.categoriesCompleted).toContain('actions');
  });
});
