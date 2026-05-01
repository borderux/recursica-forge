---
"recursica-forge": patch
---

### Slider Drag Performance & UI Polish

**Slider drag smoothness**
- Debounced the `MutationObserver` on `document.documentElement` in the Slider adapter from instantaneous `requestAnimationFrame` to a 500ms debounce, preventing re-render storms during active drag.
- Refactored `PropControlContent` and `DimensionTokenSelector` pixel-based sliders to apply direct DOM style updates via `style.setProperty` during drag for real-time visual feedback, deferring heavy persistence (`updateCssVar` + event dispatch) to `onChangeCommitted`.

**Button vertical text alignment**
- Replaced the `line-height` vertical centering hack (which broke under `box-sizing: border-box` when border-size increased) with `display: inline-flex` + `align-items: center` in both `Button.tsx` and `Button.css`.

**Palette Swatch Picker — Core Colors**
- Added a "Core" row to the `PaletteSwatchPicker` overlay showing black, white, interactive, alert, success, and warning swatches, positioned between "None" and "Neutral".
- Core color selection uses the correct `on-tone` CSS variable for checkmark contrast.
- Fixed dual-checkmark bug where both a core swatch and a palette swatch (e.g. core-black and neutral-1000) would show as selected when they resolve to the same hex — `isSwatchSelected` now early-returns `false` for palette swatches when the tracked selection is a core color.

**Core color display label**
- Removed stale "Default" suffix from the interactive core color label — "Core / Interactive / Default" → "Core / Interactive" — since the `default` sublevel no longer exists under `core-colors.interactive`.
- Stripped `-tone` / `-on-tone` suffixes from fallback core color labels so they display as "Core / Black" instead of "Core / Black Tone".

**Color Token Picker — close on navigation**
- Added `useLocation` listener to `ColorTokenPicker` so the overlay closes automatically on route changes instead of persisting across page navigations.

**Switch component**
- Updated `thumb-selected` token references across all layers from interactive tone to `core-colors.white.tone` for correct visual contrast against the selected track color.
