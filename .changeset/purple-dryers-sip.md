---
"recursica-forge": minor
---

Fixed component reset functionality and updated design system compliance:
- Refactored `handleReset` in `ComponentToolbar` to cleanly overwrite the component JSON node, fixing an issue where CSS variable aliases were incorrectly converted to hardcoded strings or `transparent` fallback colors on reset.
- Fixed typo in `updateCssVar.ts` that prevented single-property removals from properly syncing to the JSON store (`-ui-kit-` to `_ui-kit_`).
- Updated `removeUIKitValue` to correctly fall back to the original imported/pristine properties instead of forcibly setting property `$value` to `null`.
- Updated default values in `recursica_ui-kit.json` for Link visited/hover colors and Stepper text colors to ensure first-load AA accessibility compliance.
