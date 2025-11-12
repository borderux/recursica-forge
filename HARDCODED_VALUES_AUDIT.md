# Hardcoded Values Audit Report

## Audit Date
Completed comprehensive audit of the codebase to ensure no hardcoded values are set for brand CSS variables.

## Summary
✅ **All brand CSS variables (`--recursica-brand-*`) now use token references only**
✅ **No hardcoded hex/RGB values found in brand CSS variables**
✅ **Validation layer in place to catch violations**

## Areas Checked

### 1. Core Palette Bindings ✅
**File**: `src/core/store/varsStore.ts:584-608`
- **Status**: FIXED
- **Previous Issue**: Fell back to `info.hex` (hardcoded hex)
- **Current State**: Always uses token references, with fallback to default tokens
- **Verification**: No hardcoded values can be set

### 2. Palette Resolver ✅
**File**: `src/core/resolvers/palettes.ts:156-177`
- **Status**: FIXED
- **Previous Issue**: Could fall back to raw hex string
- **Current State**: Converts hex to token references or uses default token references
- **Verification**: All palette tone vars use token references

### 3. Typography Resolver ✅
**File**: `src/core/resolvers/typography.ts:200-291`
- **Status**: FIXED
- **Previous Issue**: Fell back to `toCssValue()` which returned raw values
- **Current State**: Always uses token references with sensible defaults
- **Verification**: All typography brand vars use token references

### 4. Layers Resolver ✅
**File**: `src/core/resolvers/layers.ts`
- **Status**: ALREADY CORRECT
- **Current State**: Converts hex values to token references where possible
- **Verification**: Uses `mapBWHexToVar()` and `findTokenColorByHex()` to ensure token references

### 5. Elevation Shadow Colors ✅
**File**: `src/core/store/varsStore.ts:724-776`
- **Status**: CORRECT
- **Current State**: Uses `colorMixWithOpacityVar()` which returns CSS `color-mix()` function with token references
- **Example**: `color-mix(in srgb, var(--recursica-tokens-color-gray-500) calc(var(--recursica-tokens-opacity-veiled) * 100%), transparent)`
- **Verification**: Not a hardcoded value - uses CSS function with token references

### 6. PaletteGrid Direct DOM Manipulation ⚠️
**File**: `src/modules/palettes/PaletteGrid.tsx:265, 276, 283, 297-303`
- **Status**: VALUES ARE CORRECT (but bypasses centralized system)
- **Current State**: Sets token references correctly:
  - `var(--recursica-tokens-${tokenName.replace(/\//g, '-')})`
  - `var(--recursica-brand-${modeLabel.toLowerCase()}-palettes-core-${aaCore})`
- **Note**: These bypass the centralized system but set correct values. Could be refactored to go through centralized system, but not causing hardcoded values.

### 7. Validation Layer ✅
**File**: `src/core/css/apply.ts:32-62`
- **Status**: IMPLEMENTED
- **Current State**: Validates all brand CSS variables before applying
- **Features**:
  - Detects hardcoded values
  - Attempts to auto-fix by finding matching tokens
  - Logs warnings/errors for violations
  - Prevents hardcoded values from being set

## Hex Values Found (All Legitimate Uses)

### In varsStore.ts defaults object
- **Purpose**: Used only for fallback token lookup, never set directly
- **Lines**: 556-561
- **Status**: ✅ Safe - hex values are only used to find matching tokens

### In palettes.ts comparison logic
- **Purpose**: Used for comparison logic (`#ffffff` vs `#000000`) to determine white/black
- **Lines**: 194-195, 200
- **Status**: ✅ Safe - used for logic, not setting values

### In layers.ts comparison logic
- **Purpose**: Used for comparison logic to determine white/black
- **Lines**: 13, 330, 428, 456, 555, 633, 735
- **Status**: ✅ Safe - used for logic, not setting values

### In elevation hexToRgba function
- **Purpose**: Defined but not used (replaced by colorMixWithOpacityVar)
- **Lines**: 711-723
- **Status**: ✅ Safe - function exists but is not called

## Direct DOM Manipulation Found

### PaletteGrid.tsx
- **Lines**: 265, 276, 283, 297-303
- **Values Set**: All use token/brand var references ✅
- **Issue**: Bypasses centralized system but values are correct
- **Recommendation**: Could be refactored to go through centralized system, but not critical

## Conclusion

✅ **No hardcoded values are being set for brand CSS variables**
✅ **All brand CSS variables use token references**
✅ **Validation layer prevents future violations**
✅ **All fallbacks use token references, never hardcoded values**

The enforcement system is working correctly. All brand CSS variables are set to token references, and the validation layer will catch any future violations.

