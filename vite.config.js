import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  plugins: [
    VitePWA({
      // Opsi ini akan membuat plugin menghasilkan sw.js sendiri
      strategies: 'generateSW', 
      registerType: 'autoUpdate',
      // Konfigurasi ini mengambil data dari manifest.json Anda
      manifest: {
        name: "Story App - Dicoding",
        short_name: "StoryApp",
        description: "Aplikasi berbagi cerita untuk submission Dicoding dengan fitur PWA lengkap",
        theme_color: "#667eea",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: 'android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'android-icon-512x512.png', // Tambahkan ikon yang lebih besar
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Aturan untuk caching runtime (misal, untuk API atau gambar dari CDN)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.href.startsWith('https://story-api.dicoding.dev'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'story-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 hari
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})