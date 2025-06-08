import { defineConfig } from "vite"

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
})
