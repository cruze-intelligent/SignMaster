import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/SignMaster/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['gsap', 'howler'],
          'db': ['idb'],
          'qr': ['qrcode']
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'SignMaster: Learn Uganda Sign Language',
        short_name: 'SignMaster USL',
        description: 'Interactive educational game for learning Uganda Sign Language with gamification and certification',
        theme_color: '#D90000',
        background_color: '#f8f9fa',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/SignMaster/',
        scope: '/SignMaster/',
        categories: ['education', 'games'],
        icons: [
          {
            src: '/SignMaster/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/SignMaster/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Browse Categories',
            short_name: 'Categories',
            url: '/SignMaster/',
            icons: [{ src: '/SignMaster/icon-192.svg', sizes: '192x192' }]
          },
          {
            name: 'Search Signs',
            short_name: 'Search',
            url: '/SignMaster/',
            icons: [{ src: '/SignMaster/icon-192.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Only precache essential app shell — sign images cache on-demand via runtime caching
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        navigateFallback: '/SignMaster/index.html',
        navigateFallbackDenylist: [
          /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff|woff2)$/i,
          /\/assets\//i
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache sign images on-demand as users browse categories
            urlPattern: /\/assets\/optimized_signs\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sign-images',
              expiration: {
                maxEntries: 1100,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Translate API responses for offline translation
            urlPattern: /^https:\/\/translate\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'translation-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['gsap', 'howler', 'idb', 'qrcode']
  }
});
