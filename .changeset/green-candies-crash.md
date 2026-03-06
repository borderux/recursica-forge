---
"recursica-forge": patch
---

Fix color picker drag and hue indicator in both modal and popover

- **ColorPickerModal**: Fixed broken click-and-drag on the saturation/value area and hue slider. The original handlers used `e.currentTarget` which is `null` for native `mousemove` events attached to `window`. Refactored to use `useRef` for element references and `useCallback` with a state ref (`hsvRef`) to eliminate stale closures during drag. Added `trapFocus={false}` to prevent Mantine modal focus trapping from interfering with pointer events. Added `preventDefault`/`stopPropagation` on `mouseDown` to avoid conflicts with the modal's own drag handler.
- **ColorPickerOverlay**: Applied the same stale-closure and event-handling optimizations for smoother drag performance. Replaced inline `handleSV`/`handleH` with stable `useCallback`-wrapped `updateSV`/`updateH` that read state via refs. Added `preventDefault` to prevent text selection and layout thrashing during drag.
- **Hue slider reticle**: Added a missing visual thumb indicator to the hue slider bar in both `ColorPickerModal` and `ColorPickerOverlay`, positioned at the current hue value.
