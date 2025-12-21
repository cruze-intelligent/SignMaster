/**
 * SearchEngine - Intelligent sign search and matching
 */

class SearchEngine {
  constructor() {
    this.manifest = null;
    this.searchIndex = new Map();
    this.initialized = false;
  }

  /**
   * Initialize search engine with manifest data
   */
  async init(manifest) {
    this.manifest = manifest;
    this.buildSearchIndex();
    this.initialized = true;
    console.log('🔍 SearchEngine initialized');
  }

  /**
   * Build search index from manifest
   */
  buildSearchIndex() {
    if (!this.manifest?.categories) return;

    Object.entries(this.manifest.categories).forEach(([catKey, category]) => {
      category.signs.forEach(sign => {
        const searchTerms = this.generateSearchTerms(sign);
        searchTerms.forEach(term => {
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, []);
          }
          this.searchIndex.get(term).push({
            ...sign,
            category: catKey,
            categoryName: category.name
          });
        });
      });
    });

    console.log(`📚 Search index built: ${this.searchIndex.size} terms`);
  }

  /**
   * Generate search terms for a sign
   */
  generateSearchTerms(sign) {
    const terms = new Set();

    // Add label words
    if (sign.label) {
      const label = sign.label.toLowerCase();
      terms.add(label);
      
      // Add individual words
      label.split(/\s+/).forEach(word => {
        if (word.length > 1) terms.add(word);
      });
      
      // Add label without special characters
      const cleaned = label.replace(/[^a-z0-9\s]/g, '');
      if (cleaned !== label) terms.add(cleaned);
    }

    // Add ID parts
    if (sign.id) {
      sign.id.split('_').forEach(part => {
        if (part.length > 1 && isNaN(part)) {
          terms.add(part.toLowerCase());
        }
      });
    }

    return Array.from(terms);
  }

  /**
   * Search for signs matching query
   */
  search(query) {
    if (!this.initialized || !query) return [];

    const searchQuery = query.toLowerCase().trim();
    const results = new Map();
    const scores = new Map();

    // Exact match
    if (this.searchIndex.has(searchQuery)) {
      this.searchIndex.get(searchQuery).forEach(sign => {
        const key = sign.id;
        results.set(key, sign);
        scores.set(key, 100);
      });
    }

    // Partial matches
    this.searchIndex.forEach((signs, term) => {
      if (term.includes(searchQuery) || searchQuery.includes(term)) {
        const score = this.calculateMatchScore(term, searchQuery);
        signs.forEach(sign => {
          const key = sign.id;
          if (!results.has(key) || scores.get(key) < score) {
            results.set(key, sign);
            scores.set(key, score);
          }
        });
      }
    });

    // Sort by score
    return Array.from(results.values()).sort((a, b) => {
      return scores.get(b.id) - scores.get(a.id);
    });
  }

  /**
   * Calculate match score
   */
  calculateMatchScore(term, query) {
    if (term === query) return 100;
    if (term.startsWith(query)) return 90;
    if (term.endsWith(query)) return 80;
    if (term.includes(query)) return 70;
    if (query.includes(term)) return 60;
    return 50;
  }

  /**
   * Get suggestions based on query
   */
  getSuggestions(query, limit = 10) {
    if (!query) return this.getPopularTerms(limit);

    const searchQuery = query.toLowerCase();
    const suggestions = [];

    this.searchIndex.forEach((signs, term) => {
      if (term.startsWith(searchQuery) && term !== searchQuery) {
        suggestions.push({
          term,
          count: signs.length
        });
      }
    });

    return suggestions
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(s => s.term);
  }

  /**
   * Get popular search terms
   */
  getPopularTerms(limit = 10) {
    const terms = Array.from(this.searchIndex.entries())
      .map(([term, signs]) => ({
        term,
        count: signs.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return terms.map(t => t.term);
  }

  /**
   * Search by category
   */
  searchInCategory(query, categoryKey) {
    const results = this.search(query);
    return results.filter(sign => sign.category === categoryKey);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalTerms: this.searchIndex.size,
      categories: Object.keys(this.manifest?.categories || {}).length
    };
  }
}

// Export singleton
const searchEngine = new SearchEngine();
export default searchEngine;
