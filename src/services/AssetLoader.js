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
    this.loadingPromises = new Map(); // Store active loading promises
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
   * Load sign image with caching - tries WebP first, falls back to PNG
   */
  async loadSignImage(filename, category = 'unknown') {
    await this.init();

    // Check if already loaded in memory
    if (this.loaded.has(filename)) {
      return this.loaded.get(filename);
    }

    // Check if already loading
    if (this.loadingPromises.has(filename)) {
      return this.loadingPromises.get(filename);
    }

    // Create new loading promise
    const loadPromise = (async () => {
      try {
        // Try cache first (both WebP and PNG)
        const cached = await cacheManager.getSignImage(filename);
        if (cached) {
          const url = URL.createObjectURL(cached);
          this.loaded.set(filename, url);
          return url;
        }

        // Try WebP first if supported, then PNG fallback
        let response;
        let actualFilename = filename;

        if (this.supportsWebP) {
          const webpFilename = filename.replace(/\.png$/i, '.webp');
          const webpPath = `${import.meta.env.BASE_URL}assets/optimized_signs/${webpFilename}`;

          try {
            response = await fetch(webpPath);
            if (response.ok) {
              actualFilename = webpFilename;
            }
          } catch (e) {
            // WebP not available, will fallback to PNG
          }
        }

        // Fallback to original PNG
        if (!response || !response.ok) {
          const pngPath = `${import.meta.env.BASE_URL}assets/all_extracted_signs/${filename}`;
          response = await fetch(pngPath);
        }

        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`);
        }

        const blob = await response.blob();

        // Cache the image
        await cacheManager.cacheSignImage(filename, blob, { category });

        const url = URL.createObjectURL(blob);
        this.loaded.set(filename, url);
        return url;

      } catch (error) {
        console.warn(`⚠️ Image unavailable: ${filename} — using placeholder`);
        // Return a clean SVG placeholder instead of crashing
        const placeholder = this.getPlaceholderDataURI();
        this.loaded.set(filename, placeholder);
        return placeholder;
      } finally {
        this.loadingPromises.delete(filename);
      }
    })();

    this.loadingPromises.set(filename, loadPromise);
    return loadPromise;
  }

  /**
   * Generate a placeholder SVG data URI for unavailable images
   */
  getPlaceholderDataURI() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f0f0f0" rx="12"/>
      <text x="100" y="90" text-anchor="middle" font-size="40" fill="#ccc">🤟</text>
      <text x="100" y="130" text-anchor="middle" font-size="12" fill="#999" font-family="sans-serif">Image unavailable</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Lazy load image with Intersection Observer
   */
  lazyLoadImage(imgElement, filename, category) {
    // Set initial blur placeholder
    imgElement.style.filter = 'blur(8px)';
    imgElement.style.transition = 'filter 0.3s ease';

    const observer = new IntersectionObserver(async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(imgElement); // Unobserve immediately to prevent duplicate loads

          try {
            const url = await this.loadSignImage(filename, category);
            if (url) {
              imgElement.src = url;
              imgElement.style.filter = 'none';

              // Hide the loader
              const wrapper = imgElement.closest('.sign-card__image-wrapper');
              const loader = wrapper?.querySelector('.sign-card__loader');
              if (loader) {
                loader.style.display = 'none';
              }
            }
          } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            // Show error state
            imgElement.style.filter = 'none';
            imgElement.alt = 'Failed to load';
          }
        }
      }
    }, {
      rootMargin: '100px', // Load images 100px before they enter viewport
      threshold: 0
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
    this.loadingPromises.clear();

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
      loading: this.loadingPromises.size,
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
