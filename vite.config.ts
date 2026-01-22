import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { watchToolbarIcons } from './vite-plugins/watch-toolbar-icons'
import { copy404Html } from './vite-plugins/copy-404'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // Custom domain, so base is root
  plugins: [react(), vanillaExtractPlugin(), watchToolbarIcons(), copy404Html()],
  optimizeDeps: {
    // Exclude phosphor-react from pre-bundling to avoid timeout issues
    // Individual icon imports will still work fine
    exclude: ['phosphor-react'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
    },
  },
})
