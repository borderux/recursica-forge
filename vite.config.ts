import { defineConfig, configDefaults } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { watchToolbarIcons } from './vite-plugins/watch-toolbar-icons'
import { copy404Html } from './vite-plugins/copy-404'
import { copyUIKit } from './vite-plugins/copy-uikit'
import { contentSecurityPolicy } from './vite-plugins/csp'
import { schemaValidators } from './vite-plugins/schema-validators'

/** Origins of the Recursica API the app may call, for the Content-Security-Policy. */
function recursicaApiOrigins(mode: string): string[] {
  const configured = loadEnv(mode, process.cwd(), 'VITE_').VITE_RECURSICA_API_URL
  const origins = ['https://api.recursica.com']
  if (configured) {
    try {
      origins.push(new URL(configured).origin)
    } catch {
      // An invalid URL fails at runtime anyway; leave it out of the policy.
    }
  }
  return origins
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Custom domain, so base is root
  plugins: [
    react(),
    vanillaExtractPlugin(),
    schemaValidators(),
    watchToolbarIcons(),
    contentSecurityPolicy({ apiOrigins: recursicaApiOrigins(mode) }),
    copy404Html(),
    copyUIKit(),
  ],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' && !process.env.VITEST ? ['console', 'debugger'] as any : [],
  },
  test: {
    // This is the node/unit run and the CI gate (`npm run test`). Component render tests
    // (src/components/adapters/__tests__/**.test.tsx + App.test.tsx) that mount the real
    // MUI/Mantine/Carbon adapters are EXCLUDED here: rendering three CSS-in-JS libraries in a
    // headless DOM OOMs the worker. Those run in a REAL browser via `npm run test:browser`
    // (see vitest.browser.config.ts). Logic tests (*.test.ts) run here; some read `document`,
    // so we keep a lightweight DOM environment (happy-dom).
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 30000,
    exclude: [
      ...configDefaults.exclude,
      'src/components/adapters/__tests__/**',
      'src/modules/app/App.test.tsx',
    ],
    coverage: {
      provider: 'v8',
    },
  },
  build: {
    target: 'es2020',
    // The repo is public, but there is no need to publish maps; build locally to debug.
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core (removed manual chunk to avoid initialization order issues with floating-ui)
          // if (id.includes('node_modules/react/') ||
          //   id.includes('node_modules/react-dom/') ||
          //   id.includes('node_modules/react/jsx-runtime')) {
          //   return 'react-vendor'
          // }
          // MUI + Emotion must be in the SAME chunk to avoid Safari
          // initialization-order crash (Emotion styled helper must be
          // defined before MUI references it)
          if (id.includes('node_modules/@mui/') ||
            id.includes('node_modules/@emotion/')) {
            return 'mui-vendor'
          }
          // Mantine
          if (id.includes('node_modules/@mantine/core')) {
            return 'mantine-core'
          }
          if (id.includes('node_modules/@mantine/hooks')) {
            return 'mantine-hooks'
          }
          // Carbon
          if (id.includes('node_modules/@carbon/')) {
            return 'carbon-core'
          }
          // Icon libraries
          if (id.includes('node_modules/@phosphor-icons/')) {
            return 'icons'
          }
          // Routing
          if (id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/react-router/')) {
            return 'router'
          }
          // Floating UI (removed manual chunk)
          // if (id.includes('node_modules/@floating-ui/')) {
          //   return 'floating-ui'
          // }
        },
      },
    },
  },

}))
