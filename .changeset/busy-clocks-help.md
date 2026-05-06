---
"recursica-forge": patch
---

- **Export Validation Hardening**: Removed silent catch blocks that previously suppressed validation errors during JSON serialization. All schema validation errors now cleanly propagate and display visually via the `ValidationErrorModal`.
- **Test Export Enhancements**: Updated the "Test" download option in the Export Modal to include both the static original test file and the current live `recursica_ui-kit.json`, isolating both files cleanly into a component-specific directory zip instead of blindly overwriting.
- **Theme-Agnostic Component Persistence**: The `cssVarToRef` mapping tool now successfully strips out specific theme prefixes (e.g., `themes.light.`) when parsing component CSS Variables so that exported UI Kit JSON tokens remain strictly theme-agnostic. 
- **Dimension Token Stability**: Token categorization inside the toolbars is now strict based on property definitions. `border-radius` tokens no longer accidentally leak into general dimension inputs like `padding` or `gap`.
