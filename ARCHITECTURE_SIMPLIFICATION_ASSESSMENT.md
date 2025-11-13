# Architecture Simplification Assessment & Plan

## Executive Summary

The app currently has multiple layers of indirection, state synchronization issues, and dependencies on localStorage, bindings, resolvers, and timing workarounds. The core goal should be: **JSON → CSS vars on init, direct CSS var updates, AA compliance checks**. This document outlines current issues and a plan to simplify.

---

## Current Architecture Problems

### 1. **Multiple Sources of Truth** 🔴 CRITICAL

**Problem**: Data flows through multiple layers:
- JSON files (Tokens.json, Brand.json, UIKit.json)
- localStorage (persistence layer)
- `palettes.bindings` (indirection layer)
- Resolver functions (transformation layer)
- CSS variables (final output)
- Direct DOM manipulation (bypasses system)

**Impact**: 
- Changes can be lost or overwritten
- Hard to track where a value comes from
- Synchronization bugs (like the core color issue we just fixed)
- Difficult to debug

**Evidence**:
- `varsStore.ts:675`: Merges defaults with `palettes.bindings`
- `varsStore.ts:740-800`: Preserves existing CSS vars from DOM (workaround for sync issues)
- `ColorTokenPicker.tsx`: Had to update both theme JSON AND bindings
- Multiple localStorage keys scattered throughout codebase

---

### 2. **Bindings System Complexity** 🔴 CRITICAL

**Problem**: The `palettes.bindings` system adds an unnecessary indirection layer.

**Current Flow**:
```
JSON → localStorage → palettes.bindings → resolver → CSS vars
```

**What it should be**:
```
JSON → CSS vars (with direct updates)
```

**Evidence**:
- `varsStore.ts:640-735`: Complex logic to merge defaults with bindings
- `ColorTokenPicker.tsx:120-135`: Must update bindings separately from theme
- `varsStore.ts:675`: `const merged = { ...defaults, ...(this.state.palettes?.bindings || {}) }`

**Why it exists**: Likely a legacy from when localStorage was the primary storage. Now that we use JSON as source of truth, bindings are redundant.

---

### 3. **Resolver Functions Over-Complexity** 🟡 HIGH

**Problem**: Resolvers do too much:
- Parse JSON structure
- Resolve brace references (`{tokens.color.gray.500}`)
- Build token indices
- Compute AA compliance
- Handle fallbacks
- Transform data structures

**Current Resolvers**:
- `palettes.ts`: 213 lines, builds theme index, resolves references, computes AA
- `layers.ts`: 822 lines, complex parsing, fallback logic
- `typography.ts`: Complex choice resolution
- `tokens.ts`: Token indexing

**What they should do**:
- Simple: Read JSON → Output CSS var map
- AA compliance should be separate, reactive checks

**Evidence**:
- `palettes.ts:27-212`: Complex resolution logic
- `layers.ts:5-822`: Massive file with many responsibilities
- Multiple `try/catch` blocks suggest brittleness

---

### 4. **LocalStorage Overuse** 🟡 HIGH

**Problem**: localStorage used for:
- ✅ Persistence of user changes (legitimate)
- ❌ UI state (should be React state)
- ❌ Derived data (should be computed)
- ❌ Temporary preferences (should be in-memory)

**Current localStorage Usage** (94 instances):
- `family-friendly-names`: Should be computed from color tokens
- `palette-primary-level:${key}`: UI state, should be React state
- `palette-grid-family:${key}`: Should come from theme JSON
- `deleted-color-families`: Should be in app state
- `color-family-order`: Should be computed or in state
- `type-token-choices`: Legitimate user preference
- `token-overrides`: Legitimate user changes
- `elevation-*`: Should be in theme JSON
- `size-scale-by-default`: UI preference, could be state

**Impact**:
- Hard to reset/clear
- Not reactive (requires manual event dispatching)
- Can get out of sync with JSON
- Makes testing harder

---

### 5. **Timing Workarounds** 🟡 MEDIUM

**Problem**: Use of `setTimeout` and `requestAnimationFrame` to work around timing issues.

**Evidence**:
- `ColorTokenPicker.tsx:174-175`: `requestAnimationFrame(() => { setTimeout(() => { ... }, 10) })`
- `PaletteSwatchPicker.tsx:218-231`: Multiple RAF/timeout chains
- `TypeStylePanel.tsx:154-172`: RAF to ensure CSS is applied

**Why they exist**: CSS vars set directly to DOM, but resolvers read from JSON, causing race conditions.

**What should happen**: Single source of truth, no timing issues.

---

### 6. **Direct DOM Manipulation** 🟡 MEDIUM

**Problem**: Components bypass centralized system and set CSS vars directly.

**Evidence**:
- `PaletteGrid.tsx:240-303`: Direct `root.style.setProperty()` calls
- `ColorTokenPicker.tsx:108`: Sets CSS var before updating state
- `varsStore.ts:750-800`: Reads from DOM to preserve values (acknowledges the problem)

**Impact**:
- Bypasses validation
- Can set hardcoded values
- Hard to track changes
- Causes sync issues

---

### 7. **AA Compliance Checks Scattered** 🟡 MEDIUM

**Problem**: AA compliance logic is:
- In resolvers (`palettes.ts`, `layers.ts`)
- In separate files (`updateLayerAaCompliance.ts`, `updateAlternativeLayerAaCompliance.ts`)
- Called with timeouts/RAF
- Updates CSS vars directly

**Evidence**:
- `updateLayerAaCompliance.ts`: Separate file, called with delays
- `updateAlternativeLayerAaCompliance.ts`: Another separate file
- `ColorTokenPicker.tsx:165-177`: Calls AA compliance with RAF/timeout
- `palettes.ts:199`: AA check embedded in resolver

**What should happen**: 
- Reactive system that watches CSS vars
- Automatically updates when colors change
- No manual triggering needed

---

## Proposed Simplified Architecture

### Core Principle
**Single Source of Truth**: JSON files are the source. CSS vars are the output. Everything else is derived.

### Data Flow
```
┌─────────────┐
│ JSON Files │ (Tokens.json, Brand.json, UIKit.json)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Initialization  │ Convert JSON → CSS vars once on mount
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   CSS Variables  │ Single source of truth for runtime
└──────┬───────────┘
       │
       ├──► User edits directly
       │
       ├──► AA compliance watcher (reactive)
       │
       └──► Export/Download
```

### Key Changes

#### 1. **Eliminate Bindings System**
- Remove `palettes.bindings` entirely
- Core colors come directly from theme JSON
- User changes update theme JSON directly
- CSS vars computed from theme JSON only

#### 2. **Simplify Resolvers**
- Resolvers become simple JSON → CSS var mappers
- No complex resolution logic
- No fallback chains
- Just: read JSON path → output CSS var

#### 3. **Reactive AA Compliance**
- Watch CSS vars for color changes
- Automatically recompute AA when colors change
- Update `on-tone` vars reactively
- No manual triggering, no timeouts

#### 4. **Minimize LocalStorage**
- Only persist: user token overrides, type choices
- Remove: UI state, derived data, temporary preferences
- Move UI state to React state
- Compute derived data on-the-fly

#### 5. **Centralized CSS Var Updates**
- All CSS var updates go through single function
- Validates values (ensures token references)
- Triggers reactive updates
- No direct DOM manipulation

#### 6. **Single Update Path**
- User action → Update JSON → Recompute CSS vars → Apply
- No parallel update paths
- No synchronization needed

---

## Implementation Plan

### Phase 1: Remove Bindings System (HIGH PRIORITY)

**Goal**: Eliminate `palettes.bindings` indirection layer

**Steps**:
1. Update `varsStore.ts` to read core colors directly from theme JSON
2. Remove bindings merge logic (`varsStore.ts:675`)
3. Update `ColorTokenPicker.tsx` to only update theme JSON
4. Remove bindings from `PaletteStore` type
5. Remove localStorage persistence of bindings

**Files to modify**:
- `src/core/store/varsStore.ts`
- `src/modules/pickers/ColorTokenPicker.tsx`
- `src/modules/vars/VarsContext.tsx`
- `src/core/store/varsStore.ts` (migration function)

**Estimated effort**: 2-3 hours

---

### Phase 2: Simplify Resolvers (HIGH PRIORITY)

**Goal**: Make resolvers simple JSON → CSS var mappers

**Steps**:
1. Extract AA compliance logic to separate reactive system
2. Simplify `palettes.ts` to just map JSON paths to CSS vars
3. Simplify `layers.ts` to just map JSON paths to CSS vars
4. Remove complex fallback chains
5. Remove token-by-hex lookups (should be in JSON)

**Files to modify**:
- `src/core/resolvers/palettes.ts`
- `src/core/resolvers/layers.ts`
- `src/core/resolvers/typography.ts`

**Estimated effort**: 4-6 hours

---

### Phase 3: Reactive AA Compliance (MEDIUM PRIORITY)

**Goal**: Make AA compliance reactive, not manual

**Steps**:
1. Create `AAComplianceWatcher` class
2. Watch CSS vars for color changes (MutationObserver or polling)
3. Automatically update `on-tone` vars when colors change
4. Remove manual AA compliance calls
5. Remove timeouts/RAF workarounds

**Files to create**:
- `src/core/compliance/AAComplianceWatcher.ts`

**Files to modify**:
- `src/core/resolvers/updateLayerAaCompliance.ts` (simplify or remove)
- `src/core/resolvers/updateAlternativeLayerAaCompliance.ts` (simplify or remove)
- `src/modules/pickers/ColorTokenPicker.tsx` (remove manual calls)

**Estimated effort**: 3-4 hours

---

### Phase 4: Centralize CSS Var Updates (MEDIUM PRIORITY)

**Goal**: Single function for all CSS var updates

**Steps**:
1. Create `updateCssVar(cssVar: string, value: string)` function
2. Validates value (ensures token references for brand vars)
3. Updates CSS var
4. Triggers reactive systems (AA compliance, etc.)
5. Replace all direct DOM manipulation

**Files to create**:
- `src/core/css/updateCssVar.ts`

**Files to modify**:
- `src/modules/palettes/PaletteGrid.tsx`
- `src/modules/pickers/ColorTokenPicker.tsx`
- All other files with direct DOM manipulation

**Estimated effort**: 2-3 hours

---

### Phase 5: Minimize LocalStorage (LOW PRIORITY)

**Goal**: Only persist user changes, not UI state

**Steps**:
1. Move UI state to React state:
   - `palette-primary-level` → React state
   - `palette-grid-family` → Read from theme JSON
   - `size-scale-by-default` → React state
2. Compute derived data:
   - `family-friendly-names` → Compute from tokens
   - `color-family-order` → Compute or use default order
3. Keep only:
   - `token-overrides` (user changes)
   - `type-token-choices` (user preferences)
   - `elevation-*` → Move to theme JSON

**Files to modify**:
- `src/modules/palettes/PaletteGrid.tsx`
- `src/modules/tokens/colors/ColorTokens.tsx`
- `src/modules/palettes/PaletteColorSelector.tsx`
- `src/core/store/varsStore.ts`

**Estimated effort**: 3-4 hours

---

### Phase 6: Remove Timing Workarounds (LOW PRIORITY)

**Goal**: Eliminate all setTimeout/RAF workarounds

**Steps**:
1. After Phase 3 (reactive AA), remove manual AA calls
2. After Phase 4 (centralized updates), ensure synchronous updates
3. Remove all `requestAnimationFrame` chains
4. Remove all `setTimeout` delays

**Files to modify**:
- `src/modules/pickers/ColorTokenPicker.tsx`
- `src/modules/pickers/PaletteSwatchPicker.tsx`
- `src/modules/type/TypeStylePanel.tsx`

**Estimated effort**: 1-2 hours

---

## Benefits of Simplified Architecture

### 1. **Easier to Understand**
- Clear data flow: JSON → CSS vars
- No hidden indirection layers
- Predictable behavior

### 2. **Easier to Debug**
- Single source of truth
- No sync issues
- Clear update path

### 3. **More Reliable**
- No race conditions
- No timing workarounds
- No sync bugs

### 4. **Easier to Maintain**
- Less code
- Clearer responsibilities
- Fewer edge cases

### 5. **Better Performance**
- No unnecessary recomputations
- Reactive updates only when needed
- No localStorage reads on every render

---

## Migration Strategy

### Step 1: Feature Flag
Add a feature flag to toggle between old and new system:
```typescript
const USE_SIMPLIFIED_ARCHITECTURE = true
```

### Step 2: Parallel Implementation
Implement new system alongside old system, compare outputs.

### Step 3: Gradual Migration
Migrate one feature at a time:
1. Core colors (Phase 1)
2. Palettes (Phase 2)
3. Layers (Phase 2)
4. AA compliance (Phase 3)
5. Cleanup (Phases 4-6)

### Step 4: Remove Old Code
Once new system is verified, remove old code.

---

## Risk Assessment

### Low Risk
- Phase 1 (Remove bindings): Well-defined scope
- Phase 4 (Centralize updates): Additive change
- Phase 5 (Minimize localStorage): Mostly removing code

### Medium Risk
- Phase 2 (Simplify resolvers): Core logic, needs careful testing
- Phase 3 (Reactive AA): New pattern, needs validation

### High Risk
- Phase 6 (Remove timing workarounds): May reveal hidden dependencies

**Mitigation**: Implement with feature flags, test thoroughly, keep old code until verified.

---

## Success Metrics

1. **Code Reduction**: Target 20-30% reduction in resolver code
2. **LocalStorage Usage**: Reduce from 94 instances to <10
3. **Timing Workarounds**: Eliminate all setTimeout/RAF chains
4. **Direct DOM Manipulation**: Zero instances (all through centralized function)
5. **Bug Reports**: Fewer sync-related bugs
6. **Developer Experience**: Easier to add new features

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize phases** based on current pain points
3. **Start with Phase 1** (Remove bindings) - highest impact, lowest risk
4. **Create feature branch** for each phase
5. **Test thoroughly** before merging
6. **Document changes** as we go

---

## Questions to Consider

1. **Backward Compatibility**: Do we need to migrate existing localStorage data?
2. **Performance**: Will reactive AA compliance be performant enough?
3. **Testing**: How do we test the reactive systems?
4. **Rollout**: Should we do a gradual rollout or big bang?

---

## Conclusion

The current architecture has accumulated complexity over time. By simplifying to a clear JSON → CSS vars flow with reactive AA compliance, we can make the app more maintainable, reliable, and easier to understand. The proposed changes are incremental and can be done phase by phase with minimal risk.

