---
"recursica-forge": patch
---

Refactored component adapters (Mantine, Material, Carbon, and generic) to properly resolve CSS variables for custom variants. Replaced deprecated `getComponentCssVar` with `buildComponentCssVarPath` across all components to ensure robust CSS variable path generation aligned with `recursica_ui-kit.json`.
