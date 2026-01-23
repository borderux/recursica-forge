# recursica-forge

## 0.0.6

### Patch Changes

- d51fc48: Added handling of 404s and refresh
- 1fd967b: ## Test Infrastructure Improvements

  - Fixed React `act()` warnings in Button component tests by improving test setup and suppressing expected warnings from internal useEffect hooks
  - Fixed AAComplianceWatcher test failures by properly handling async operations and CSS variable change detection
  - Suppressed expected validation error messages in CSS variable tests to reduce test output noise
  - Fixed Material UI button integration test timing issues with improved wait logic
  - Updated bootstrap tests to properly mock varsStore methods (getState, recomputeAndApplyAll)

  ## Component Updates

  - Added Tooltip component adapter for unified tooltip functionality across UI kits
  - Updated Button, Slider components across Mantine, Material, and Carbon implementations
  - Fixed TypeScript error in PalettesPage where `levelTokenRef` could be used before assignment

  ## Bug Reporting & Shell Improvements

  - Enhanced bug reporting functionality in MantineShell with Tooltip integration
  - Updated shell components (MantineShell, MaterialShell, CarbonShell) with improved UI elements
  - Added Tooltip wrappers around action buttons for better UX

  ## Code Quality

  - Fixed CSS variable validation error suppression in tests
  - Improved test reliability and reduced flaky test failures
  - Enhanced error handling in bootstrap process

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
