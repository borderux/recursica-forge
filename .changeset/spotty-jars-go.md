---
"recursica-forge": patch
---

Fix elevation opacity tokens polluting core property opacity dropdowns.

When adjusting shadow opacity on the Elevations page, per-elevation unique tokens (e.g. `elevation-light-1`) were written into the shared `tokens.opacities` namespace. Because all opacity pickers and dropdowns read every entry from that namespace, these internal elevation tokens appeared as options in unrelated UI — specifically the High/Low emphasis, Disabled, and Overlay opacity dropdowns on the Core Properties page.

Added a `!k.startsWith('elevation-')` guard to the token key filter in all opacity picker components so elevation-scoped tokens are excluded from UI option lists while continuing to function correctly for their CSS variable bindings.

Files changed:
- `src/modules/pickers/OpacityPicker.tsx`
- `src/modules/pickers/OpacityPickerOverlay.tsx`
- `src/modules/pickers/PaletteSwatchPicker.tsx`
- `src/modules/core/ElementsModalDemo.tsx`
- `src/modules/core/OverlayTokenPicker.tsx`
- `src/modules/toolbar/utils/OpacitySlider.tsx`
- `src/modules/tokens/opacity/OpacityTokens.tsx`
