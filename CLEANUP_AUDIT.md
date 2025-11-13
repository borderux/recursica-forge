# Codebase Cleanup Audit

## Unused Files
1. **`src/modules/app/App.tsx`** - Only used in test file, not in main app
2. **`src/modules/samples/SamplesPage.tsx`** - Not imported anywhere in the codebase

## Timing Workarounds
1. **`src/modules/type/TypeStylePanel.tsx`** - Uses `requestAnimationFrame` to ensure CSS is applied before re-reading (lines 156, 173)

## Duplicate Code / Abstraction Opportunities

### Multiple `readCssVar` Implementations
Found 6+ different implementations of CSS variable reading:
1. `src/modules/type/TypeSample.tsx` - `readCssVar` function
2. `src/modules/layers/LayerModule.tsx` - `readCssVar` function  
3. `src/core/resolvers/layers.ts` - `readCssVar` function
4. `src/modules/palettes/PaletteColorSelector.tsx` - `readCssVarNumber` function
5. `src/modules/type/TypeStylePanel.tsx` - Inline logic (lines 93-95, 114-115)
6. `src/core/compliance/AAComplianceWatcher.ts` - Inline logic (multiple places)
7. `src/core/resolvers/colorSteppingForAa.ts` - Inline logic

### Direct DOM Manipulation
1. **`src/modules/type/TypeStylePanel.tsx`** - Uses `document.documentElement.style.removeProperty` directly (lines 165-169)
2. **`src/core/store/varsStore.ts`** - Reads from `document.documentElement.style.getPropertyValue` directly (multiple places)
3. **`src/core/compliance/AAComplianceWatcher.ts`** - Reads from both inline and computed styles

## Recommendations

1. **Create centralized CSS var utilities:**
   - `src/core/css/readCssVar.ts` - Unified CSS variable reading
   - Extend `src/core/css/updateCssVar.ts` - Add `removeCssVar` function

2. **Remove unused files:**
   - Delete `App.tsx` (or keep for tests)
   - Delete `SamplesPage.tsx` if not needed

3. **Remove timing workarounds:**
   - Replace `requestAnimationFrame` in `TypeStylePanel.tsx` with proper state management

4. **Refactor duplicate code:**
   - Replace all `readCssVar` implementations with centralized utility
   - Replace direct DOM manipulation with centralized utilities

