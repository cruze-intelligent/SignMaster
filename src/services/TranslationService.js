/**
 * TranslationService - Multi-language support with Google Translate API
 * 
 * Supports English (default) and Acholi for the prototype
 */

class TranslationService {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = new Map();
    this.listeners = [];
    
    // Acholi to English dictionary for search
    // These map Acholi words to English words that match sign labels
    this.acholiToEnglish = {
      // Food
      'cak': 'milk',
      'bel': 'millet',
      'kal': 'sorghum',
      'kwon': 'bread',
      'ringo': 'meat',
      'rec': 'fish',
      'tong': 'egg',
      'nyig': 'beans',
      'lapena': 'banana',
      'cam': 'food',
      'kado': 'groundnuts',
      'yen': 'vegetables',
      'olwedo': 'cassava',
      'boo': 'pumpkin',
      'pii': 'water',
      'kong': 'beer',
      'cai': 'tea',
      'kawa': 'coffee',
      'mucele': 'rice',
      'layata': 'sweet potato',
      'odii': 'simsim',
      
      // Numbers
      'acel': 'one',
      'aryo': 'two',
      'adek': 'three',
      'angwen': 'four',
      'abic': 'five',
      'abicel': 'six',
      'abiro': 'seven',
      'aboro': 'eight',
      'abongwen': 'nine',
      'apar': 'ten',
      'pyeracel': 'eleven',
      'pyeraryo': 'twelve',
      'pyeradek': 'thirteen',
      'pyerangwen': 'fourteen',
      'pyerabic': 'fifteen',
      'pyerabicel': 'sixteen',
      'pyerabiro': 'seventeen',
      'pyeraboro': 'eighteen',
      'pyerabongwen': 'nineteen',
      'pyeraryo': 'twenty',
      'pyeradek': 'thirty',
      'pyerangwen': 'forty',
      'pyerabic': 'fifty',
      'miya': 'hundred',
      'alip': 'thousand',
      
      // Family
      'mama': 'mother',
      'baba': 'father',
      'wod': 'son',
      'nya': 'daughter',
      'omin': 'brother',
      'lamin': 'sister',
      'kwaro': 'grandfather',
      'dayo': 'grandmother',
      'coo': 'man',
      'dako': 'woman',
      'latin': 'child',
      'lutino': 'children',
      'wat': 'relative',
      'cwiny': 'husband',
      'dakone': 'wife',
      
      // Greetings
      'apwoyo': 'thank you',
      'atye maber': 'fine',
      'itye nining': 'how are you',
      'ber': 'good',
      'marac': 'bad',
      
      // Colors
      'tar': 'white',
      'col': 'black',
      'makwar': 'red',
      'matut': 'green',
      'ma raburabura': 'yellow',
      'bulu': 'blue',
      
      // Animals
      'dyel': 'goat',
      'romo': 'sheep',
      'dyagi': 'cattle',
      'gweno': 'chicken',
      'gwok': 'dog',
      'paka': 'cat',
      'lyec': 'elephant',
      'labwor': 'lion',
      'abuya': 'monkey',
      'twon': 'bull',
      
      // Body parts
      'wi': 'head',
      'wang': 'eye',
      'it': 'ear',
      'um': 'nose',
      'dogi': 'mouth',
      'cin': 'hand',
      'tyeni': 'leg',
      'ic': 'stomach',
      'cogo': 'bone',
      'rem': 'blood',
      
      // Actions
      'camo': 'eat',
      'mato': 'drink',
      'nino': 'sleep',
      'woto': 'walk',
      'ringo': 'run',
      'pwonyo': 'teach',
      'kwano': 'read',
      'cono': 'write',
      'miyo': 'give',
      'gamo': 'receive',
      'neno': 'see',
      'winyo': 'hear',
      
      // Places
      'gang': 'home',
      'cuk': 'school',
      'ot': 'house',
      'paco': 'village',
      'nam': 'lake',
      'kulu': 'river',
      'got': 'mountain',
      
      // Time
      'tin': 'today',
      'diki': 'tomorrow',
      'lawo': 'yesterday',
      'odikinino': 'morning',
      'odiko': 'evening',
      'dyewor': 'night',
      
      // Common words
      'eyo': 'yes',
      'pe': 'no',
      'tika': 'please',
      'kare': 'time',
      'cawa': 'hour'
    };
    
    // Built-in translations for common UI strings
    this.builtInTranslations = {
      en: {
        // Navigation
        'home': 'Home',
        'categories': 'Categories',
        'search': 'Search',
        'progress': 'Progress',
        'settings': 'Settings',
        
        // Progress Screen
        'your_progress': 'Your Progress',
        'total_xp': 'Total XP',
        'level': 'Level',
        'signs_learned': 'Signs Learned',
        'badges_earned': 'Badges Earned',
        'rank': 'Rank',
        'download_certificate': 'Download Certificate',
        'learning_streak': 'Learning Streak',
        'days': 'days',
        'accuracy': 'Accuracy',
        'categories_completed': 'Categories Completed',
        'total_practice_time': 'Total Practice Time',
        'hours': 'hours',
        'minutes': 'minutes',
        
        // Settings
        'sound_effects': 'Sound Effects',
        'voice_narration': 'Voice Narration',
        'high_contrast': 'High Contrast Mode',
        'language': 'Language',
        'player_name': 'Player Name',
        'reset_progress': 'Reset Progress',
        'export_data': 'Export Data',
        'import_data': 'Import Data',
        'about': 'About SignMaster',
        
        // Modal
        'learn_this': "I've Learned This",
        'practice': 'Practice',
        'learn_to_sign': 'Learn to sign',
        'in_usl': 'in Uganda Sign Language',
        
        // General
        'welcome': 'Welcome',
        'start_learning': 'Start Learning',
        'continue_learning': 'Continue Learning',
        'beginner': 'Beginner',
        'intermediate': 'Intermediate',
        'advanced': 'Advanced',
        'verified': 'Verified',
        
        // Certificate
        'certificate_achievement': 'Certificate of Achievement',
        'this_certifies': 'This certifies that',
        'completed_program': 'has successfully completed the SignMaster program',
        'demonstrated_proficiency': 'and demonstrated proficiency in Uganda Sign Language'
      },
      
      ach: {
        // Navigation - Acholi translations
        'home': 'Paco',
        'categories': 'Buce',
        'search': 'Yeny',
        'progress': 'Donyo Nyim',
        'settings': 'Ter',
        
        // Progress Screen
        'your_progress': 'Donyo Nyimi',
        'total_xp': 'XP Weng',
        'level': 'Rwom',
        'signs_learned': 'Lanyut ma Opwonye',
        'badges_earned': 'Alama ma Uyako',
        'rank': 'Kite',
        'download_certificate': 'Gam Waraga',
        'learning_streak': 'Nino me Pwony',
        'days': 'nino',
        'accuracy': 'Atira',
        'categories_completed': 'Buce ma Otyeko',
        'total_practice_time': 'Cawa me Pwony Weng',
        'hours': 'cawa',
        'minutes': 'dakika',
        
        // Settings
        'sound_effects': 'Dwon',
        'voice_narration': 'Lok ki Dwon',
        'high_contrast': 'Nen Maber',
        'language': 'Leb',
        'player_name': 'Nyingi',
        'reset_progress': 'Cak Odoco',
        'export_data': 'Kel Nyig Woko',
        'import_data': 'Kel Nyig Iye',
        'about': 'Lok i Kom SignMaster',
        
        // Modal
        'learn_this': 'Apwonye Meni',
        'practice': 'Tem',
        'learn_to_sign': 'Pwony lanyut me',
        'in_usl': 'ki Leb Lanyut Uganda',
        
        // General
        'welcome': 'Wacito Maber',
        'start_learning': 'Cak Pwony',
        'continue_learning': 'Mede Pwony',
        'beginner': 'Acakki',
        'intermediate': 'Adye',
        'advanced': 'Lanyut',
        'verified': 'Moko',
        
        // Certificate
        'certificate_achievement': 'Waraga me Twero',
        'this_certifies': 'Meni nyutu ni',
        'completed_program': 'otyeko pwony SignMaster maber',
        'demonstrated_proficiency': 'kendo onyutu ngec i Leb Lanyut Uganda'
      }
    };
  }

  /**
   * Initialize translation service
   */
  async init() {
    // Load saved language preference
    const savedLang = localStorage.getItem('signmaster_language');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    console.log(`🌍 Translation service initialized: ${this.currentLanguage}`);
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get language display name
   */
  getLanguageName(code) {
    const names = {
      'en': 'English',
      'ach': 'Acholi (Lwo)'
    };
    return names[code] || code;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'ach', name: 'Acholi', native: 'Lwo' }
    ];
  }

  /**
   * Set current language
   */
  async setLanguage(langCode) {
    if (this.currentLanguage === langCode) return;
    
    this.currentLanguage = langCode;
    localStorage.setItem('signmaster_language', langCode);
    
    // Notify listeners
    this.listeners.forEach(callback => callback(langCode));
    
    console.log(`🌍 Language changed to: ${langCode}`);
  }

  /**
   * Translate a key
   */
  t(key) {
    const translations = this.builtInTranslations[this.currentLanguage];
    if (translations && translations[key]) {
      return translations[key];
    }
    
    // Fallback to English
    const englishTranslations = this.builtInTranslations['en'];
    if (englishTranslations && englishTranslations[key]) {
      return englishTranslations[key];
    }
    
    // Return key if no translation found
    return key;
  }

  /**
   * Translate dynamic text using Google Translate API
   * Note: For production, you'd use an actual API key
   */
  async translateText(text, targetLang = null) {
    const lang = targetLang || this.currentLanguage;
    
    if (lang === 'en') return text;
    
    // For the prototype, we use a simple fetch to Google Translate
    // In production, use the official API with proper authentication
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      return text;
    } catch (error) {
      console.warn('Translation failed, using original text:', error);
      return text;
    }
  }

  /**
   * Register a listener for language changes
   */
  onLanguageChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a language change listener
   */
  offLanguageChange(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Translate Acholi search query to English for sign lookup
   * Uses local dictionary first, then falls back to Google Translate
   */
  async translateSearchQuery(query) {
    if (this.currentLanguage === 'en') {
      return query; // No translation needed
    }
    
    const queryLower = query.toLowerCase().trim();
    
    // First, check our local Acholi-to-English dictionary
    if (this.acholiToEnglish[queryLower]) {
      console.log(`🔤 Local translation: "${query}" → "${this.acholiToEnglish[queryLower]}"`);
      return this.acholiToEnglish[queryLower];
    }
    
    // Check if query contains multiple words - translate each
    const words = queryLower.split(/\s+/);
    if (words.length > 1) {
      const translatedWords = words.map(word => 
        this.acholiToEnglish[word] || word
      );
      const localTranslation = translatedWords.join(' ');
      if (localTranslation !== queryLower) {
        console.log(`🔤 Multi-word translation: "${query}" → "${localTranslation}"`);
        return localTranslation;
      }
    }
    
    // Fall back to Google Translate API (Acholi → English)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ach&tl=en&dt=t&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0][0][0].toLowerCase();
        console.log(`🌐 API translation: "${query}" → "${translated}"`);
        return translated;
      }
    } catch (error) {
      console.warn('Google Translate failed:', error);
    }
    
    // Return original if translation fails
    return query;
  }

  /**
   * Get search placeholder based on current language
   */
  getSearchPlaceholder() {
    if (this.currentLanguage === 'ach') {
      return 'Yeny ki Acholi onyo English...';
    }
    return 'Search signs...';
  }
}

// Export singleton instance
const translationService = new TranslationService();
export default translationService;
