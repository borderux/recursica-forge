---
"recursica-forge": minor
---

- **Design System & Tokens**:
  - Migrated component design tokens to the 2.0 schema format.
  - Standardized text color CSS variable keys to use `text-color` instead of `text`.
  - Inverted background and text color tokens across all component test exports.
- **Interactive States & Styling**:
  - Centralized component interactive states with a new global CSS system (`src/styles/interactive-states.css`).
  - Added a dedicated "States" navigation page (`StatesPage`) to preview and test different interactive states.
  - Added support for visited states in the `Link` component and improved focus/hover styles across components.
- **Component Refactoring**:
  - Replaced the standalone `Switch` component with `SwitchGroup`.
  - Added support and previews for sub-components like `TabsItem` and `RadioButtonItem`.
  - Decoupled panel and modal background/padding properties into separate sub-element controls (header, content, footer).
  - Promoted pagination active-page references to top-level properties.
- **Toolbar & Property Controls**:
  - Centralized component toolbar configuration loading using a new path resolution utility (`toolbarPathResolver`).
  - Added global reference controls and global binding support for component property controls.
  - Updated and refined toolbar configurations across all components, including support for state-based variable controls and standardized toolbar icons.
- **Testing & Tooling**:
  - Enabled and configured browser-based testing for toolbar components using Vitest.
  - Optimized test runner configuration to reduce memory usage.

