import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { configure, cleanup as rtlCleanup } from '@testing-library/react'

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
        allArgs.includes('adapters/carbon/Button') ||
        allArgs.includes('Accordion') ||
        allArgs.includes('at Accordion') ||
        allArgs.includes('Accordion.tsx') ||
        allArgs.includes('Accordion/Accordion.tsx') ||
        allArgs.includes('adapters/Accordion') ||
        allArgs.includes('adapters/mantine/Accordion') ||
        allArgs.includes('adapters/material/Accordion') ||
        allArgs.includes('adapters/carbon/Accordion')) {
      // Suppress Button and Accordion component act() warnings - these are from internal useEffect hooks
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

// Mock ResizeObserver for Mantine components (used by FloatingIndicator)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Cleanup function to remove all event listeners and observers after each test
// This prevents tests from hanging due to active listeners
import { afterEach, afterAll } from 'vitest'

afterEach(async () => {
  // Cleanup React Testing Library (unmounts all components)
  rtlCleanup()
  
  // Clear all timers
  vi.clearAllTimers()
  
  // Clear document styles to reset CSS variables
  document.documentElement.style.cssText = ''
  
  // Wait a tick to allow any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 0))
})

// Global teardown to ensure all resources are cleaned up
afterAll(async () => {
  // Clear all timers one final time
  vi.clearAllTimers()
  
  // Clear document
  document.documentElement.style.cssText = ''
  
  // Wait for any pending operations
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Force exit if we're in a test environment (prevents hanging)
  if (process.env.NODE_ENV === 'test') {
    // Give a small delay then force exit
    setTimeout(() => {
      if (typeof process !== 'undefined' && process.exit) {
        // Only exit if we're truly stuck (this is a last resort)
        // Vitest should handle cleanup, but this prevents infinite hangs
      }
    }, 1000)
  }
})
