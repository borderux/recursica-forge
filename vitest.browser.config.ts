import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

/**
 * Browser test config — component RENDER tests only.
 *
 * These tests mount the real MUI/Mantine/Carbon adapters. In a headless DOM (jsdom/happy-dom)
 * the three libraries' CSS-in-JS injection churns and OOMs the worker, so they can't run in the
 * node/unit pipeline (see vite.config.ts `test.exclude`). Here they run in a REAL browser
 * (Playwright Chromium), where rendering behaves normally.
 *
 * Run:   npm run test:browser
 * Setup: npm i -D @vitest/browser playwright && npx playwright install chromium
 *
 * This is intentionally SEPARATE from the CI gate (`npm run test`) so it never blocks shipping.
 * Enable it in CI only once the suite is green locally (see .github/workflows/browser-tests.yml).
 */
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    globals: true,
    setupFiles: ['./vitest.browser.setup.ts'],
    include: [
      'src/components/adapters/__tests__/**/*.test.tsx',
      'src/modules/app/App.test.tsx',
    ],
    testTimeout: 30000,
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
