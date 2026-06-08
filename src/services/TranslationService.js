/**
 * TranslationService - Offline UI and search translation support.
 *
 * Acholi search now relies on a curated local glossary rather than a remote
 * machine translation endpoint so search quality stays stable offline.
 */

import acholiGlossary from '../data/acholi-glossary.json';

class TranslationService {
  constructor() {
    this.currentLanguage = 'en';
    this.listeners = [];
    this.searchLookup = this.buildSearchLookup(acholiGlossary.searchTerms || []);

    this.builtInTranslations = {
      en: {
        home: 'Home',
        categories: 'Categories',
        search: 'Search',
        progress: 'Progress',
        settings: 'Settings',
        your_progress: 'Your Progress',
        total_xp: 'Total XP',
        level: 'Level',
        signs_learned: 'Signs Learned',
        badges_earned: 'Badges Earned',
        rank: 'Rank',
        download_certificate: 'Download Certificate',
        learning_streak: 'Learning Streak',
        days: 'days',
        accuracy: 'Accuracy',
        categories_completed: 'Categories Completed',
        total_practice_time: 'Total Practice Time',
        hours: 'hours',
        minutes: 'minutes',
        sound_effects: 'Sound Effects',
        voice_narration: 'Voice Narration',
        high_contrast: 'High Contrast Mode',
        language: 'Language',
        player_name: 'Player Name',
        reset_progress: 'Reset Progress',
        export_data: 'Export Data',
        import_data: 'Import Data',
        about: 'About SignMaster',
        learn_this: "I've Learned This",
        learned: 'Learned',
        practice: 'Practice',
        learn_to_sign: 'Learn to sign',
        in_usl: 'in Uganda Sign Language',
        welcome: 'Welcome',
        start_learning: 'Start Learning',
        continue_learning: 'Continue Learning',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        reviewed_content: 'Reviewed Content',
        reviewed_signs: 'Reviewed signs',
        learned_signs: 'Learned signs',
        category_progress: 'Category progress',
        learning_details: 'Learning details',
        handshape: 'Handshape',
        location: 'Location',
        orientation: 'Orientation',
        movement: 'Movement',
        facial_expression: 'Facial expression',
        usage_tip: 'Usage tip',
        self_check: 'Self-check',
        practice_next: 'Practice next',
        search_placeholder: 'Search in Acholi or English...',
        search_results: 'Search results',
        translated_from_acholi: 'Translated from Acholi',
        no_results: 'No Results Found',
        browse_categories: 'Browse categories',
        review_notice: 'This sign is part of the currently reviewed learning set.',
        certificate_achievement: 'Certificate of Achievement',
        this_certifies: 'This certifies that',
        completed_program: 'has completed the current SignMaster reviewed learning set',
        demonstrated_proficiency: 'and has built practice consistency in Uganda Sign Language',
        welcome_subtitle: 'Learn Uganda Sign Language with a reviewed sign set in 3 practical ways',
        learn_by_category: 'Learn by Category',
        learn_by_category_desc: 'Browse reviewed signs organized by topics like Numbers, Food, Actions, and more',
        search_and_translate: 'Search & Translate',
        search_and_translate_desc: 'Search reviewed signs in English or Acholi with offline glossary support',
        search_signs: 'Search Signs →',
        daily_quests: 'Daily Quests',
        interactive_stories: 'Interactive Stories',
        interactive_stories_desc: 'Coming soon. Story content stays hidden until the signs behind it are independently verified.',
        coming_soon: 'Coming Soon',
        view_my_progress: '📊 View My Progress',
        back: '← Back',
        choose_category: 'Choose a Category',
        signs: 'Signs',
        sign_quiz: 'Sign Quiz',
        test_your_knowledge: 'Test Your Knowledge',
        test_knowledge_desc: 'How well do you know Uganda Sign Language? Pick a category and find out!',
        category_label: 'Category:',
        all_categories: 'All Categories (Mixed)',
        mode_label: 'Mode:',
        standard: 'Standard',
        time_attack: 'Time Attack',
        survival: 'Survival',
        questions_label: 'Questions:',
        '5_questions': '5 Questions',
        '10_questions': '10 Questions',
        '20_questions': '20 Questions',
        start_quiz: 'Start Quiz 🚀',
        what_sign: 'What sign is shown below?',
        next_question: 'Next Question →',
        quiz_complete: 'Quiz Complete!',
        score: 'Score',
        correct: 'Correct',
        best_streak: 'Best Streak',
        xp_earned: 'XP Earned',
        play_again: 'Play Again 🔄',
        back_to_learning: 'Back to Learning 📚',
        no_quests_available: 'No quests available today.',
        q_combo: 'Achieve a 5x Combo',
        q_learn: 'Learn 5 new signs',
        q_games: 'Play 3 quiz games',
        q_perfect: 'Get a perfect score',
        q_xp: 'Earn 100 XP'
      },
      ach: acholiGlossary.ui || {}
    };
  }

  normalizeSearchTerm(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  buildSearchLookup(entries) {
    const lookup = new Map();

    for (const entry of entries) {
      const terms = [entry.term, ...(entry.aliases || [])];
      for (const term of terms) {
        const normalized = this.normalizeSearchTerm(term);
        if (!normalized) continue;
        if (lookup.has(normalized)) {
          throw new Error(`Duplicate Acholi glossary term: ${normalized}`);
        }
        lookup.set(normalized, {
          term: entry.term,
          english: entry.english
        });
      }
    }

    return lookup;
  }

  async init() {
    const savedLang = localStorage.getItem('signmaster_language');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    console.log(`🌍 Translation service initialized: ${this.currentLanguage}`);
  }

  getLanguage() {
    return this.currentLanguage;
  }

  getLanguageName(code) {
    const names = {
      en: 'English',
      ach: 'Acholi (Lwo)'
    };
    return names[code] || code;
  }

  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'ach', name: 'Acholi', native: 'Lwo' }
    ];
  }

  async setLanguage(langCode) {
    if (this.currentLanguage === langCode) return;
    this.currentLanguage = langCode;
    localStorage.setItem('signmaster_language', langCode);
    this.listeners.forEach(callback => callback(langCode));
    console.log(`🌍 Language changed to: ${langCode}`);
  }

  t(key) {
    const translations = this.builtInTranslations[this.currentLanguage] || {};
    if (translations[key]) {
      return translations[key];
    }

    const englishTranslations = this.builtInTranslations.en || {};
    if (englishTranslations[key]) {
      return englishTranslations[key];
    }

    return key;
  }

  async translateText(text, targetLang = null) {
    const lang = targetLang || this.currentLanguage;
    if (lang === 'en') return text;
    return this.t(text);
  }

  resolveSearchQuery(query) {
    if (this.currentLanguage !== 'ach') {
      return {
        input: query,
        resolvedQuery: query,
        translated: false,
        matchedTerms: []
      };
    }

    const normalizedQuery = this.normalizeSearchTerm(query);
    if (!normalizedQuery) {
      return {
        input: query,
        resolvedQuery: query,
        translated: false,
        matchedTerms: []
      };
    }

    const exactMatch = this.searchLookup.get(normalizedQuery);
    if (exactMatch) {
      return {
        input: query,
        resolvedQuery: exactMatch.english,
        translated: true,
        matchedTerms: [exactMatch.term]
      };
    }

    const words = normalizedQuery.split(' ');
    const translatedWords = [];
    const matchedTerms = [];

    for (const word of words) {
      const match = this.searchLookup.get(word);
      if (match) {
        translatedWords.push(match.english);
        matchedTerms.push(match.term);
      } else {
        translatedWords.push(word);
      }
    }

    const resolvedQuery = translatedWords.join(' ').trim();
    return {
      input: query,
      resolvedQuery,
      translated: resolvedQuery !== normalizedQuery,
      matchedTerms
    };
  }

  async translateSearchQuery(query) {
    return this.resolveSearchQuery(query).resolvedQuery;
  }

  getSearchPlaceholder() {
    return this.currentLanguage === 'ach' ? this.t('search_placeholder') : 'Search signs...';
  }

  onLanguageChange(callback) {
    this.listeners.push(callback);
  }

  offLanguageChange(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
}

const translationService = new TranslationService();
export default translationService;
