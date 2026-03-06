---
"recursica-forge": patch
---

Refactor overlay and hover tokens for components

- Add component-level `hover-color` and `hover-opacity` tokens to Button, AccordionItem, MenuItem, and Tabs in UIKit.json
- Replace global overlay variable usage with component-level hover tokens across all adapters (mantine, material, carbon)
- Rename CSS variables from `--*-overlay-color` to `--*-hover-color` in all component CSS files
- Fix Modal overlay to use brand-level overlay CSS variables instead of component-level tokens
- Add CSS rules in Modal.css to override Mantine's inline opacity on the overlay backdrop
- Add "Hover" toolbar group with Color and Opacity controls to Button, AccordionItem, MenuItem, and Tabs toolbar configs
- Clean up unused `getBrandStateCssVar` and `useThemeMode` imports
