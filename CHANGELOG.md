# recursica-forge

## 0.0.5

### Patch Changes

- eac8ff8: ## Test Infrastructure Improvements

  ### Fixed AAComplianceWatcher for Node.js Test Environments

  - Added `window` guards in `AAComplianceWatcher.ts` to prevent unhandled errors when running tests in Node.js environments where `window` is undefined
  - Updated `setupWatcher()` and `destroy()` methods to check for `window` existence before accessing it
  - Resolves unhandled rejection errors that were causing test failures

  ### Component Registry Setup for Tests

  - Added component registry imports to `vitest.setup.ts` to ensure components are properly registered before tests run
  - Imports mantine, material, and carbon component registries
  - Fixes issues where components weren't available during test execution

  ### Button Component Reactivity Improvements

  - Made Mantine Button component reactive to CSS variable changes using `useCssVar` hook
  - Button now properly updates when toolbar changes CSS variables for background color and height
  - Ensures components respond correctly to dynamic CSS variable updates

  ### Test Helper Improvements

  - Added `waitForButton` helper function in Button toolbar tests to properly wait for Suspense components to load
  - Updated all Button toolbar tests to use the helper instead of immediately querying for button elements
  - Tests now check inline styles first (where CSS variables are set), then fall back to computed styles
  - Improved timeout handling for async component loading

  ### Test Fixes

  - Updated Button toolbar tests to properly wait for component initialization before checking CSS variables
  - Fixed CSS variable assertion logic to check both inline and computed styles
  - Improved test reliability by ensuring components are fully loaded before assertions

  ## Impact

  - Eliminates unhandled errors in test suite
  - Improves test reliability and reduces flakiness
  - Ensures components properly react to CSS variable changes
  - Better test isolation and component loading handling

## 0.0.4

### Patch Changes

- Test release again

## 0.0.3

### Patch Changes

- Testing deploy process

## 0.0.2

### Patch Changes

- Test of release process

## 0.0.1

### Patch Changes

- This is a change
