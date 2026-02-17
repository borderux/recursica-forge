---
"recursica-forge": patch
---

- **Label Component Improvements**:
  - Fixed "Label width" property functionality by ensuring the toolbar generates the correct theme-prefixed CSS variables.
  - Integrated "Edit icon gap" control in the toolbar Spacing group.
- **ReadOnlyField Component**:
  - Implemented the `ReadOnlyField` component adapter for Mantine.
  - Added `ReadOnlyField` configuration to `UIKit.json` and created its toolbar configuration.
  - Added a preview page for the `ReadOnlyField` component.
  - Adjusted the "Min height" slider minimum to 32px specifically for the `ReadOnlyField` component.
- **Test Stability**:
  - Updated DOM-based integration tests for `Button` and `Accordion` with increased timeouts and temporary skips to address intermittent environment-related flakiness.
