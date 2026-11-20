import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
// Register the real adapter's components (@recursica/adapter-mantine-v8) for every render test.
// The app does this at startup; without it the registry is empty and every dispatcher renders
// NoAdapterImplementation, so a test looking for a <button>/<table>/panel never finds one.
// The local registry is registered too, for the `local-adapter` project (see
// vitest.browser.config.ts) and LocalAdapter.test.tsx; which one renders is decided by
// activeAdapter.ts.
import './src/components/registry/mantine'
import './src/components/registry/local'

// Minimal setup for browser-mode render tests. Unlike the node setup, we don't mock
// matchMedia/ResizeObserver (a real browser provides them) and we don't intercept console.
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
})
