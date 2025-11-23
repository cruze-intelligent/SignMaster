/**
 * AssetLoader - Optimized asset loading with caching and lazy loading
 * 
 * Features:
 * - Lazy loading via Intersection Observer
 * - IndexedDB caching for images
 * - Progressive image loading (placeholder → full)
 * - Preloading next 3 signs
 * - WebP support with PNG fallback
 */

import cacheManager from './CacheManager.js';

class AssetLoader {
  constructor() {
    this.loadQueue = [];
    this.loading = new Set();
    this.loaded = new Map();
    this.observers = new Map();
    this.supportsWebP = null;
  }

  /**
   * Initialize and check WebP support
   */
  async init() {
    if (this.supportsWebP === null) {
      this.supportsWebP = await this.checkWebPSupport();
    }
  }

  /**
   * Check if browser supports WebP
   */
  async checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Load sign image with caching
   */
  async loadSignImage(filename, category = 'unknown') {
    await this.init();

    // Check if already loaded in memory
    if (this.loaded.has(filename)) {
      return this.loaded.get(filename);
    }

    // Check if loading
    if (this.loading.has(filename)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.loaded.has(filename)) {
            clearInterval(checkInterval);
            resolve(this.loaded.get(filename));
          }
        }, 50);
      });
    }

    this.loading.add(filename);

    try {
      // Try cache first
      const cached = await cacheManager.getSignImage(filename);
      if (cached) {
        const url = URL.createObjectURL(cached);
        this.loaded.set(filename, url);
        this.loading.delete(filename);
        return url;
      }

      // Fetch from network
      const path = `${import.meta.env.BASE_URL}assets/all_extracted_signs/${filename}`;
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }

      const blob = await response.blob();
      
      // Cache the image
      await cacheManager.cacheSignImage(filename, blob, { category });

      const url = URL.createObjectURL(blob);
      this.loaded.set(filename, url);
      this.loading.delete(filename);

      return url;

    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      this.loading.delete(filename);
      throw error;
    }
  }

  /**
   * Lazy load image with Intersection Observer
   */
  lazyLoadImage(imgElement, filename, category) {
    // Set placeholder
    imgElement.style.filter = 'blur(10px)';
    imgElement.style.transition = 'filter 0.3s ease';

    const observer = new IntersectionObserver(async (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          try {
            const url = await this.loadSignImage(filename, category);
            imgElement.src = url;
            imgElement.style.filter = 'none';
            observer.unobserve(imgElement);
          } catch (error) {
            console.error('Lazy load error:', error);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    observer.observe(imgElement);
    this.observers.set(imgElement, observer);
  }

  /**
   * Preload next N signs for smoother experience
   */
  async preloadSigns(filenames, category) {
    const preloadPromises = filenames.slice(0, 3).map(filename => 
      this.loadSignImage(filename, category).catch(err => {
        console.warn(`Preload failed for ${filename}:`, err);
      })
    );

    return Promise.allSettled(preloadPromises);
  }

  /**
   * Load sign with progressive enhancement
   */
  async loadSignProgressive(imgElement, filename, category) {
    // Show low-quality placeholder first
    imgElement.style.filter = 'blur(20px)';
    imgElement.style.transition = 'filter 0.5s ease';

    try {
      // Load full image
      const url = await this.loadSignImage(filename, category);
      
      // Fade in smoothly
      const tempImg = new Image();
      tempImg.onload = () => {
        imgElement.src = url;
        imgElement.style.filter = 'blur(0)';
      };
      tempImg.src = url;

    } catch (error) {
      console.error('Progressive load error:', error);
      imgElement.style.filter = 'none';
    }
  }

  /**
   * Batch load multiple signs
   */
  async batchLoad(filenames, category, progressCallback) {
    const total = filenames.length;
    let loaded = 0;

    const promises = filenames.map(async (filename) => {
      try {
        const url = await this.loadSignImage(filename, category);
        loaded++;
        if (progressCallback) {
          progressCallback(loaded, total);
        }
        return { filename, url, success: true };
      } catch (error) {
        loaded++;
        if (progressCallback) {
          progressCallback(loaded, total);
        }
        return { filename, error, success: false };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Prefetch all signs for a category (for offline mode)
   */
  async prefetchCategory(manifest, category) {
    const categoryData = manifest.categories[category];
    if (!categoryData) return;

    const filenames = categoryData.signs.map(sign => sign.filename);
    console.log(`📥 Prefetching ${filenames.length} signs for ${category}...`);

    const results = await this.batchLoad(filenames, category, (loaded, total) => {
      if (loaded % 10 === 0) {
        console.log(`   Progress: ${loaded}/${total}`);
      }
    });

    const success = results.filter(r => r.success).length;
    console.log(`✅ Prefetched ${success}/${filenames.length} signs`);

    return results;
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache() {
    // Revoke all object URLs
    this.loaded.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    
    this.loaded.clear();
    this.loading.clear();
    
    // Disconnect all observers
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();

    console.log('🗑️ Memory cache cleared');
  }

  /**
   * Get loading stats
   */
  getStats() {
    return {
      loaded: this.loaded.size,
      loading: this.loading.size,
      observers: this.observers.size
    };
  }

  /**
   * Cleanup on page unload
   */
  cleanup() {
    this.clearMemoryCache();
  }
}

// Export singleton
const assetLoader = new AssetLoader();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    assetLoader.cleanup();
  });
}

export default assetLoader;
