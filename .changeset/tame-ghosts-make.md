---
"recursica-forge": patch
---

- Fixed "Reset to defaults" functionality in the component toolbar to correctly revert all component-specific CSS variables to their factory settings using the original JSON definitions.
- Resolved an issue where "Focus" state variant selections in the toolbar were not reflecting in the live preview for Dropdown and TextField components.
- Updated TextField and Dropdown adapters (Mantine, Carbon, and Material) to correctly apply and preview focus-specific styles (border size, color) when the focus state is selected in the toolbar.
- Refined component previews by removing assistive text from focus state examples for a clearer layout.
- Improved Mantine Dropdown trigger logic to ensure focus styles are visually persistent when the state is forced via props.
