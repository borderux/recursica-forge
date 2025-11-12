# CSS Variable Management Refactoring Plan

## Current Problems

1. **Dual Source of Truth**: Tokens are stored in `this.state.tokens`, but "overrides" are stored separately in localStorage (`token-overrides`). This creates complexity where token values can come from two places.

2. **Delta Tracking Complexity**: The system tracks previous CSS variable states (`lastTokenColors`, `lastTokenSizes`, etc.) to do incremental updates. This adds complexity and potential for bugs.

3. **Event-Driven Updates**: Multiple event listeners (`tokenOverridesChanged`, `typeChoicesChanged`, `paletteVarsChanged`, etc.) trigger recomputation, making the flow hard to follow.

4. **Reset Doesn't Clear CSS Vars**: `resetAll()` resets state but doesn't clear CSS variables from the DOM, potentially leaving stale values.

5. **Indirect Token Updates**: Token changes go through `setOverride()` → localStorage → event → recompute, instead of directly updating tokens.

## Proposed Solution

### Core Principles

1. **Single Source of Truth**: Tokens are stored ONLY in `this.state.tokens`. No separate override system.

2. **Direct Token Updates**: When a token value changes, directly update `this.state.tokens` and trigger CSS var rebuild.

3. **Full Rebuild on Changes**: Remove delta tracking. Always rebuild all CSS vars from current state.

4. **Clean Reset**: Reset should clear ALL CSS vars from DOM, then rebuild from JSON.

5. **Simplified Flow**: Token change → Update state → Rebuild CSS vars → Apply to DOM.

## Refactoring Steps

### Step 1: Remove Override System

**Files to modify:**
- `src/modules/theme/tokenOverrides.ts` - Deprecate/remove
- `src/core/store/varsStore.ts` - Remove override reading/merging
- All files using `setOverride`/`readOverrides`

**Changes:**
- Remove `readOverrides()` calls from `recomputeAndApplyAll()`
- Remove override merging logic
- Update token update functions to directly modify `this.state.tokens`

### Step 2: Simplify CSS Variable Application

**Files to modify:**
- `src/core/css/apply.ts` - Simplify to full apply, no delta
- `src/core/store/varsStore.ts` - Remove delta tracking

**Changes:**
- Remove `applyCssVarsDelta()` - replace with simple `applyCssVars()`
- Remove all `last*` tracking variables
- Always rebuild complete CSS var map from current state

### Step 3: Add CSS Variable Clearing Function

**Files to create/modify:**
- `src/core/css/apply.ts` - Add `clearAllCssVars()`

**Function:**
```typescript
export function clearAllCssVars() {
  const root = document.documentElement
  const style = root.style
  // Get all CSS custom properties
  const computed = getComputedStyle(root)
  const varsToRemove: string[] = []
  
  // Collect all --recursica-* vars
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    if (prop && prop.startsWith('--recursica-')) {
      varsToRemove.push(prop)
    }
  }
  
  // Remove them
  varsToRemove.forEach(prop => root.style.removeProperty(prop))
}
```

### Step 4: Update Token Update Flow

**Files to modify:**
- `src/modules/tokens/TokensPage.tsx` - Update `handleChange` to use `setTokens`
- `src/core/store/varsStore.ts` - Add `updateToken(name, value)` helper

**New helper in varsStore:**
```typescript
updateToken(tokenName: string, value: string | number) {
  const parts = tokenName.split('/')
  if (parts.length < 2) return
  
  const nextTokens = JSON.parse(JSON.stringify(this.state.tokens)) // deep clone
  // Navigate to token location and update
  // Then call setTokens(nextTokens)
}
```

### Step 5: Update Reset Function

**Files to modify:**
- `src/core/store/varsStore.ts` - Update `resetAll()`

**Changes:**
- Call `clearAllCssVars()` before resetting state
- Reset state from JSON imports
- Rebuild CSS vars from clean state

### Step 6: Simplify Event System

**Files to modify:**
- `src/core/store/varsStore.ts` - Remove event listeners
- Components - Update to call store methods directly

**Changes:**
- Remove `tokenOverridesChanged` event listener
- Components call `store.updateToken()` directly
- Store automatically triggers CSS var rebuild via `writeState()`

### Step 7: Update All Token Update Sites

**Files to update:**
- `src/modules/tokens/TokensPage.tsx`
- `src/modules/tokens/SizeTokens.tsx`
- `src/modules/tokens/OpacityTokens.tsx`
- `src/modules/tokens/EffectTokens.tsx`
- `src/modules/tokens/FontSizeTokens.tsx`
- `src/modules/tokens/FontWeightTokens.tsx`
- `src/modules/tokens/FontLetterSpacingTokens.tsx`
- `src/modules/tokens/FontLineHeightTokens.tsx`
- `src/modules/tokens/FontFamiliesTokens.tsx`
- `src/modules/palettes/PaletteGrid.tsx`
- `src/modules/layers/LayerModule.tsx`
- Any other files using `setOverride`

**Changes:**
- Replace `setOverride(name, value)` with `store.updateToken(name, value)`
- Remove `readOverrides()` calls
- Update to read from `this.state.tokens` directly

## Implementation Order

1. **Phase 1: Add new infrastructure** (Steps 3, 4)
   - Add `clearAllCssVars()`
   - Add `updateToken()` helper
   - Keep old system working

2. **Phase 2: Simplify CSS var application** (Step 2)
   - Replace delta with full rebuild
   - Test that it works

3. **Phase 3: Update reset** (Step 5)
   - Add CSS var clearing to reset
   - Test reset functionality

4. **Phase 4: Migrate token updates** (Steps 1, 6, 7)
   - Update all components to use new system
   - Remove override system
   - Remove event listeners

5. **Phase 5: Cleanup**
   - Remove `tokenOverrides.ts` file
   - Remove unused code
   - Update documentation

## Benefits

1. **Simpler Mental Model**: One source of truth (tokens), direct updates
2. **Easier Debugging**: No delta tracking, full rebuild makes state clear
3. **More Reliable**: No risk of stale overrides or delta mismatches
4. **Cleaner Reset**: Properly clears DOM before rebuilding
5. **Less Code**: Remove override system, delta tracking, event listeners

## Migration Notes

- Keep `token-overrides` localStorage key reading during migration for backward compatibility
- Gradually migrate components to new system
- Can run both systems in parallel during transition

