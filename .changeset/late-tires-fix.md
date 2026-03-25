---
"recursica-forge": patch
---

AssistiveElement size group and toolbar refinements

- Added `max-width` dimension token to `assistive-element` properties in `recursica_ui-kit.json` (default `200px`, no token reference)
- Moved `top-margin` into the **Size** toolbar group; removed the standalone "Top margin" prop section from `AssistiveElement.toolbar.json`
- Updated all three adapters (Mantine, Material, Carbon) to read `max-width` via `getComponentLevelCssVar` and apply it as `maxWidth` on the container element
- Added `isAssistiveElement` identity variable to `PropControlContent` with a `max-width` pixel range of 100–500px
- Extended `IconGroupToolbar` to render an explicit continuous px `Slider` (100–500px) for `max-width`, bypassing `BrandDimensionSliderInline` so no token options are shown
- Extended `IconGroupToolbar` with a generic extra-prop rendering loop (matching the pattern in `PaddingGroupToolbar`) so future non-standard dimension props in icon groups render automatically
