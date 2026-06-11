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
        q_xp: 'Earn 100 XP',
        install_app: 'Install App',
        init_error: 'Failed to initialize app. Please refresh.',
        alphabet: 'Alphabet',
        numbers: 'Numbers',
        greetings: 'Greetings',
        family: 'Family',
        emotions: 'Emotions',
        school: 'School',
        food: 'Food',
        colors: 'Colors',
        animals: 'Animals',
        places: 'Places',
        actions: 'Actions',
        time: 'Time',
        money: 'Money & Commerce',
        math: 'Mathematics',
        quantities: 'Quantities',
        popular_searches: 'Popular Searches',
        suggestions: 'Suggestions',
        search_empty_title: 'Search for Signs',
        search_empty_desc: 'Enter a word, letter, number, or phrase to find its sign language translation',
        no_signs_match: 'No signs match "{query}".',
        no_signs_match_translated: 'No signs match "{query}" (searched: "{resolvedQuery}").',
        try_different_words: 'Try different words or browse categories.',
        found_signs_for: 'Found {count} {signWord} for "{query}"',
        found_signs_for_translated: 'Found {count} {signWord} for "{query}" -> "{resolvedQuery}"',
        sign_singular: 'sign',
        sign_plural: 'signs',
        not_enough_signs_quiz: 'Not enough signs in this category for a quiz. Try "All Categories"!',
        wave: 'Wave',
        score_label: 'Score',
        what_sign_is_this: 'What sign is this?',
        time_up_correct: 'Time is up! The correct answer was "{answer}".',
        correct_points: 'Correct! +{points} pts',
        incorrect_answer: 'Incorrect. That was "{answer}".',
        speed_bonus: 'Speed Bonus +5!',
        quick_bonus: 'Quick +2!',
        combo_2: '2x Combo!',
        combo_3: '3x Combo!',
        combo_5: '5x On Fire!',
        combo_multiplier: 'x{mult} COMBO!',
        combo_lost: 'Combo Lost!',
        perfect_score: 'Perfect Score!',
        excellent: 'Excellent!',
        good_job: 'Good Job!',
        keep_practicing: 'Keep Practicing!',
        dont_give_up: "Don't Give Up!",
        badge_points: 'Badge Points',
        your_badges: 'Your Badges',
        next_to_unlock: 'Next to Unlock',
        save: 'Save',
        saved: 'Saved',
        preferences: 'Preferences',
        about_body: 'SignMaster is an educational game for learning Uganda Sign Language (USL) from a reviewed in-app sign set.',
        sponsored_by: 'Sponsored by',
        developers_and_researchers: 'Developers and researchers',
        version: 'Version',
        level_up: 'Level Up!',
        reached_level: 'You reached Level {level}',
        learned_toast_title: 'Learned!',
        sign_mastered: '{label} mastered',
        sign_saved: '{label} saved to your progress',
        error: 'Error',
        coming_soon_title: 'Coming Soon',
        failed_load_image: 'Failed to load image',
        close: 'Close',
        continue: 'Continue',
        badge_unlocked: 'Badge Unlocked!',
        certificate_learning_progress: 'Certificate of Learning Progress',
        uganda_sign_language_learning: 'Uganda Sign Language Learning',
        signmaster_usl: 'SignMaster: Uganda Sign Language',
        total_xp_label: 'Total XP',
        badges: 'Badges',
        top_achievements: 'Top Achievements',
        scan_to_play: 'Scan to play',
        issued: 'Issued',
        generated: 'Generated',
        certificate_id: 'Certificate ID',

        // Ranks
        rank_beginner: 'Beginner',
        rank_rising_star: 'Rising Star',
        rank_advanced_learner: 'Advanced Learner',
        rank_expert_signer: 'Expert Signer',
        rank_elite_champion: 'Elite Champion',
        rank_legendary_master: 'Legendary Master',

        // General
        quest_completed_title: 'Quest Completed!',
        loading_signs: 'Loading signs...',

        // Badges
        badge_name_first_sign: 'First Steps',
        badge_desc_first_sign: 'Learn your first sign',
        badge_name_five_signs: 'Quick Learner',
        badge_desc_five_signs: 'Learn 5 signs',
        badge_name_ten_signs: 'Sign Student',
        badge_desc_ten_signs: 'Learn 10 signs',
        badge_name_twenty_signs: 'Sign Enthusiast',
        badge_desc_twenty_signs: 'Learn 20 signs',
        badge_name_fifty_signs: 'Sign Scholar',
        badge_desc_fifty_signs: 'Learn 50 signs',
        badge_name_hundred_signs: 'Sign Master',
        badge_desc_hundred_signs: 'Learn 100 signs',
        badge_name_alphabet_master: 'Alphabet Master',
        badge_desc_alphabet_master: 'Complete the Alphabet category',
        badge_name_number_master: 'Number Master',
        badge_desc_number_master: 'Complete the Numbers category',
        badge_name_greeting_master: 'Greeting Master',
        badge_desc_greeting_master: 'Complete the Greetings category',
        badge_name_emotion_master: 'Emotion Master',
        badge_desc_emotion_master: 'Complete the Emotions category',
        badge_name_food_master: 'Food Master',
        badge_desc_food_master: 'Complete all Food signs',
        badge_name_school_master: 'School Master',
        badge_desc_school_master: 'Complete all School signs',
        badge_name_color_master: 'Color Master',
        badge_desc_color_master: 'Complete all Color signs',
        badge_name_animal_master: 'Animal Master',
        badge_desc_animal_master: 'Complete all Animal signs',
        badge_name_places_master: 'Places Master',
        badge_desc_places_master: 'Complete all Places signs',
        badge_name_actions_master: 'Actions Master',
        badge_desc_actions_master: 'Complete all Action signs',
        badge_name_time_master: 'Time Master',
        badge_desc_time_master: 'Complete all Time signs',
        badge_name_money_master: 'Money Master',
        badge_desc_money_master: 'Complete all Money & Commerce signs',
        badge_name_perfect_match: 'Perfect Match',
        badge_desc_perfect_match: 'Score 100% in a Match Game',
        badge_name_speed_demon: 'Speed Demon',
        badge_desc_speed_demon: 'Complete a Match Game in under 30 seconds',
        badge_name_lightning_fast: 'Lightning Fast',
        badge_desc_lightning_fast: 'Complete a Match Game in under 20 seconds',
        badge_name_five_streak: 'On a Roll',
        badge_desc_five_streak: 'Get 5 correct answers in a row',
        badge_name_ten_streak: 'Unstoppable',
        badge_desc_ten_streak: 'Get 10 correct answers in a row',
        badge_name_twenty_streak: 'Legendary Streak',
        badge_desc_twenty_streak: 'Get 20 correct answers in a row',
        badge_name_hundred_xp: 'XP Collector',
        badge_desc_hundred_xp: 'Earn 100 XP',
        badge_name_five_hundred_xp: 'XP Hunter',
        badge_desc_five_hundred_xp: 'Earn 500 XP',
        badge_name_thousand_xp: 'XP Champion',
        badge_desc_thousand_xp: 'Earn 1000 XP',
        badge_name_five_thousand_xp: 'XP Legend',
        badge_desc_five_thousand_xp: 'Earn 5000 XP',
        badge_name_daily_return: 'Dedicated Learner',
        badge_desc_daily_return: 'Play for 3 days in a row',
        badge_name_weekly_warrior: 'Weekly Warrior',
        badge_desc_weekly_warrior: 'Play for 7 days in a row',
        badge_name_early_bird: 'Early Bird',
        badge_desc_early_bird: 'Play before 9 AM',
        badge_name_night_owl: 'Night Owl',
        badge_desc_night_owl: 'Play after 10 PM',
        badge_name_helper_hero: 'Helper Hero',
        badge_desc_helper_hero: 'Help others learn by sharing',
        badge_name_perfectionist: 'Perfectionist',
        badge_desc_perfectionist: 'Complete 5 levels with 100% accuracy',
        badge_name_grand_master: 'Grand Master',
        badge_desc_grand_master: 'Complete all categories and reach level 6',
        badge_name_secret_explorer: 'Secret Explorer',
        badge_desc_secret_explorer: 'Find the hidden easter egg',
        badge_name_voice_master: 'Voice Master',
        badge_desc_voice_master: 'Use voice narration for 50 signs'
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

  interpolate(text, params = {}) {
    return String(text).replace(/\{(\w+)\}/g, (match, name) => (
      params[name] !== undefined ? String(params[name]) : match
    ));
  }

  t(key, params = {}) {
    const translations = this.builtInTranslations[this.currentLanguage] || {};
    if (translations[key]) {
      return this.interpolate(translations[key], params);
    }

    const englishTranslations = this.builtInTranslations.en || {};
    if (englishTranslations[key]) {
      return this.interpolate(englishTranslations[key], params);
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
