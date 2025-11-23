/**
 * ManifestLoader - Load and manage signs manifest
 * 
 * Handles loading the signs-manifest.json file and provides
 * convenient methods to access signs by category, difficulty, etc.
 */

class ManifestLoader {
  constructor() {
    this.manifest = null;
    this.loading = null;
  }

  /**
   * Load the manifest (singleton pattern)
   */
  async loadManifest() {
    if (this.manifest) return this.manifest;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}src/data/signs-manifest.json`);
        if (!response.ok) {
          throw new Error('Failed to load manifest');
        }
        this.manifest = await response.json();
        console.log(`📋 Manifest loaded: ${Object.keys(this.manifest.categories).length} categories`);
        return this.manifest;
      } catch (error) {
        console.error('Error loading manifest:', error);
        throw error;
      } finally {
        this.loading = null;
      }
    })();

    return this.loading;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const manifest = await this.loadManifest();
    return Object.keys(manifest.categories);
  }

  /**
   * Get signs for a specific category
   */
  async getCategorySigns(category) {
    const manifest = await this.loadManifest();
    return manifest.categories[category]?.signs || [];
  }

  /**
   * Get sign by ID
   */
  async getSignById(signId) {
    const manifest = await this.loadManifest();
    for (const category in manifest.categories) {
      const sign = manifest.categories[category].signs.find(s => s.id === signId);
      if (sign) return sign;
    }
    return null;
  }

  /**
   * Get signs by difficulty
   */
  async getSignsByDifficulty(difficulty) {
    const manifest = await this.loadManifest();
    const signs = [];
    
    for (const category in manifest.categories) {
      const categorySigns = manifest.categories[category].signs.filter(
        s => s.difficulty === difficulty
      );
      signs.push(...categorySigns);
    }
    
    return signs;
  }

  /**
   * Get total sign count
   */
  async getTotalSignCount() {
    const manifest = await this.loadManifest();
    let total = 0;
    
    for (const category in manifest.categories) {
      total += manifest.categories[category].signs.length;
    }
    
    return total;
  }

  /**
   * Get category statistics
   */
  async getCategoryStats() {
    const manifest = await this.loadManifest();
    const stats = {};
    
    for (const category in manifest.categories) {
      const signs = manifest.categories[category].signs;
      stats[category] = {
        total: signs.length,
        verified: signs.filter(s => s.verified).length,
        difficulties: {
          beginner: signs.filter(s => s.difficulty === 'beginner').length,
          intermediate: signs.filter(s => s.difficulty === 'intermediate').length,
          advanced: signs.filter(s => s.difficulty === 'advanced').length
        }
      };
    }
    
    return stats;
  }

  /**
   * Search signs by label
   */
  async searchSigns(query) {
    const manifest = await this.loadManifest();
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const category in manifest.categories) {
      const categorySigns = manifest.categories[category].signs.filter(
        s => s.label.toLowerCase().includes(lowerQuery)
      );
      results.push(...categorySigns.map(s => ({ ...s, category })));
    }
    
    return results;
  }
}

// Export singleton
const manifestLoader = new ManifestLoader();
export default manifestLoader;
