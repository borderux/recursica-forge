# Token Overrides Audit

## Current State

Token overrides are stored in localStorage (`token-overrides`) and used in several places, but **they do NOT currently update CSS variables**. This is a known limitation.

## Override Usage

### Legitimate Uses (Base Token Values)
1. **Opacity Tokens** (`opacity/*`) - Modified via `OpacityTokens.tsx` and `OpacityPickerOverlay.tsx`
2. **Size Tokens** (`size/*`) - Modified via `SizeTokens.tsx`
3. **Font Family Tokens** (`font-family/*`) - Modified via `FontFamiliesTokens.tsx`

These are foundational tokens that CSS variables reference. However, changes to these overrides do NOT currently trigger CSS variable updates.

### Read-Only Uses (Display Only)
1. **ColorTokenPicker.tsx** - Reads overrides to display current token values
2. **PaletteColorSelector.tsx** - Reads overrides to display current values
3. **PaletteGrid.tsx** - Reads overrides to display current values
4. **LayerModule.tsx** - Reads overrides to display current values
5. **TypeSample.tsx** - Reads overrides to display current values

These components read overrides for display purposes but don't modify them.

### Reset Functionality
- Shell components (`MaterialShell.tsx`, `MantineShell.tsx`, `CarbonShell.tsx`) use `clearOverrides()` to reset to defaults

## Problem

**Token overrides are NOT applied to CSS variables**. The `recomputeAndApplyAll()` method in `varsStore.ts` reads directly from `this.state.tokens` and ignores overrides. The comment says "Note: Tokens are now the single source of truth - no overrides needed".

When users change opacity/size/font tokens via `setOverride()`:
1. Override is stored in localStorage
2. `tokenOverridesChanged` event is dispatched
3. **BUT**: No listener in `varsStore.ts` handles this event
4. **RESULT**: CSS variables are NOT updated

## Recommendation

According to the plan: **"minimize overrides so users change CSS vars directly"**

### Short-term (Current State)
- Token overrides exist but don't affect CSS vars
- Users should change CSS vars directly instead of using overrides
- Overrides are kept for display/legacy support only

### Long-term (Future Refactoring)
- Remove token override system entirely
- Users change CSS vars directly (`--tokens-opacity-*`, `--tokens-size-*`, etc.)
- Base token values come from JSON only
- CSS vars are the single source of truth for runtime values

## Files Using Overrides

### Writing Overrides
- `src/modules/tokens/opacity/OpacityTokens.tsx` - `setOverride()`
- `src/modules/tokens/size/SizeTokens.tsx` - `setOverride()`
- `src/modules/tokens/font/FontFamiliesTokens.tsx` - `setOverride()`, `writeOverrides()`
- `src/modules/pickers/OpacityPickerOverlay.tsx` - `setOverride()`

### Reading Overrides
- `src/modules/pickers/ColorTokenPicker.tsx` - `readOverrides()`
- `src/modules/palettes/PaletteColorSelector.tsx` - `readOverrides()`
- `src/modules/palettes/PaletteGrid.tsx` - `readOverrides()`
- `src/modules/layers/LayerModule.tsx` - `readOverrides()`
- `src/modules/type/TypeSample.tsx` - `readOverrides()`

### Clearing Overrides
- `src/modules/app/shells/MaterialShell.tsx` - `clearOverrides()`
- `src/modules/app/shells/MantineShell.tsx` - `clearOverrides()`
- `src/modules/app/shells/CarbonShell.tsx` - `clearOverrides()`

## Conclusion

Token overrides are currently **display-only** and do not affect CSS variables. Users should change CSS variables directly for real-time updates. The override system can be considered deprecated/legacy and should be removed in a future refactoring.



