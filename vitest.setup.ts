import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
