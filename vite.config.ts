import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base:'/budgetup/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Generate service worker using the built-in Workbox integration
      workbox: {
        // Cache the app shell and all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache Google Fonts requests — they have their own cache headers
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheet
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Cache Google Fonts files long-term
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      // Web app manifest
      manifest: {
        name: 'Paisa — Personal Budget',
        short_name: 'Paisa',
        description: 'A minimalistic, offline-first personal budgeting app.',
        start_url: '/budgetup/',
        scope: '/budgetup/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#F7F6F3',   // ivory — matches light theme background
        theme_color: '#0D9488',        // teal primary
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Dev options — enable SW in dev so we can inspect it
      devOptions: {
        enabled: false, // keep dev fast; enable manually if needed
      },
    }),
  ],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
})
