/**
 * Vite Configuration
 *
 * - Uses the Vue plugin for SFC compilation
 * - Sets base path to /suteki/ for GitHub Pages deployment
 * - Proxies /api requests to the Express backend during local dev
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  // Sub-directory base for GitHub Pages
  base: '/suteki/',

  server: {
    proxy: {
      // Forward API calls to the Express server running on port 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
