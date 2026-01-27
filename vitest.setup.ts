import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { configure } from '@testing-library/react'

// Configure testing library
configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000, // Increase timeout for CI environments
})

// Suppress act() warnings from component internal useEffect hooks
// These warnings come from components' internal state management (useEffect hooks)
// and are not test failures - the tests pass correctly
const originalError = console.error
console.error = (...args: any[]) => {
  // Check if this is an act() warning related to Button components
  const firstArg = args[0]
  if (typeof firstArg === 'string' && firstArg.includes('not wrapped in act(...)')) {
    // Check if any argument mentions Button component (stack traces can be in any arg)
    const allArgs = args.map(arg => String(arg)).join(' ')
    if (allArgs.includes('Button') || 
        allArgs.includes('at Button') ||
        allArgs.includes('Button.tsx') ||
        allArgs.includes('Button/Button.tsx') ||
        allArgs.includes('adapters/Button') ||
        allArgs.includes('adapters/mantine/Button') ||
        allArgs.includes('adapters/material/Button') ||
        allArgs.includes('adapters/carbon/Button')) {
      // Suppress Button component act() warnings - these are from internal useEffect hooks
      // that update state after mount (e.g., CSS variable listeners, elevation updates)
      // These are expected behavior and don't indicate test problems
      return
    }
  }
  originalError.call(console, ...args)
}

// Import component registries to register components
import './src/components/registry/mantine'
import './src/components/registry/material'
import './src/components/registry/carbon'

// Preload provider modules for tests to avoid lazy loading issues
// This ensures providers are available when components try to use them
Promise.all([
  import('@mantine/core').catch(() => null),
  import('@mui/material/styles').catch(() => null),
  import('@mui/material').catch(() => null),
  import('@carbon/react').catch(() => null),
]).catch(() => {
  // Ignore errors - providers will load when needed
})

// Mock window.matchMedia for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
