---
"recursica-forge": patch
---

Button: border-radius and min-width are now content-variant-specific (content × size)

Previously `border-radius` and `min-width` lived under `variants.sizes.{size}.properties` in `recursica_ui-kit.json`, meaning all content variants (label, icon-label, icon-only) shared the same values. These tokens have been moved to `variants.content.{content-variant}.sizes.{size}.properties`, enabling independent control per content variant and size combination.

**Token structure (`recursica_ui-kit.json`)**
- Removed `border-radius` from `variants.sizes.{size}.properties`
- Added `border-radius` and `min-width` to each `variants.content.{cv}.sizes.{size}.properties` node for all three content variants (label, icon-label, icon-only) × both sizes (default, small)

**Button adapter (`Button.tsx` / `Button.css`)**
- `borderRadiusVar` and `minWidthVar` now resolve from the content × size cross-variant CSS var path, matching the selected `contentVariant` and `sizePrefix` at render time

**ButtonPreview (`ButtonPreview.tsx`)**
- Per-content-type `--button-border-radius` override added to each preview button's inline style so the preview reflects the correct content-variant token

**Toolbar (`ComponentToolbar.tsx`)**
- Added virtual prop handlers for `border-radius` and `min-width` that construct the correct CSS var from `selectedVariants.content × selectedVariants.size`
- Added `isButtonBorderRadiusCacheMiss` guard to force grouped-prop cache invalidation when the content variant changes (bypasses the parser tagging these tokens as `variantProp='size'`)

**PropControlContent (`PropControlContent.tsx`)**
- Grouped prop rendering for Button `border-radius` bypasses `getCssVarsForProp` and computes the authoritative CSS var directly from `selectedVariants`
- Added `max-label-width` to the pixel-slider handler; adjusted `min-width` slider bounds to 20–150 px

**BorderGroupToolbar (`BorderGroupToolbar.tsx`)**
- `borderRadiusCssVars` for Button is now derived from `selectedVariants.content × selectedVariants.size` directly, fixing the corner-radius slider in the Border group not updating when the content variant changes
