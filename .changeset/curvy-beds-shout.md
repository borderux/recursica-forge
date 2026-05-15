---
"recursica-forge": patch
---

## Reset flow overhaul

### Reset button — no more unconditional confirmation modal
`ResetButton` and the component toolbar's bespoke reset button now only show a modal when the user has previously imported files (i.e. there is an actual version choice to make). With no import present, clicking Reset immediately restores to Forge defaults with zero friction.

### Reset modal improvements
- Modal title now includes the component name (e.g. "Reset Accordion").
- Added confirmation copy: "Are you sure you want to reset your changes?"
- Radio group label changed from "Reset destination" → **"Version"**.
- Second option renamed from "Reset to app defaults" → **"Reset to Forge defaults"**.

### Reset to last imported version — now works correctly
`handleReset` previously always restored from the bundled Forge defaults regardless of which option the user selected. A new `getImportedUikit()` method on `VarsStore` reads the last user-imported UIKit JSON from `localStorage`, allowing the reset to correctly restore to either the imported state or Forge defaults based on the user's choice.

### Reset no longer triggers the shared-property modal
Resetting a component restores many CSS variables simultaneously. Each call to `updateCssVar` was routing through the global-ref interceptor, causing the "Shared Property" modal to appear for every property that references a `{ui-kit.globals.*}` token — even when no changes were made. A new `noGlobalRefCheck` flag on `updateCssVar` (captured in the debounce closure at call time) suppresses the interceptor cleanly during reset without timers or timestamp windows.

## Shared Property modal — immediate trigger for discrete interactions

The global-ref interceptor previously debounced all conflict events by 500 ms before opening the modal. This felt sluggish on discrete interactions (palette picks, dropdown selects, segmented control changes).

- Debounce reduced to 150 ms for slider interactions (still needed to avoid modal spam during drag).
- New `immediate` flag on `checkForGlobalRef` and `updateCssVar`: when set, the conflict event is dispatched synchronously, skipping both the outer `UPDATE_DEBOUNCE_MS` timer and the inner debounce. Discrete call sites (palette swatch clicks, dropdown selects, colour token selects, segmented controls) all pass `immediate: true`.

## Elevation panel — PaletteColorControl standardisation

Replaced the bespoke `ShadowColorTokenControl` in `ElevationStylePanel` with the shared `PaletteColorControl`, matching the pattern used elsewhere in the app. The shadow color label now correctly displays the palette name (e.g. "Scale 03 / 600") by passing the unthemed generic palette CSS variable as `currentValueCssVar` for label resolution via `parseBrandCssVar`.

## Type style panel — border persists on selection

Fixed a regression where selecting a type style was removing the container border. The border now correctly switches to the alert tone on selection rather than disappearing.

## Elevation panel — reset fully clears state

Fixed the Elevations panel reset not fully clearing shadow color customisations. State is now completely cleared across both the DOM and the elevation store on reset.
