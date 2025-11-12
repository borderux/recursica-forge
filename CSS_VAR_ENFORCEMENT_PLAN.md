# CSS Variable Value Enforcement Plan

## Problem Statement

The app has two types of CSS variables that should be handled differently:

1. **Token CSS Variables** (`--recursica-tokens-*`): Should contain **raw values** (e.g., `32px`, `#ffffff`, `400`)
2. **Brand CSS Variables** (`--recursica-brand-*`): Should **ALWAYS** reference other tokens/brand vars (e.g., `var(--recursica-tokens-color-gray-050)`), **NEVER** hardcoded values

Currently, the codebase has multiple places where brand CSS variables can be set to hardcoded hex/RGB values instead of token references.

## Current Issues Found

### 1. Core Palette Bindings Fallback (CRITICAL)
**Location**: `src/core/store/varsStore.ts:585`
```typescript
colors[cssVar] = ref || info.hex  // ❌ Falls back to hardcoded hex
```
**Problem**: When `tokenToTokensVar()` fails, it falls back to `info.hex` which is a hardcoded value.

### 2. Direct CSS Variable Manipulation (CRITICAL)
**Location**: `src/modules/palettes/PaletteGrid.tsx:265, 276, 283, 297, 301`
```typescript
root.style.setProperty(`--recursica-brand-...`, ...)  // ❌ Bypasses centralized system
```
**Problem**: Direct DOM manipulation bypasses the centralized CSS var system and could set hardcoded values.

### 3. Typography Fallbacks (MEDIUM)
**Location**: `src/core/resolvers/typography.ts:203, 212, 219, 226, 233`
```typescript
vars[`${brandPrefix}font-size`] = sizeToken 
  ? `var(--recursica-tokens-font-${sizeToken.category}-${sizeToken.suffix})`
  : (findTokenByValue(size, 'size') || toCssValue(size, 'px')!)  // ❌ Falls back to raw value
```
**Problem**: Falls back to `toCssValue()` which returns raw values instead of token references.

### 4. Layers Resolver Fallbacks (MEDIUM)
**Location**: `src/core/resolvers/layers.ts:654`
```typescript
finalRef = mapBWHexToVar(pickAAOnTone(bgHex))  // Uses hex fallback
```
**Problem**: Uses hex values as fallback instead of ensuring token references.

### 5. Palette Resolver Fallback (LOW)
**Location**: `src/core/resolvers/palettes.ts:157`
```typescript
vars[`${scope}-tone`] = String(tone)  // ❌ Could be raw hex string
```
**Problem**: Falls back to raw string which could be hex instead of token reference.

## Solution Plan

### Phase 1: Create Enforcement Utilities

#### 1.1 Create CSS Variable Type Validator
**File**: `src/core/css/varTypes.ts` (NEW)
```typescript
/**
 * Validates that a CSS variable name matches expected patterns
 */
export function isTokenVar(name: string): boolean {
  return name.startsWith('--recursica-tokens-')
}

export function isBrandVar(name: string): boolean {
  return name.startsWith('--recursica-brand-') || name.startsWith('--brand-')
}

/**
 * Ensures brand CSS variables always use token references, never hardcoded values
 */
export function enforceBrandVarValue(cssVarName: string, value: string): string {
  if (!isBrandVar(cssVarName)) return value
  
  // If already a var() reference, return as-is
  if (value.trim().startsWith('var(')) return value
  
  // If it's a hex/RGB value, throw error - this should never happen
  if (/^#?[0-9a-f]{6}$/i.test(value.trim()) || value.trim().startsWith('rgb')) {
    throw new Error(`Brand CSS variable ${cssVarName} cannot be set to hardcoded value: ${value}. Must reference a token.`)
  }
  
  // If it's a raw value (px, number, etc), try to find matching token
  // Otherwise, throw error
  throw new Error(`Brand CSS variable ${cssVarName} must reference a token, got: ${value}`)
}
```

#### 1.2 Create Token Reference Helper
**File**: `src/core/css/tokenRefs.ts` (NEW)
```typescript
/**
 * Converts a token name to a CSS variable reference
 */
export function tokenToCssVar(tokenName: string): string | null {
  // Format: "color/gray/100" -> "var(--recursica-tokens-color-gray-100)"
  // Format: "size/4x" -> "var(--recursica-tokens-size-4x)"
  // Format: "font/size/md" -> "var(--recursica-tokens-font-size-md)"
  
  const parts = tokenName.split('/').filter(Boolean)
  if (parts.length === 0) return null
  
  const [category, ...rest] = parts
  
  if (category === 'color' && rest.length >= 2) {
    const [family, level] = rest
    const normalizedLevel = normalizeColorLevel(level)
    if (family && normalizedLevel) {
      return `var(--recursica-tokens-color-${family}-${normalizedLevel})`
    }
  } else if (category === 'size' && rest.length >= 1) {
    return `var(--recursica-tokens-size-${rest[0]})`
  } else if (category === 'opacity' && rest.length >= 1) {
    return `var(--recursica-tokens-opacity-${rest[0]})`
  } else if (category === 'font' && rest.length >= 2) {
    const [kind, key] = rest
    return `var(--recursica-tokens-font-${kind}-${key})`
  }
  
  return null
}

function normalizeColorLevel(level: string): string | null {
  const s = String(level).padStart(3, '0')
  if (s === '000') return '050'
  if (s === '1000') return '900'
  const allowed = new Set(['900','800','700','600','500','400','300','200','100','050'])
  return allowed.has(s) ? s : null
}
```

### Phase 2: Fix Core Palette Bindings

#### 2.1 Remove Hex Fallback
**File**: `src/core/store/varsStore.ts`
**Change**: Line 585
```typescript
// BEFORE:
colors[cssVar] = ref || info.hex  // ❌

// AFTER:
const ref = tokenToTokensVar(info?.token)
if (!ref) {
  console.warn(`Failed to create token reference for ${cssVar} with token ${info?.token}. Using fallback.`)
  // Try to find token by hex value
  const tokenMatch = findTokenByHex(info?.hex)
  if (tokenMatch) {
    colors[cssVar] = `var(--recursica-tokens-color-${tokenMatch.family}-${tokenMatch.level})`
  } else {
    // Last resort: use default token reference
    colors[cssVar] = defaults[cssVar] ? tokenToTokensVar(defaults[cssVar].token) || `var(--recursica-tokens-color-gray-500)` : `var(--recursica-tokens-color-gray-500)`
  }
} else {
  colors[cssVar] = ref
}
```

### Phase 3: Centralize CSS Variable Application

#### 3.1 Remove Direct DOM Manipulation
**File**: `src/modules/palettes/PaletteGrid.tsx`
**Change**: Remove all `root.style.setProperty()` calls for brand CSS vars
**Solution**: Instead, update state and let `recomputeAndApplyAll()` handle CSS var updates

#### 3.2 Update PaletteGrid to Use State Updates
- Remove `applyFamilyToCssVars()` function
- Update palette family selection to trigger `recomputeAndApplyAll()` via state change
- Ensure all brand CSS vars are set through the centralized system

### Phase 4: Fix Typography Resolver

#### 4.1 Remove Raw Value Fallbacks
**File**: `src/core/resolvers/typography.ts`
**Change**: Lines 203, 212, 219, 226, 233
```typescript
// BEFORE:
vars[`${brandPrefix}font-size`] = sizeToken 
  ? `var(--recursica-tokens-font-${sizeToken.category}-${sizeToken.suffix})`
  : (findTokenByValue(size, 'size') || toCssValue(size, 'px')!)  // ❌

// AFTER:
const sizeRef = sizeToken 
  ? `var(--recursica-tokens-font-${sizeToken.category}-${sizeToken.suffix})`
  : findTokenByValue(size, 'size')
  
if (!sizeRef) {
  console.warn(`Could not find token reference for font size: ${size}`)
  // Use default token as fallback
  vars[`${brandPrefix}font-size`] = `var(--recursica-tokens-font-size-md)`
} else {
  vars[`${brandPrefix}font-size`] = sizeRef
}
```

### Phase 5: Fix Layers Resolver

#### 5.1 Ensure Token References
**File**: `src/core/resolvers/layers.ts`
**Change**: Ensure all brand CSS vars use token references
- Replace hex fallbacks with token lookups
- Use `findTokenColorByHex()` to convert hex to token references
- Never set brand vars to raw hex values

### Phase 6: Add Validation Layer

#### 6.1 Add Runtime Validation
**File**: `src/core/css/apply.ts`
**Change**: Add validation before applying CSS vars
```typescript
export function applyCssVars(vars: CssVarMap) {
  // Validate all brand vars use token references
  for (const [key, value] of Object.entries(vars)) {
    if (isBrandVar(key)) {
      if (!value.trim().startsWith('var(')) {
        console.error(`Brand CSS variable ${key} is being set to non-reference value: ${value}`)
        // Try to fix it
        const fixed = tryFixBrandVarValue(key, value)
        if (fixed) {
          vars[key] = fixed
        } else {
          throw new Error(`Cannot set brand CSS variable ${key} to hardcoded value: ${value}`)
        }
      }
    }
  }
  applyDirect(vars)
}
```

## Implementation Order

1. **Phase 1**: Create enforcement utilities (foundation)
2. **Phase 2**: Fix core palette bindings (critical issue)
3. **Phase 3**: Centralize CSS variable application (prevents future issues)
4. **Phase 4**: Fix typography resolver (medium priority)
5. **Phase 5**: Fix layers resolver (medium priority)
6. **Phase 6**: Add validation layer (safety net)

## Testing Strategy

1. **Unit Tests**: Test `tokenToCssVar()` and `enforceBrandVarValue()` functions
2. **Integration Tests**: Verify brand CSS vars always use token references
3. **Manual Testing**: 
   - Change core palette colors → verify CSS vars use token references
   - Change font tokens → verify typography vars use token references
   - Change palette families → verify palette vars use token references
4. **Validation**: Add console warnings/errors when violations are detected

## Success Criteria

✅ All `--recursica-brand-*` CSS variables use `var(--recursica-tokens-*)` references
✅ No hardcoded hex/RGB values in brand CSS variables
✅ All CSS variable updates go through centralized system
✅ Runtime validation catches violations
✅ Clear error messages when violations occur

