/**
 * CacheManager - IndexedDB caching layer with localStorage migration
 * 
 * Manages all client-side data storage including:
 * - Sign images (Blob storage)
 * - User progress and state
 * - Badge achievements
 * - Certificates
 * - Silent migration from localStorage to IndexedDB
 */

import { openDB } from 'idb';

const DB_NAME = 'signmaster_db';
const DB_VERSION = 1;
const MAX_STORAGE_MB = 50;

class CacheManager {
  constructor() {
    this.db = null;
    this.storageQuota = MAX_STORAGE_MB * 1024 * 1024; // 50MB in bytes
  }

  async init() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create object stores
        if (!db.objectStoreNames.contains('signs')) {
          const signStore = db.createObjectStore('signs', { keyPath: 'filename' });
          signStore.createIndex('category', 'category');
          signStore.createIndex('verified', 'verified');
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('badges')) {
          const badgeStore = db.createObjectStore('badges', { keyPath: 'id' });
          badgeStore.createIndex('earnedAt', 'earnedAt');
          badgeStore.createIndex('tier', 'tier');
        }

        if (!db.objectStoreNames.contains('certificates')) {
          const certStore = db.createObjectStore('certificates', { keyPath: 'id' });
          certStore.createIndex('generatedAt', 'generatedAt');
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    });

    // Silent migration from localStorage
    await this.migrateFromLocalStorage();

    // Set version metadata
    await this.setMetadata('version', '1.0.0');
    await this.setMetadata('lastAccess', new Date().toISOString());

    return this.db;
  }

  /**
   * Silent migration from localStorage to IndexedDB
   * Preserves existing player progress without notification
   */
  async migrateFromLocalStorage() {
    try {
      const oldData = localStorage.getItem('signmaster_progress');
      if (!oldData) return;

      const progress = JSON.parse(oldData);
      
      // Check if already migrated
      const existing = await this.getProgress('migrated');
      if (existing) return;

      console.log('🔄 Migrating localStorage data to IndexedDB...');

      // Migrate progress data
      await this.setProgress('xp', progress.xp || 0);
      await this.setProgress('currentLevel', progress.currentLevel || 1);
      await this.setProgress('completedLevels', progress.completedLevels || []);
      
      // Migrate badges
      if (progress.badges && Array.isArray(progress.badges)) {
        for (const badgeName of progress.badges) {
          await this.addBadge({
            id: badgeName,
            name: badgeName,
            earnedAt: new Date().toISOString(),
            migratedFromLocalStorage: true
          });
        }
      }

      // Mark as migrated
      await this.setProgress('migrated', true);
      await this.setProgress('migratedAt', new Date().toISOString());

      console.log('✅ Migration complete');

      // Keep localStorage for 30 days as backup
      const backupKey = `signmaster_progress_backup_${Date.now()}`;
      localStorage.setItem(backupKey, oldData);
      
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  // Progress Management
  async getProgress(key) {
    await this.init();
    const record = await this.db.get('progress', key);
    return record ? record.value : null;
  }

  async setProgress(key, value) {
    await this.init();
    await this.db.put('progress', { key, value, updatedAt: new Date().toISOString() });
  }

  async getAllProgress() {
    await this.init();
    const records = await this.db.getAll('progress');
    const progress = {};
    records.forEach(r => {
      progress[r.key] = r.value;
    });
    return progress;
  }

  // Badge Management
  async addBadge(badge) {
    await this.init();
    const badgeData = {
      ...badge,
      earnedAt: badge.earnedAt || new Date().toISOString()
    };
    await this.db.put('badges', badgeData);
  }

  async getBadge(id) {
    await this.init();
    return await this.db.get('badges', id);
  }

  async getAllBadges() {
    await this.init();
    return await this.db.getAll('badges');
  }

  async getBadgesByTier(tier) {
    await this.init();
    return await this.db.getAllFromIndex('badges', 'tier', tier);
  }

  // Sign Image Caching
  async cacheSignImage(filename, blob, metadata = {}) {
    await this.init();
    
    // Check storage quota
    if (await this.isStorageFull()) {
      await this.evictOldestImages(5);
    }

    await this.db.put('signs', {
      filename,
      blob,
      ...metadata,
      cachedAt: new Date().toISOString()
    });
  }

  async getSignImage(filename) {
    await this.init();
    const record = await this.db.get('signs', filename);
    return record ? record.blob : null;
  }

  async hasSignImage(filename) {
    await this.init();
    const record = await this.db.get('signs', filename);
    return !!record;
  }

  async getAllCachedSigns() {
    await this.init();
    return await this.db.getAll('signs');
  }

  // Certificate Management
  async saveCertificate(certificate) {
    await this.init();
    await this.db.put('certificates', {
      ...certificate,
      generatedAt: certificate.generatedAt || new Date().toISOString()
    });
  }

  async getCertificate(id) {
    await this.init();
    return await this.db.get('certificates', id);
  }

  async getAllCertificates() {
    await this.init();
    return await this.db.getAll('certificates');
  }

  async getLatestCertificate() {
    await this.init();
    const certs = await this.db.getAllFromIndex('certificates', 'generatedAt');
    return certs.length > 0 ? certs[certs.length - 1] : null;
  }

  // Metadata
  async setMetadata(key, value) {
    await this.init();
    await this.db.put('metadata', { key, value, updatedAt: new Date().toISOString() });
  }

  async getMetadata(key) {
    await this.init();
    const record = await this.db.get('metadata', key);
    return record ? record.value : null;
  }

  // Storage Management
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      return await navigator.storage.estimate();
    }
    return { usage: 0, quota: this.storageQuota };
  }

  async isStorageFull() {
    const estimate = await this.getStorageEstimate();
    return estimate.usage > (this.storageQuota * 0.9); // 90% threshold
  }

  async evictOldestImages(count = 5) {
    await this.init();
    const signs = await this.db.getAll('signs');
    
    // Sort by cachedAt (oldest first)
    signs.sort((a, b) => new Date(a.cachedAt) - new Date(b.cachedAt));
    
    // Delete oldest
    for (let i = 0; i < Math.min(count, signs.length); i++) {
      await this.db.delete('signs', signs[i].filename);
    }
    
    console.log(`🗑️ Evicted ${Math.min(count, signs.length)} cached images`);
  }

  async clearCache(storeName) {
    await this.init();
    const tx = this.db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    console.log(`🗑️ Cleared ${storeName} cache`);
  }

  async clearAllCache() {
    await this.init();
    await this.clearCache('signs');
    console.log('🗑️ All caches cleared');
  }

  // Stats
  async getCacheStats() {
    await this.init();
    const estimate = await this.getStorageEstimate();
    const signs = await this.db.getAll('signs');
    const badges = await this.db.getAll('badges');
    const certificates = await this.db.getAll('certificates');

    return {
      storage: {
        used: estimate.usage,
        quota: estimate.quota,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      },
      counts: {
        cachedSigns: signs.length,
        badges: badges.length,
        certificates: certificates.length
      }
    };
  }
}

// Export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;
