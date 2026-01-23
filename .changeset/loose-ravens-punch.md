---
"recursica-forge": patch
---

## Test Infrastructure Improvements
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
