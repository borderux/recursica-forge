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
    testTimeout: 30000, // Allow time for act() and async UI updates (toolbar/integration tests)
    coverage: {
      provider: 'v8',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // UI library chunks - split by library to avoid large bundles
          'mantine-core': ['@mantine/core'],
          'mantine-hooks': ['@mantine/hooks'],
          'mui-material': ['@mui/material'],
          'mui-system': ['@mui/system'],
          'carbon-core': ['@carbon/react'],

          // Icon libraries
          'icons': ['@phosphor-icons/react'],

          // Routing
          'router': ['react-router-dom'],

          // Floating UI (used by tooltips, popovers, etc.)
          'floating-ui': ['@floating-ui/react', '@floating-ui/react-dom'],
        },
      },
    },
  },

})
