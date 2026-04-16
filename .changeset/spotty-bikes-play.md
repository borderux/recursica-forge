---
"recursica-forge": patch
---

## Elevation mode-independent color control

Elevation shadow colors are now fully decoupled between light and dark modes.

### New: "Link light/dark mode changes" toggle

A `Switch` control in the Elevation style panel lets users mirror all property changes (color, blur, spread, X/Y offsets, opacity, and shadow direction) to both modes simultaneously. The preference is persisted to `localStorage` (`rf:elevation-color-mirror`) and cleared on Reset All.

### State architecture

- `paletteSelections` refactored from a flat `Record<string, sel>` to a mode-split `Record<'light'|'dark', Record<string, sel>>`, ensuring light and dark color assignments are fully independent.
- `initElevationState`, `importTheme`, `bulkImport`, `recomputeAndApplyAll`, and the brand JSON writeback in `updateElevation` all updated to read/write per-mode.

### Bug fixes

- **Reset color**: `revertSelected` previously read the elevation color ref from the live (writeback-mutated) brand JSON node, causing reset to restore the last user-picked color instead of the factory default. Fixed by reading from a new `pristineBrand` snapshot (deep-cloned at store init, matching the existing `pristineUikit` pattern) and by passing `{ currentMode: mode }` to `parseTokenReference` so the `brand.themes.light.` prefix is correctly stripped.
- **Randomize elevations**: `randomizeVariables.ts` was building a flat `paletteSelections` map with `dark` silently overwriting `light` entries before passing it to `updateElevation`. Fixed to use the mode-split structure.

### Files changed

- `src/core/elevation/elevationModeScope.ts` *(new)* — `getElevationColorMirror` / `setElevationColorMirror` / `clearElevationColorMirror` helpers backed by `rf:elevation-color-mirror`.
- `src/core/store/varsStore.ts` — `pristineBrand` field + `getPristineBrand()` getter; mode-split `paletteSelections` throughout; `clearElevationColorMirror()` in `resetAll`.
- `src/modules/elevation/ElevationsPage.tsx` — mirror toggle state; `updateElevationControlsBatch` and direction handlers mirror to the other mode when enabled; `revertSelected` uses pristine brand + correct parser context.
- `src/modules/elevation/ElevationStylePanel.tsx` — `Switch` + "Link light/dark mode changes" label; `usePaletteSelection` reads from mode-specific bucket; `colorMirrorEnabled` / `onToggleColorMirror` props.
- `src/core/utils/randomizeVariables.ts` — `newPaletteSelections` uses mode-split structure.
