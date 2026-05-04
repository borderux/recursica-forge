---
"recursica-forge": patch
---

Fix elevation UI state initialization and persistence bugs.

- **Regex Normalization**: Fixed regex patterns globally (`LayerStylePanel`, `ElevationControl`, `ElevationToolbar`, `PropControlContent`, `brandCssVars`) to use `/elevations?[._](elevation-\d+)/i`. This handles both dot-notation in JSON and underscore-notation in resolved CSS variables.
- **Elevation State Initialization**: Updated `LayerStylePanel` to compute the initial elevation value by reading directly from the `spec` JSON instead of relying on the browser's `getComputedStyle`, which destroyed the token reference by resolving into a literal box-shadow. 
- **Elevation Persistence**: Updated `updateElevation` in `VarsStore` to correctly sync non-color UI control data (`blur`, `spread`, `opacity`, `offsetX`, `offsetY`, `x-direction`, `y-direction`) back into the `theme.brand` state so that these properties properly persist across browser sessions.
