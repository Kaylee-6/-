/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative base so the build works from any sub-path (GitHub Pages, a static host, a USB stick).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'HOKKAIDO 2027 — Snow & Beyond',
        short_name: 'Hokkaido 27',
        description: '北海道冬季旅行助手：行程、住宿、交通、滑雪、预算与清单',
        lang: 'zh-CN',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F6F5F1',
        theme_color: '#20354A',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Cover photos the user adds by URL: keep a copy for offline viewing.
            urlPattern: ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cover-images',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
