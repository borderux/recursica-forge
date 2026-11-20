import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

/**
 * Browser test config — component RENDER tests only.
 *
 * These tests mount the real Mantine adapters. In a headless DOM (jsdom/happy-dom)
 * the library's CSS-in-JS injection churns and OOMs the worker, so they can't run in the
 * node/unit pipeline (see vite.config.ts `test.exclude`). Here they run in a REAL browser
 * (Playwright Chromium), where rendering behaves normally.
 *
 * Run:   npm run test:browser
 * Setup: npm i -D @vitest/browser playwright && npx playwright install chromium
 *
 * This is intentionally SEPARATE from the CI gate (`npm run test`) so it never blocks shipping.
 * Enable it in CI only once the suite is green locally (see .github/workflows/browser-tests.yml).
 */
/**
 * Suites that assert the LOCAL adapter's own implementation details — its `.recursica-*` class
 * names and the private inline CSS custom properties its components set (`--accordion-bg`,
 * `--panel-hf-padding-x`, …). The real adapter has neither: it styles itself from the global
 * `--recursica_ui-kit_components_*` variables, via its own stylesheet and Forge's scoped CSS
 * engine, which these render tests don't load. So these run as a separate project with the
 * local adapter active instead of failing against the real one.
 */
const LOCAL_ADAPTER_SUITES = [
  'src/components/adapters/__tests__/Panel.toolbar.test.tsx',
  'src/components/adapters/__tests__/Accordion.toolbar.test.tsx',
  'src/components/adapters/__tests__/AssistiveElement.toolbar.test.tsx',
]

// A function, not a shared object: Vitest writes each project's name onto its browser
// instance, so two projects sharing one `instances` array end up labelled (and run) as one.
const browser = () => ({
  enabled: true,
  provider: 'playwright' as const,
  headless: true,
  instances: [{ browser: 'chromium' as const }],
})

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    globals: true,
    testTimeout: 30000,
    projects: [
      {
        extends: true,
        test: {
          name: 'real-adapter',
          setupFiles: ['./vitest.browser.setup.ts'],
          include: [
            'src/components/adapters/__tests__/**/*.test.tsx',
            'src/modules/app/App.test.tsx',
          ],
          exclude: LOCAL_ADAPTER_SUITES,
          browser: browser(),
        },
      },
      {
        extends: true,
        test: {
          name: 'local-adapter',
          setupFiles: ['./vitest.browser.local.setup.ts', './vitest.browser.setup.ts'],
          include: LOCAL_ADAPTER_SUITES,
          browser: browser(),
        },
      },
    ],
  },
})
