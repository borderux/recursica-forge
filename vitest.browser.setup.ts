import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Minimal setup for browser-mode render tests. Unlike the node setup, we don't mock
// matchMedia/ResizeObserver (a real browser provides them) and we don't intercept console.
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
})
