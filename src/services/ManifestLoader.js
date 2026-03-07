/**
 * ManifestLoader - Load and manage the reviewed sign manifest.
 *
 * The runtime catalog is built by merging the legacy sign manifest with the
 * review ledger so only approved signs remain visible in the app.
 */

import manifestData from '../data/signs-manifest.json';
import contentReviewData from '../data/content-review.json';

class ManifestLoader {
  constructor() {
    this.manifest = null;
    this.reviewIndex = null;
  }

  /**
   * Load the manifest (singleton pattern).
   */
  async loadManifest() {
    if (this.manifest) return this.manifest;

    try {
      this.reviewIndex = this.buildReviewIndex(contentReviewData);
      this.manifest = this.applyContentReview(manifestData, this.reviewIndex, contentReviewData);
      const signCount = this.getApprovedSignCount();
      console.log(
        `📋 Manifest loaded: ${Object.keys(this.manifest.categories).length} categories, ${signCount} approved signs`
      );
      return this.manifest;
    } catch (error) {
      console.error('Error loading manifest:', error);
      throw error;
    }
  }

  /**
   * Build a lookup table for reviewed rows.
   */
  buildReviewIndex(reviewData) {
    const index = new Map();
    for (const record of reviewData.records || []) {
      index.set(record.id, record);
    }
    return index;
  }

  /**
   * Merge the legacy manifest with review metadata and keep approved signs only.
   */
  applyContentReview(baseManifest, reviewIndex, reviewData) {
    const reviewedManifest = {
      ...baseManifest,
      categories: {},
      contentDisclaimer:
        'Only signs marked approved in the local content review ledger are shown. Media provenance stays with the existing repository assets unless a reviewed override is recorded.',
      reviewSummary: reviewData.summary,
      sourceAnchors: reviewData.sourceAnchors || []
    };

    for (const [categoryKey, categoryData] of Object.entries(baseManifest.categories || {})) {
      const approvedSigns = categoryData.signs
        .map(sign => this.mergeReviewedSign(sign, categoryKey, reviewIndex.get(sign.id)))
        .filter(Boolean);

      if (approvedSigns.length > 0) {
        reviewedManifest.categories[categoryKey] = {
          ...categoryData,
          signs: approvedSigns
        };
      }
    }

    return reviewedManifest;
  }

  /**
   * Merge a single sign with its review entry.
   */
  mergeReviewedSign(sign, categoryKey, reviewRecord) {
    if (!reviewRecord || reviewRecord.status !== 'approved') {
      return null;
    }

    const override = reviewRecord.assetOverride || {};

    return {
      ...sign,
      category: categoryKey,
      originalLabel: sign.label,
      label: reviewRecord.approvedLabel || sign.label,
      acholiLabel: reviewRecord.acholiLabel || '',
      reviewStatus: reviewRecord.status,
      reviewNotes: reviewRecord.reviewNotes || '',
      sourceRefs: reviewRecord.sourceRefs || [],
      licenseStatus: reviewRecord.licenseStatus || 'existing-repo-asset',
      instruction: {
        handshape: reviewRecord.instruction?.handshape || '',
        location: reviewRecord.instruction?.location || '',
        orientation: reviewRecord.instruction?.orientation || '',
        movement: reviewRecord.instruction?.movement || '',
        usageTip: reviewRecord.instruction?.usageTip || ''
      },
      searchAliases: this.getSearchAliases(sign, reviewRecord),
      filename: override.filename || sign.filename,
      path: override.path || sign.path
    };
  }

  getSearchAliases(sign, reviewRecord) {
    const aliases = new Set();

    if (reviewRecord?.approvedLabel && reviewRecord.approvedLabel !== sign.label) {
      aliases.add(reviewRecord.approvedLabel);
    }

    if (sign.label) {
      aliases.add(sign.label);
    }

    if (reviewRecord?.acholiLabel) {
      aliases.add(reviewRecord.acholiLabel);
    }

    return Array.from(aliases);
  }

  /**
   * Get total count of approved signs.
   */
  getApprovedSignCount() {
    if (!this.manifest) return 0;
    return Object.values(this.manifest.categories).reduce((sum, category) => sum + category.signs.length, 0);
  }

  /**
   * Get the review summary.
   */
  getReviewSummary() {
    return this.manifest?.reviewSummary || contentReviewData.summary || null;
  }

  /**
   * Get all category keys.
   */
  async getCategories() {
    const manifest = await this.loadManifest();
    return Object.keys(manifest.categories);
  }

  /**
   * Get the raw reviewed manifest object.
   */
  getManifest() {
    return this.manifest;
  }

  /**
   * Get signs for a specific category.
   */
  async getCategorySigns(category) {
    const manifest = await this.loadManifest();
    return manifest.categories[category]?.signs || [];
  }

  /**
   * Get category metadata including the display name.
   */
  async getCategory(category) {
    const manifest = await this.loadManifest();
    return manifest.categories[category] || null;
  }

  /**
   * Get sign by ID.
   */
  async getSignById(signId) {
    const manifest = await this.loadManifest();
    for (const category of Object.values(manifest.categories)) {
      const sign = category.signs.find(entry => entry.id === signId);
      if (sign) return sign;
    }
    return null;
  }

  /**
   * Get signs by difficulty.
   */
  async getSignsByDifficulty(difficulty) {
    const manifest = await this.loadManifest();
    const signs = [];

    for (const category of Object.values(manifest.categories)) {
      signs.push(...category.signs.filter(sign => sign.difficulty === difficulty));
    }

    return signs;
  }

  /**
   * Get total approved sign count.
   */
  async getTotalSignCount() {
    const manifest = await this.loadManifest();
    return Object.values(manifest.categories).reduce((sum, category) => sum + category.signs.length, 0);
  }

  /**
   * Get per-category statistics for the approved subset.
   */
  async getCategoryStats() {
    const manifest = await this.loadManifest();
    const stats = {};

    for (const [categoryKey, category] of Object.entries(manifest.categories)) {
      const signs = category.signs;
      stats[categoryKey] = {
        total: signs.length,
        approved: signs.length,
        difficulties: {
          beginner: signs.filter(sign => sign.difficulty === 'beginner').length,
          intermediate: signs.filter(sign => sign.difficulty === 'intermediate').length,
          advanced: signs.filter(sign => sign.difficulty === 'advanced').length
        }
      };
    }

    return stats;
  }

  /**
   * Search signs by label and related aliases.
   */
  async searchSigns(query) {
    const manifest = await this.loadManifest();
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const [categoryKey, category] of Object.entries(manifest.categories)) {
      const categoryResults = category.signs.filter(sign => {
        const searchTexts = [sign.label, sign.originalLabel, sign.acholiLabel, ...(sign.searchAliases || [])]
          .filter(Boolean)
          .map(value => value.toLowerCase());
        return searchTexts.some(value => value.includes(lowerQuery));
      });

      results.push(...categoryResults.map(sign => ({ ...sign, category: categoryKey })));
    }

    return results;
  }
}

const manifestLoader = new ManifestLoader();
export default manifestLoader;
