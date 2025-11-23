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
    open: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/**/*.png'],
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
        icons: [
          {
            src: '/SignMaster/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/SignMaster/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff,woff2}'],
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
            urlPattern: /\/assets\/all_extracted_signs\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sign-images',
              expiration: {
                maxEntries: 1100,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
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
