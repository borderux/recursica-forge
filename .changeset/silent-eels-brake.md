---
"recursica-forge": patch
---

## Bug fixes

### Base colors grid — interactive color update propagation

When a new Interactive color was selected via the token picker, the "Interactive" row dots in the other core-color swatches (Black, White, Alert, Warning, Success) did not update immediately. The swatches would only reflect the new color after navigating to Dark mode and back.

**Root cause:** The code block responsible for immediately writing `--recursica_brand_themes_{mode}_palettes_core_{colorName}_interactive` CSS variables was guarded by:

```ts
const coreColorsPath = themesForCssVar[modeLower]?.palettes?.['core-colors']?.$value
```

In normal (non-import) usage, `core-colors` in the live theme JSON is a plain object with no `$value` wrapper, so `?.$value` returned `undefined`. The guard was always falsy, the CSS variable update loop never ran, and the Interactive-row dots in every non-interactive column remained at their previous value until a full recompute was forced by a mode switch.

**Fix (`ColorTokenPicker.tsx`):** Mirror the same fallback pattern already used in `palettes.ts`:

```ts
const coreColorsRaw = themesForCssVar[modeLower]?.palettes?.['core-colors']
const coreColorsPath = coreColorsRaw?.$value || coreColorsRaw
```

### Base colors grid — "Reset All" did not reset interactive color

After changing the Interactive column color, clicking **Reset All** restored the tone and on-tone for the five base colors (Black, White, Alert, Warning, Success) but left the Interactive-row dots in each of those columns showing the modified color instead of reverting to the factory value.

**Root cause:** The `handleResetAll` loop reset `tone` and `on-tone` for each core color from `recursica_brand.json` but never touched the `interactive` property. When the interactive color is changed, `updateCoreColorInteractiveOnTones` writes a per-color `interactive.$value` into the theme for each base color (e.g. `black.interactive.$value = "{tokens.colors.scale-05.900}"`). Because `handleResetAll` skipped this field, the value survived the reset and the subsequent `buildPaletteVars` recompute regenerated the same modified CSS variable.

**Fix (`BaseColorsGrid.tsx`):** Added a reset block for `interactive` inside the existing per-color loop, parallel to the existing `tone` / `on-tone` resets:

```ts
if (defaultColor.interactive?.$value) {
  currentCoreColors[colorName].interactive = {
    $type: 'color',
    $value: defaultColor.interactive.$value
  }
} else {
  delete currentCoreColors[colorName].interactive
}
```

The default `recursica_brand.json` already contains the factory `interactive.$value` for each core color (e.g. `black → scale-05.300`, `white → scale-05.500`), so the recompute correctly restores the Interactive-row dots to their original values.
