---
"recursica-forge": patch
---

**Fix slider thumb jump on Size Tokens page**

Removed `writeSizeCssVar` from the `Slider` `onChange` handler in `SizeTokens.tsx` (non-auto-scale path). Writing the CSS variable during drag dispatched a `cssVarsUpdated` event, which triggered the global `setValues(readAllFromCss())` handler mid-drag and raced with the slider's own state update, causing the thumb to jump to the wrong position milliseconds after clicking the track.

CSS is now written once in `onChangeCommitted`, matching the correct pattern already used by `OpacityTokens`. Local React state is updated during drag for smooth feedback.
