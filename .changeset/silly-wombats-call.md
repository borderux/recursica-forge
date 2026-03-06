---
"recursica-forge": patch
---

Fix button toolbar text color not updating based on selected variant

- Fixed variant name collision in toolbar prop resolution where the "text" variant name matched the "text" prop name in other variants' paths, causing the toolbar to always show the Solid variant's text color even when editing Text or Outline variants
- Extracted `pathMatchesVariant` helper to shared `componentToolbarUtils.ts` — checks variant names at their structural position in the path (after the category key like "styles") instead of using `path.includes()` which caused false positives
- Fixed `getCssVarsForProp` in `PropControlContent.tsx` to use `pathMatchesVariant` for accurate variant-specific CSS variable resolution
- Removed generic name-only fallback lookups in `ComponentToolbar.tsx` that bypassed category and variant filtering
- Unified border property naming to `border-size` across UIKit.json, toolbar configs, and component implementations
- Stored elevation per variant for the Button component
- Updated Brand.json with variant-specific color tokens for Button text colors (on-tone for Solid, tone for Text/Outline)
