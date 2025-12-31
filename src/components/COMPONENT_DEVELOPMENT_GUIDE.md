# Component Development Guide

This guide provides comprehensive instructions for building new components for all UI libraries (Mantine, Material UI, Carbon) in the Recursica Forge.

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Development Process](#development-process)
4. [CSS Variable Guidelines](#css-variable-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Component Audit](#component-audit)
7. [Migration Checklist](#migration-checklist)

## Overview

Each component in the Recursica Forge consists of:
- **Adapter Component**: Unified interface that works across all libraries
- **Library Implementations**: Library-specific implementations (Mantine, Material UI, Carbon)
- **CSS Overrides**: Library-specific CSS files for styling
- **Tests**: Unit, integration, and visual regression tests
- **Audit**: Documentation of library CSS variables and coverage

### Supported Libraries

- **Mantine** (`@mantine/core`)
- **Material UI** (`@mui/material`)
- **Carbon Design System** (`@carbon/react`)

## Folder Structure

### New Structure (Use This)

```
src/components/adapters/
├── {ComponentName}.tsx              # Adapter component (unified interface)
├── mantine/
│   └── {ComponentName}/
│       ├── {ComponentName}.tsx      # Mantine implementation
│       ├── {ComponentName}.css      # Mantine CSS overrides
│       └── {ComponentName}.mantine.audit.md  # Mantine-specific audit
├── material/
│   └── {ComponentName}/
│       ├── {ComponentName}.tsx      # Material UI implementation
│       ├── {ComponentName}.css      # Material UI CSS overrides
│       └── {ComponentName}.material.audit.md  # Material UI-specific audit
└── carbon/
    └── {ComponentName}/
        ├── {ComponentName}.tsx      # Carbon implementation
        ├── {ComponentName}.css      # Carbon CSS overrides
        └── {ComponentName}.carbon.audit.md  # Carbon-specific audit
```

### Example: Button Component

```
src/components/adapters/
├── Button.tsx
├── mantine/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.css
│       └── Button.mantine.audit.md
├── material/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.css
│       └── Button.material.audit.md
└── carbon/
    └── Button/
        ├── Button.tsx
        ├── Button.css
        └── Button.carbon.audit.md
```

## UIKit.json Structure

The UIKit.json file uses a consistent structure for all components:

### Component Structure

```json
{
  "ui-kit": {
    "components": {
      "{component}": {
        "variants": {
          "styles": {
            "{variant-name}": {
              "properties": {
                "colors": {
                  "layer-0": {
                    "{property}": { "$type": "color", "$value": "..." }
                  }
                }
              }
            }
          },
          "sizes": {
            "{variant-name}": {
              "properties": {
                "{property}": { "$type": "dimension", "$value": "..." }
              }
            }
          }
        },
        "properties": {
          "{property}": { "$type": "dimension|elevation|typography", "$value": "..." }
        }
      }
    }
  }
}
```

### Key Patterns

1. **Color Variants**: `variants.styles.{variant}.properties.colors.{layer}.{property}`
   - Example: `button.variants.styles.solid.properties.colors.layer-0.background`
   - CSS Variable: `--recursica-ui-kit-components-button-variants-styles-solid-properties-colors-layer-0-background`
   - Code: `getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')`

2. **Size Variants**: `variants.sizes.{variant}.properties.{property}`
   - Example: `button.variants.sizes.default.properties.height`
   - CSS Variable: `--recursica-ui-kit-components-button-variants-sizes-default-properties-height`
   - Code: `getComponentCssVar('Button', 'size', 'default-height', undefined)`

3. **Component-Level Properties**: `properties.{property}`
   - Example: `button.properties.elevation`
   - CSS Variable: `--recursica-ui-kit-components-button-properties-elevation`
   - Code: `getComponentLevelCssVar('Button', 'elevation')`

### Special Cases

- **Switch Component**: Has colors directly under `properties.colors` (no variants)
  - Structure: `switch.properties.colors.layer-0.thumb-selected`
  - Code: `getComponentCssVar('Switch', 'colors', 'thumb-selected', 'layer-0')`

- **Avatar Component**: Has nested variants for styles
  - Structure: `avatar.variants.styles.text.variants.solid.properties.colors.layer-0.background`
  - Code: `getComponentCssVar('Avatar', 'colors', 'text-solid-background', 'layer-0')`

## Development Process

### Step 1: Create the Adapter Component

**File**: `src/components/adapters/{ComponentName}.tsx`

The adapter component provides a unified interface that works across all libraries.

#### Key Pattern:

1. **Define Unified Props Interface**
   ```typescript
   export type {ComponentName}Props = {
     children?: React.ReactNode
     variant?: 'solid' | 'outline' | 'text'  // Example
     size?: 'default' | 'small'              // Example
     layer?: ComponentLayer
     elevation?: string                      // e.g., "elevation-0", "elevation-1"
     disabled?: boolean
     // ... other unified props
   } & LibrarySpecificProps
   ```

2. **Read Component-Level CSS Variables Reactively**
   The adapter reactively reads CSS variables (like `elevation`) that the toolbar sets. Use `useState` and `useEffect` to ensure components update when CSS variables change:
   ```typescript
   import { useState, useEffect } from 'react'
   import { getComponentLevelCssVar } from '../utils/cssVarNames'
   import { readCssVar } from '../../core/css/readCssVar'
   import { parseElevationValue } from '../utils/brandCssVars'
   
   const elevationVar = getComponentLevelCssVar('Button', 'elevation')
   
   // Reactively read elevation from CSS variable
   const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
     const value = readCssVar(elevationVar)
     return value ? parseElevationValue(value) : undefined
   })
   
   // Listen for CSS variable updates from the toolbar
   useEffect(() => {
     const handleCssVarUpdate = (e: Event) => {
       const detail = (e as CustomEvent).detail
       if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
         const value = readCssVar(elevationVar)
         setElevationFromVar(value ? parseElevationValue(value) : undefined)
       }
     }
     
     window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
     
     // Also watch for direct style changes using MutationObserver
     const observer = new MutationObserver(() => {
       const value = readCssVar(elevationVar)
       setElevationFromVar(value ? parseElevationValue(value) : undefined)
     })
     observer.observe(document.documentElement, {
       attributes: true,
       attributeFilter: ['style'],
     })
     
     return () => {
       window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
       observer.disconnect()
     }
   }, [elevationVar])
   
   const componentElevation = elevation ?? elevationFromVar ?? undefined
   ```

3. **Use Component Registry**
   ```typescript
   import { useComponent } from '../hooks/useComponent'
   
   export function {ComponentName}(props: {ComponentName}Props) {
     const Component = useComponent('{ComponentName}')
     
     if (!Component) {
       // Fallback to native HTML element with styles
       return <native-element style={getFallbackStyles(...)} />
     }
     
     return (
       <Suspense fallback={<loading-state />}>
         <Component {...props} elevation={componentElevation} />
       </Suspense>
     )
   }
   ```

4. **Pass Props to Library Implementation**
   - Pass all unified props including `elevation` to library implementations
   - Library implementations handle the actual styling using CSS variables

### Step 2: Create Library Implementations (Parallel Development)

Create implementations for each library simultaneously. Each library implementation follows this pattern:

1. **Import Dependencies**
   ```typescript
   import { {ComponentName} as Library{ComponentName} } from '@library/package'
   import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
   import { getBrandTypographyCssVar, getBrandStateCssVar, getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
   import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
   import { readCssVar } from '../../../../core/css/readCssVar'
   import { useState, useEffect } from 'react'
   import './{ComponentName}.css'
   ```

2. **Build CSS Variable Names Using `getComponentCssVar`**
   This utility builds CSS variable names that match the new UIKit.json structure:
   
   **For Color Properties** (use `'colors'` plural, not `'color'`):
   ```typescript
   // Pattern: getComponentCssVar(componentName, 'colors', 'variant-property', layer?)
   // NEW STRUCTURE: variants.styles.{variant}.properties.colors.{layer}.{property}
   const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
   const textVar = getComponentCssVar('Button', 'colors', 'solid-text', layer)
   // For nested variants (Avatar): 'text-solid-background' → variants.styles.text.variants.solid.properties.colors
   const avatarBgVar = getComponentCssVar('Avatar', 'colors', 'text-solid-background', layer)
   ```
   
   **For Size Properties**:
   ```typescript
   // Pattern: getComponentCssVar(componentName, 'size', 'variant-property', undefined)
   // NEW STRUCTURE: variants.sizes.{variant}.properties.{property}
   const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
   const iconSizeVar = getComponentCssVar('Button', 'size', 'default-icon', undefined)
   const iconGapVar = getComponentCssVar('Button', 'size', 'default-icon-text-gap', undefined)
   ```
   
   **For Component-Level Properties** (use `getComponentLevelCssVar`):
   ```typescript
   // Pattern: getComponentLevelCssVar(componentName, 'property')
   // NEW STRUCTURE: properties.{property}
   const elevationVar = getComponentLevelCssVar('Button', 'elevation')
   const borderRadiusVar = getComponentLevelCssVar('Button', 'border-radius')
   const fontSizeVar = getComponentLevelCssVar('Button', 'font-size')
   const maxWidthVar = getComponentLevelCssVar('Button', 'max-width')
   ```

3. **Use UIKit.json Structure**
   The new UIKit.json structure uses:
   - `variants.styles.{variant}.properties.colors.{layer}.{property}` for color variants
   - `variants.sizes.{variant}.properties.{property}` for size variants
   - `properties.{property}` for component-level properties
   
   **Examples**:
   ```typescript
   // Button colors: variants.styles.solid.properties.colors.layer-0.background
   const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
   
   // Button sizes: variants.sizes.default.properties.height
   const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)
   
   // Component-level: properties.elevation
   const elevationVar = getComponentLevelCssVar('Button', 'elevation')
   ```

4. **Set CSS Custom Properties on Style Prop**
   Set CSS custom properties that the CSS file will use:
   ```typescript
   style={{
     // Reference UIKit CSS vars directly (toolbar updates these)
     '--button-bg': `var(${bgVar})`,
     '--button-color': `var(${textVar})`,
     '--button-height': `var(${heightVar})`,
     '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
     '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
     // ... other custom properties
   }}
   ```

5. **Handle Elevation Reactively**
   Elevation should be read reactively from CSS variables. Use centralized utilities:
   ```typescript
   // Reactively read elevation from CSS variable
   const elevationVar = getComponentLevelCssVar('Button', 'elevation')
   const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
     const value = readCssVar(elevationVar)
     return value ? parseElevationValue(value) : undefined
   })
   
   useEffect(() => {
     const handleCssVarUpdate = (e: Event) => {
       const detail = (e as CustomEvent).detail
       if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
         const value = readCssVar(elevationVar)
         setElevationFromVar(value ? parseElevationValue(value) : undefined)
       }
     }
     
     window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
     const observer = new MutationObserver(() => {
       const value = readCssVar(elevationVar)
       setElevationFromVar(value ? parseElevationValue(value) : undefined)
     })
     observer.observe(document.documentElement, {
       attributes: true,
       attributeFilter: ['style'],
     })
     
     return () => {
       window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
       observer.disconnect()
     }
   }, [elevationVar])
   
   const elevationToApply = elevation ?? elevationFromVar ?? undefined
   
   // Use centralized utility for box-shadow generation
   if (elevationToApply && elevationToApply !== 'elevation-0') {
     style.boxShadow = getElevationBoxShadow(mode, elevationToApply) || undefined
   }
   ```
   
   **Note**: Always use `getElevationBoxShadow()` from `brandCssVars.ts` instead of manually constructing box-shadow values. This ensures consistency and correct CSS variable paths (including the `themes` segment).

6. **Map Unified Props to Library Props**
   ```typescript
   const libraryVariant = variant === 'solid' ? 'filled' : variant === 'outline' ? 'outline' : 'subtle'
   const librarySize = size === 'small' ? 'xs' : 'md'
   
   return <LibraryComponent 
     variant={libraryVariant}
     size={librarySize}
     style={style}
     {...librarySpecificProps}
   />
   ```

### Step 3: Create CSS Override Files

**File**: `src/components/adapters/{library}/{ComponentName}/{ComponentName}.css`

#### Core Principle

**Adapters must NEVER modify the underlying component structure. Only CSS overrides are allowed.**

#### Mandatory Rules

1. **Never Modify Component Structure**
   - ❌ **DO NOT** wrap components in custom elements (spans, divs, etc.)
   - ❌ **DO NOT** create custom wrapper elements for icons, text, or other content
   - ❌ **DO NOT** conditionally render different component structures
   - ❌ **DO NOT** modify the component's children prop structure
   - ✅ **DO** use the component's native props as intended by the library
   - ✅ **DO** pass icons through native icon props (e.g., `startIcon`, `leftSection`, etc.)
   - ✅ **DO** pass children directly to the component

2. **Use CSS Overrides Only**
   - ✅ **DO** use CSS files (`.css`) for all styling overrides
   - ✅ **DO** use CSS custom properties (CSS variables) set on the root element for dynamic values
   - ✅ **DO** use high-specificity selectors with `!important` when necessary to override library defaults
   - ✅ **DO** use the component's native class names and data attributes for targeting
   - ❌ **DO NOT** use inline styles for complex styling logic
   - ❌ **DO NOT** modify component structure to apply styles

3. **CSS Custom Properties Pattern**
   - Set CSS custom properties on the root element's `style` prop in TSX
   - Reference those custom properties in the CSS file
   - Use `calc()` for calculations when needed

4. **Component Props Usage**
   - ✅ **DO** use the component's native props exactly as the library intended
   - ✅ **DO** map unified props (from the adapter interface) to library-specific props
   - ✅ **DO** use library-specific style props (e.g., Mantine's `styles`, Material's `sx`) only for simple overrides
   - ❌ **DO NOT** use style props to create complex wrapper structures
   - ❌ **DO NOT** conditionally change component structure based on props

5. **Icon Handling**
   - ✅ **DO** pass icons through native icon props (`startIcon`, `leftSection`, `icon`, etc.)
   - ✅ **DO** use CSS to size and space icons
   - ✅ **DO** set CSS custom properties for icon size and gap
   - ❌ **DO NOT** wrap icons in custom span/div elements
   - ❌ **DO NOT** create custom icon rendering logic

6. **Text Truncation**
   - ✅ **DO** use CSS for text truncation (`overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`)
   - ✅ **DO** use CSS `calc()` with custom properties for dynamic max-width calculations
   - ✅ **DO** target the component's native text/label elements via CSS
   - ❌ **DO NOT** wrap text in custom span elements for truncation
   - ❌ **DO NOT** modify children structure for truncation

7. **CSS File Organization**
   - ✅ **DO** create a `.css` file alongside each adapter (e.g., `Button.css`)
   - ✅ **DO** use high-specificity selectors to override library defaults
   - ✅ **DO** use `!important` when necessary to override library styles
   - ✅ **DO** add comments explaining why overrides are needed
   - ❌ **DO NOT** put complex styling logic in the TSX file

8. **Use Library CSS Vars as Fallbacks** - `var(--recursica-var, var(--library-var))`

#### Example Pattern:

```css
/* Override library styles using Recursica CSS variables */
.library-Component-root {
  background-color: var(--recursica-ui-kit-components-{component}-color-..., var(--library-default-bg)) !important;
  color: var(--recursica-ui-kit-components-{component}-color-..., var(--library-default-color)) !important;
}

/* Use CSS custom properties set in TSX */
.library-Component-root .library-Component-icon {
  width: var(--component-icon-size, 0px) !important;
  height: var(--component-icon-size, 0px) !important;
  margin-right: var(--component-icon-text-gap, 0px) !important;
}
```

#### ✅ Correct: Using Native Props and CSS

```tsx
// Button.tsx
const mantineProps = {
  leftSection: icon ? icon : undefined, // Use native prop
  styles: {
    root: {
      // Only simple style overrides
    },
  },
  style: {
    // Set CSS custom properties for CSS file
    '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
  },
}
return <MantineButton {...mantineProps}>{children}</MantineButton>
```

```css
/* Button.css */
.mantine-Button-root .mantine-Button-leftSection {
  width: var(--button-icon-size) !important;
  height: var(--button-icon-size) !important;
}
```

#### ❌ Incorrect: Modifying Component Structure

```tsx
// ❌ DO NOT DO THIS
const iconElement = icon ? (
  <span style={{ /* custom styles */ }}>
    <span>{icon}</span>
  </span>
) : undefined

const buttonChildren = children ? (
  <span style={{ /* truncation styles */ }}>
    {children}
  </span>
) : children

return <MantineButton leftSection={iconElement}>{buttonChildren}</MantineButton>
```

#### Enforcement Guidelines

When working with adapters:

1. **Always ask**: "Am I modifying the component structure?" If yes, refactor to use CSS only.
2. **Always ask**: "Can this be done with CSS?" If yes, move it to the CSS file.
3. **Always ask**: "Am I using the component's native props?" If no, refactor to use native props.

### Step 4: Register Components

**Files**: 
- `src/components/registry/mantine.ts`
- `src/components/registry/material.ts`
- `src/components/registry/carbon.ts`

```typescript
import { registerComponent } from './index'

registerComponent('mantine', '{ComponentName}', () => import('../adapters/mantine/{ComponentName}/{ComponentName}'))
registerComponent('material', '{ComponentName}', () => import('../adapters/material/{ComponentName}/{ComponentName}'))
registerComponent('carbon', '{ComponentName}', () => import('../adapters/carbon/{ComponentName}/{ComponentName}'))
```

**Also update**: `src/components/registry/types.ts` - Add component name to `ComponentName` type union.

### Step 5: Create Tests

**MANDATORY**: You must create comprehensive test files including toolbar integration tests.

See [Testing Requirements](#testing-requirements) section below.

#### Step 5a: Create Toolbar Integration Tests (MANDATORY)

**File**: `src/components/adapters/__tests__/{ComponentName}.toolbar.test.tsx`

**CRITICAL**: This test file is **mandatory** and must verify that all toolbar props, when changed, properly update component props reactively.

**Purpose**: These tests simulate toolbar updates by directly updating CSS variables and verify that components respond correctly. This ensures that the toolbar and components stay in sync.

**Test Coverage Requirements**:

1. **Color Props Updates**:
   - Test that background colors update when toolbar changes variant colors
   - Test that text colors update when toolbar changes variant colors
   - Test all variants (solid, outline, text, etc.)
   - Test all layers (layer-0, layer-1, layer-2, layer-3)

2. **Size Props Updates**:
   - Test that height updates when toolbar changes size height
   - Test that icon size updates when toolbar changes size icon
   - Test that padding updates when toolbar changes size padding
   - Test all size variants (default, small, large, etc.)

3. **Component-Level Props Updates**:
   - Test that elevation updates when toolbar changes elevation
   - Test that border-radius updates when toolbar changes border-radius
   - Test that max-width updates when toolbar changes max-width
   - Test that font-size updates when toolbar changes font-size
   - Test all component-level properties defined in `UIKit.json`

4. **Multiple Props Updates**:
   - Test that components handle multiple simultaneous CSS variable updates
   - Test that components update correctly when multiple props change at once

5. **Variant Switching**:
   - Test that components update CSS variables when variant changes via toolbar
   - Test that components correctly switch between variants

6. **Reactive Updates**:
   - Test that components update when CSS variables change via `cssVarsUpdated` events
   - Test that components update when CSS variables change via MutationObserver (direct style changes)
   - Test that components handle sequential CSS variable updates

**Test Template**:

```typescript
/**
 * Toolbar Props Integration Tests
 * 
 * Tests that verify components reactively update when toolbar props are changed.
 * These tests simulate toolbar updates by directly updating CSS variables and
 * verifying that components respond correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { UnifiedThemeProvider } from '../providers/UnifiedThemeProvider'
import { UiKitProvider } from '../../modules/uikit/UiKitContext'
import { {ComponentName} } from '../{ComponentName}'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'

describe('{ComponentName} Toolbar Props Integration', () => {
  beforeEach(() => {
    // Clear all CSS variables before each test
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    // Clean up after each test
    document.documentElement.style.cssText = ''
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <UiKitProvider>
        <UnifiedThemeProvider>
          {ui}
        </UnifiedThemeProvider>
      </UiKitProvider>
    )
  }

  describe('Color Props Updates', () => {
    it('updates background color when toolbar changes {variant}-background', async () => {
      const { container } = renderWithProviders(
        <{ComponentName} variant="{variant}" layer="layer-0">Test</{ComponentName}>
      )
      const element = container.querySelector('{selector}')
      expect(element).toBeInTheDocument()

      // Get the CSS variable name that the toolbar would use
      const bgVar = getComponentCssVar('{ComponentName}', 'colors', '{variant}-background', 'layer-0')
      
      // Simulate toolbar update: change the CSS variable
      updateCssVar(bgVar, '#ff0000')
      
      // Dispatch the cssVarsUpdated event that components listen for
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [bgVar] }
      }))

      // Wait for component to reactively update
      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        // Verify component references the updated CSS variable
        const bgValue = styles.getPropertyValue('--{component}-bg')
        expect(bgValue).toContain('var(')
        expect(bgValue).toContain(bgVar)
      })
    })

    // Add more color prop tests for all variants and layers
  })

  describe('Size Props Updates', () => {
    it('updates height when toolbar changes {variant}-height', async () => {
      // Test size prop updates
    })

    // Add more size prop tests for all size variants
  })

  describe('Component-Level Props Updates', () => {
    it('updates elevation when toolbar changes elevation', async () => {
      const { container } = renderWithProviders(
        <{ComponentName}>Test</{ComponentName}>
      )
      const element = container.querySelector('{selector}')
      
      const elevationVar = getComponentLevelCssVar('{ComponentName}', 'elevation')
      
      // Update elevation CSS variable
      updateCssVar(elevationVar, 'elevation-2')
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
        detail: { cssVars: [elevationVar] }
      }))

      // Wait for component to reactively update elevation
      await waitFor(() => {
        const styles = window.getComputedStyle(element!)
        // Elevation should be applied as box-shadow
        expect(styles.boxShadow).toBeTruthy()
      }, { timeout: 1000 })
    })

    // Add tests for all component-level properties
  })

  describe('Multiple Props Updates', () => {
    it('handles multiple simultaneous CSS variable updates', async () => {
      // Test multiple props updating at once
    })
  })

  describe('Reactive Updates', () => {
    it('component updates when CSS variable changes without event', async () => {
      // Test MutationObserver detection
    })
  })
})
```

**Key Testing Patterns**:

1. **Simulate Toolbar Updates**: Use `updateCssVar()` to change CSS variables, then dispatch `cssVarsUpdated` events
2. **Verify Reactive Updates**: Use `waitFor()` to ensure components update after CSS variable changes
3. **Check CSS Variable References**: Verify that components reference the correct CSS variables in their styles
4. **Test All Variants**: Ensure all variants (styles, sizes) are tested
5. **Test All Layers**: Ensure all layers (layer-0 through layer-3) are tested
6. **Test Component-Level Props**: Ensure all component-level properties are tested

**Example Test for Button**:

See `src/components/adapters/__tests__/Button.toolbar.test.tsx` for a complete reference implementation.

**Verification Checklist**:

- [ ] All color props (background, text, etc.) are tested for all variants
- [ ] All size props (height, icon, padding, etc.) are tested for all size variants
- [ ] All component-level props (elevation, border-radius, etc.) are tested
- [ ] Multiple simultaneous updates are tested
- [ ] Variant switching is tested
- [ ] Reactive updates via `cssVarsUpdated` events are tested
- [ ] Reactive updates via MutationObserver are tested
- [ ] All tests pass and components update correctly

### Step 6: Create Toolbar Configuration

**File**: `src/modules/toolbar/configs/{ComponentName}.toolbar.json`

Each component needs a toolbar configuration file that defines:
- **Icons**: Which icon to display for each prop in the toolbar
- **Labels**: Display labels for props in the toolbar
- **Floating Palette Labels**: Titles for the floating palette when editing a prop
- **Grouped Props**: Props that should be grouped together under a single icon (e.g., border-size, border-radius, border-color → "border")

#### Config File Structure

```json
{
  "variants": {
    "style": {
      "icon": "diamonds-four",
      "label": "Style"
    },
    "size": {
      "icon": "resize",
      "label": "Size"
    }
  },
  "props": {
    "prop-name": {
      "icon": "icon-name",
      "label": "Display Label",
      "visible": true,
      "group": {
        "sub-prop": {
          "label": "Sub Property",
          "visible": true
        }
      }
    }
  }
}
```

**Important Notes:**
- Use `variants.style` (not `variants.color`) for style variants
- Use `variants.size` for size variants (if component has sizes)
- Variant names in the config should match the variant keys in `UIKit.json` (e.g., `styles`, `sizes`)

#### Key Fields

1. **`icon`** (required): The Phosphor icon name to display in the toolbar
   - Use kebab-case icon names (e.g., `"paint-bucket"`, `"text-aa"`, `"frame-corners"`)
   - See available icons in `src/modules/components/iconLibrary.ts`

2. **`label`** (required): The display label shown in the toolbar tooltip
   - Should be user-friendly (e.g., `"Background"`, `"Horizontal Padding"`)

3. **`floatingPaletteLabel`** (required): The title shown in the floating palette when editing
   - Should be descriptive (e.g., `"Background Color"`, `"Border Settings"`)

4. **`groupedProps`** (optional): Array of prop names that are grouped under this icon
   - Used for props like "border" that combine multiple properties
   - Example: `"border"` prop with `groupedProps: ["border-size", "border-radius", "border-color"]`

#### Mapping UIKit.json Keys to Props

The prop names in the config file should match the keys in `UIKit.json`:

**UIKit.json Structure (NEW):**
```json
{
  "ui-kit": {
    "components": {
      "button": {
        "variants": {
          "styles": {
            "solid": {
              "properties": {
                "colors": {
                  "layer-0": {
                    "background": { "$type": "color", "$value": "..." },
                    "text": { "$type": "color", "$value": "..." }
                  }
                }
              }
            }
          },
          "sizes": {
            "default": {
              "properties": {
                "height": { "$type": "dimension", "$value": "..." },
                "horizontal-padding": { "$type": "dimension", "$value": "..." }
              }
            }
          }
        },
        "properties": {
          "border-radius": { "$type": "dimension", "$value": "..." },
          "elevation": { "$type": "elevation", "$value": "..." }
        }
      }
    }
  }
}
```

**Toolbar Config:**
```json
{
  "props": {
    "horizontal-padding": {
      "icon": "arrows-left-right",
      "label": "Horizontal Padding",
      "floatingPaletteLabel": "Horizontal Padding"
    },
    "border-radius": {
      "icon": "corners-out",
      "label": "Border Radius",
      "floatingPaletteLabel": "Border Radius"
    }
  }
}
```

#### Example: Button Toolbar Config

```json
{
  "props": {
    "background": {
      "icon": "paint-bucket",
      "label": "Background",
      "floatingPaletteLabel": "Background Color"
    },
    "text": {
      "icon": "text-aa",
      "label": "Text",
      "floatingPaletteLabel": "Text Color"
    },
    "border": {
      "icon": "frame-corners",
      "label": "Border",
      "floatingPaletteLabel": "Border Settings",
      "groupedProps": ["border-size", "border-radius", "border-color"]
    },
    "horizontal-padding": {
      "icon": "arrows-left-right",
      "label": "Horizontal Padding",
      "floatingPaletteLabel": "Horizontal Padding"
    }
  }
}
```

#### Registering the Config File

**CRITICAL STEP**: After creating the config file, you **must** register it in `src/modules/toolbar/utils/loadToolbarConfig.ts`. If you skip this step, the toolbar will not load your component's config and props/variants will not appear.

1. **Import the config file** at the top of `loadToolbarConfig.ts`:

```typescript
import ButtonConfig from '../configs/Button.toolbar.json'
import SwitchConfig from '../configs/Switch.toolbar.json'
import AvatarConfig from '../configs/Avatar.toolbar.json'
import BadgeConfig from '../configs/Badge.toolbar.json'  // Add your component here
```

2. **Add a case in the switch statement**:

```typescript
export function loadToolbarConfig(componentName: string): ToolbarConfig | null {
  try {
    const componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
    
    switch (componentKey) {
      case 'button':
        return ButtonConfig as ToolbarConfig
      case 'switch':
        return SwitchConfig as ToolbarConfig
      case 'avatar':
        return AvatarConfig as ToolbarConfig
      case 'badge':  // Add your component here (use kebab-case)
        return BadgeConfig as ToolbarConfig
      default:
        return null
    }
  } catch (error) {
    console.warn(`Failed to load toolbar config for ${componentName}:`, error)
    return null
  }
}
```

**Important Notes**:
- The `componentKey` is the component name converted to kebab-case (e.g., `"Button"` → `"button"`, `"MyComponent"` → `"my-component"`)
- The case in the switch statement must match the kebab-case version of your component name
- If the component name doesn't match, the toolbar will return `null` and no props/variants will appear

#### Verifying Registration

After registering your config, verify it works:

1. **Check the import**: Ensure the import statement is correct and the file path is valid
2. **Check the case**: Verify the case in the switch statement matches your component's kebab-case name
3. **Test in browser**: Navigate to your component's detail page and verify:
   - Variants appear in the toolbar (if defined in config)
   - Props appear as icons in the toolbar
   - Icons display correctly (no console warnings)
   - Clicking props opens the floating palette
4. **Check browser console**: Look for any errors or warnings about missing configs

**Quick Test Command**:
```bash
# Verify your component is in the switch statement
grep -A 5 "case.*badge" src/modules/toolbar/utils/loadToolbarConfig.ts
```

#### Common Icon Mappings

| Prop Type | Suggested Icon | Example Props |
|-----------|---------------|---------------|
| Colors | `paint-bucket` | `background`, `text`, `border-color` |
| Text | `text-aa` | `text`, `text-color`, `text-hover` |
| Dimensions | `arrows-up-down`, `arrows-left-right`, `arrows-pointing-out` | `height`, `width`, `padding` |
| Borders | `frame-corners`, `corners-out` | `border`, `border-radius` |
| Icons | `frame-corners` | `icon`, `icon-size` |
| Gaps/Spacing | `split-horizontal` | `icon-text-gap`, `label-switch-gap` |
| Typography | `bars-arrow-up`, `scale` | `font-size`, `font-weight` |

#### Grouped Props Example

For props that combine multiple properties (like "border"), define the parent prop with a `group` object:

```json
{
  "props": {
    "border": {
      "icon": "square",
      "label": "Border",
      "visible": true,
      "group": {
        "border-size": {
          "label": "Size",
          "visible": true
        },
        "border-radius": {
          "label": "Corner Radius",
          "visible": true
        },
        "border-color": {
          "label": "Color",
          "visible": true
        }
      }
    }
  }
}
```

**Important Notes**:
- Grouped props do NOT have icons (they appear in the parent prop's floating palette)
- Grouped props do NOT need separate entries in the `props` object
- Grouped prop names must match `UIKit.json` prop names exactly
- The parent prop (e.g., `border`) appears as a single icon in the toolbar

**Note**: Grouped props do NOT need separate entries in the config - they only appear in the parent prop's `group` object. They won't appear as separate icons in the toolbar - they'll be accessible through the parent prop's floating palette.

#### Variant-Specific Props

Props that are variant-specific (e.g., `size.variant.default.height`) should use the base prop name without the variant prefix. The toolbar automatically handles variant-specific props based on the selected variant:

```json
{
  "props": {
    "height": {
      "icon": "arrows-up-down",
      "label": "Height",
      "visible": true
    },
    "horizontal-padding": {
      "icon": "arrows-left-right",
      "label": "Horizontal Padding",
      "visible": true
    }
  }
}
```

The toolbar automatically:
- Filters props based on selected variants
- Shows only props relevant to the current variant selection
- Handles nested variants (e.g., Avatar's `style` and `style-secondary`)

#### Testing Your Config

After creating the config file and registering it in `loadToolbarConfig.ts`:

1. **Verify registration**: Check that the component is imported and added to the switch statement in `loadToolbarConfig.ts`
2. **Check that props appear in toolbar**: All props defined in your config should appear as icons in the toolbar
3. **Check that variants appear**: All variants defined in your config should appear as dropdowns in the toolbar
4. **Verify icons display correctly**: Icons should render properly (check browser console for warnings)
5. **Test labels**: Hover over icons to verify tooltips show correct labels
6. **Test floating palettes**: Click icons to verify floating palette titles are correct
7. **Test grouped props**: If using grouped props, verify they appear in the parent prop's floating palette
8. **Test variant filtering**: Change variants and verify props are filtered correctly

#### Troubleshooting

- **Props/variants not appearing in toolbar**: 
  - **CRITICAL**: Verify the component is registered in `loadToolbarConfig.ts` (import statement AND switch case)
  - Check that the component name in the switch case matches the kebab-case version (e.g., `"badge"` for `"Badge"`)
  - Verify the import path is correct and the JSON file exists
  - Check browser console for errors about failed config loading
  - Test by navigating to the component's detail page and checking if toolbar loads

- **Prop not appearing in toolbar**: 
  - Check that the prop name in config matches the UIKit.json key exactly (case-sensitive)
  - Verify the prop is defined in the toolbar config JSON file
  - Check browser console for warnings about missing icons

- **Icon not displaying**:
  - Verify the icon name exists in Phosphor Icons
  - Check `src/modules/components/iconLibrary.ts` to see available icons
  - Use kebab-case for icon names

- **Wrong label displayed**:
  - Verify the `label` field in config matches what you expect
  - Check that the prop name in config matches the UIKit.json key

### Step 7: Create Audit Documentation

**IMPORTANT**: Audits are **library-specific** and must be created for **each library separately**.

Create an audit document for each library implementation:
- `src/components/adapters/mantine/{ComponentName}/{ComponentName}.mantine.audit.md`
- `src/components/adapters/material/{ComponentName}/{ComponentName}.material.audit.md`
- `src/components/adapters/carbon/{ComponentName}/{ComponentName}.carbon.audit.md`

**Do NOT create global audit reports** - each library has its own unique CSS variables, fallbacks, and implementation details that must be documented separately.

See [Component Audit](#component-audit) section below for details.

### Step 8: Replace Existing Uses

**IMPORTANT**: After creating a component, replace all existing uses throughout the application.

#### Find All Uses:

```bash
# Search for direct library imports
grep -r "from '@mantine/core'" src/
grep -r "from '@mui/material'" src/
grep -r "from '@carbon/react'" src/

# Search for component usage
grep -r "Button\|Card\|TextField" src/ --include="*.tsx" --include="*.ts"
```

#### Replace Pattern:

**Before:**
```typescript
import { Button as MantineButton } from '@mantine/core'

<MantineButton variant="filled" size="md">
  Click me
</MantineButton>
```

**After:**
```typescript
import { Button } from '../../components/adapters/Button'

<Button variant="solid" size="default">
  Click me
</Button>
```

#### Files to Update:

1. **Preview/Example Pages**: `src/modules/preview/`, `src/modules/components/`
2. **Shell Components**: `src/modules/app/shells/`
3. **Token Pages**: `src/modules/tokens/`
4. **Any other application code using the component**

## CSS Variable Guidelines

### How CSS Variables Work

The component system uses a **three-layer CSS variable system**:

1. **UIKit CSS Variables** (set by toolbar, read by components)
   - **Color Properties**: `--recursica-ui-kit-components-{component}-variants-styles-{variant}-properties-colors-{layer}-{property}`
     - Built using: `getComponentCssVar(componentName, 'colors', 'variant-property', layer)`
     - Example: `--recursica-ui-kit-components-button-variants-styles-solid-properties-colors-layer-0-background`
   - **Size Properties**: `--recursica-ui-kit-components-{component}-variants-sizes-{variant}-properties-{property}`
     - Built using: `getComponentCssVar(componentName, 'size', 'variant-property', undefined)`
     - Example: `--recursica-ui-kit-components-button-variants-sizes-default-properties-height`
   - **Component-Level Properties**: `--recursica-ui-kit-components-{component}-properties-{property}`
     - Built using: `getComponentLevelCssVar(componentName, property)`
     - Examples: `--recursica-ui-kit-components-button-properties-elevation`, `--recursica-ui-kit-components-button-properties-border-radius`

2. **Brand CSS Variables** (for typography, state, elevation)
   - **Typography**: `--recursica-brand-typography-{style}-{property}`
     - Built using: `getBrandTypographyCssVar(styleName, property)`
     - Example: `--recursica-brand-typography-button-font-weight`
   - **State**: `--recursica-brand-themes-{mode}-state-{state}`
     - Built using: `getBrandStateCssVar(mode, state)`
     - Example: `--recursica-brand-themes-light-state-disabled`
   - **Elevation**: `--recursica-brand-themes-{mode}-elevations-elevation-{level}-{property}`
     - Box-shadow generated using: `getElevationBoxShadow(mode, elevation)`

3. **Component Custom Properties** (set by component, used by CSS file)
   - Pattern: `--{component}-{property}` (scoped to component instance)
   - Example: `--button-bg`, `--button-icon-size`

### CSS Variable Flow

```
Toolbar → Updates UIKit CSS vars → Component reads vars → Component sets custom properties → CSS file uses custom properties
```

1. **Toolbar** uses `getComponentCssVar()` to build CSS var names and updates them via `updateCssVar()`
2. **Component** uses `getComponentCssVar()` to build the same CSS var names and references them
3. **Component** sets CSS custom properties on `style` prop (e.g., `--button-bg: var(${bgVar})`)
4. **CSS File** uses those custom properties to override library styles

### Using CSS Variables in Components

#### ✅ Correct: Build CSS var names with `getComponentCssVar` (use 'colors' plural)

```typescript
// This matches what the toolbar uses
// IMPORTANT: Use 'colors' (plural), not 'color' (singular)
const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
const textVar = getComponentCssVar('Button', 'colors', 'solid-text', layer)
const heightVar = getComponentCssVar('Button', 'size', 'default-height', undefined)

style={{
  // Reference the UIKit CSS var (toolbar updates this)
  '--button-bg': `var(${bgVar})`,
  '--button-text': `var(${textVar})`,
  '--button-height': `var(${heightVar})`,
}}
```

#### ✅ Correct: Use component-level CSS vars for component-level properties

```typescript
// For properties directly under component.properties (not under variants)
const elevationVar = getComponentLevelCssVar('Button', 'elevation')
const borderRadiusVar = getComponentLevelCssVar('Button', 'border-radius')
const fontSizeVar = getComponentLevelCssVar('Button', 'font-size')
const maxWidthVar = getComponentLevelCssVar('Button', 'max-width')

// Reactively read from CSS variable
const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
  const value = readCssVar(elevationVar)
  return value ? parseElevationValue(value) : undefined
})
```

#### ✅ Correct: Use centralized brand utilities

```typescript
import { getBrandTypographyCssVar, getBrandStateCssVar, getElevationBoxShadow } from '../../../utils/brandCssVars'

// Typography
const fontWeight = getBrandTypographyCssVar('button', 'font-weight')

// State
const disabledOpacity = getBrandStateCssVar(mode, 'disabled')

// Elevation
if (elevation && elevation !== 'elevation-0') {
  style.boxShadow = getElevationBoxShadow(mode, elevation) || undefined
}
```

#### ✅ Correct: CSS file uses component custom properties

```css
/* Button.css - uses custom properties set in TSX */
.mantine-Button-root {
  background-color: var(--button-bg) !important;
  height: var(--button-height) !important;
}

.mantine-Button-leftSection {
  width: var(--button-icon-size, 0px) !important;
  margin-inline-end: var(--button-icon-text-gap, 0px) !important;
}
```

#### ❌ Incorrect: Don't build CSS var names manually

```typescript
// ❌ Don't do this - use getComponentCssVar instead
const bgVar = `--recursica-ui-kit-components-button-variants-styles-solid-properties-colors-layer-0-background`

// ✅ Do this instead
const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
```

#### ❌ Incorrect: Don't use 'color' (singular) - use 'colors' (plural)

```typescript
// ❌ Don't do this
const bgVar = getComponentCssVar('Button', 'color', 'solid-background', layer)

// ✅ Do this
const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
```

#### ❌ Incorrect: Don't manually construct elevation box-shadow

```typescript
// ❌ Don't do this
if (elevation && elevation !== 'elevation-0') {
  const level = elevation.match(/elevation-(\d+)/)?.[1]
  style.boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${level}-x-axis, 0px) ...`
}

// ✅ Do this instead
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
if (elevation && elevation !== 'elevation-0') {
  style.boxShadow = getElevationBoxShadow(mode, elevation) || undefined
}
```

#### ❌ Incorrect: Don't modify library CSS variables directly

```typescript
// ❌ Don't do this
style={{
  '--mantine-color-blue-6': '#ff0000',
}}
```

### Component-Level Props (Elevation and Other Properties)

Components support component-level properties that are stored as CSS variables and controlled by the toolbar:

1. **Elevation** (`elevation` prop)
   - Type: `string | undefined` (e.g., `"elevation-0"`, `"elevation-1"`, etc.)
   - CSS Variable: `--recursica-ui-kit-components-{component}-properties-elevation`
   - Priority: **Prop** > **CSS Variable** > **UIKit.json default** > **No elevation**
   - Implementation:
     ```typescript
     // In adapter: reactively read from CSS var if prop not provided
     import { useState, useEffect } from 'react'
     import { getComponentLevelCssVar } from '../utils/cssVarNames'
     import { parseElevationValue } from '../utils/brandCssVars'
     import { readCssVar } from '../../core/css/readCssVar'
     
     const elevationVar = getComponentLevelCssVar('Button', 'elevation')
     const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
       const value = readCssVar(elevationVar)
       return value ? parseElevationValue(value) : undefined
     })
     
     useEffect(() => {
       const handleCssVarUpdate = (e: Event) => {
         const detail = (e as CustomEvent).detail
         if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
           const value = readCssVar(elevationVar)
           setElevationFromVar(value ? parseElevationValue(value) : undefined)
         }
       }
       window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
       const observer = new MutationObserver(() => {
         const value = readCssVar(elevationVar)
         setElevationFromVar(value ? parseElevationValue(value) : undefined)
       })
       observer.observe(document.documentElement, {
         attributes: true,
         attributeFilter: ['style'],
       })
       return () => {
         window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
         observer.disconnect()
       }
     }, [elevationVar])
     
     const componentElevation = elevation ?? elevationFromVar ?? undefined
     
     // In library implementation: apply elevation box-shadow using centralized utility
     import { getElevationBoxShadow } from '../../../utils/brandCssVars'
     
     if (componentElevation && componentElevation !== 'elevation-0') {
       style.boxShadow = getElevationBoxShadow(mode, componentElevation) || undefined
     }
     ```

2. **Other Component-Level Properties**
   - Properties like `border-radius`, `font-size`, `max-width`, etc. are also component-level
   - Use `getComponentLevelCssVar(componentName, property)` to get their CSS variable names
   - Pattern: `--recursica-ui-kit-components-{component}-properties-{property}`

**Key Points:**
- Use `getComponentLevelCssVar(componentName, 'elevation')` to get the elevation CSS variable name
- Always read CSS variables reactively using `useState` and `useEffect` to respond to toolbar updates
- Use `getElevationBoxShadow()` from `brandCssVars.ts` instead of manually constructing box-shadow values
- Listen for `cssVarsUpdated` events and use `MutationObserver` to detect style attribute changes

### How Components Connect to the Toolbar

The toolbar and components use the **same utilities** to build CSS variable names, ensuring they stay in sync:

1. **Toolbar builds CSS var names** using `getComponentCssVar()` and `getComponentLevelCssVar()`
2. **Toolbar updates CSS vars** using `updateCssVar()` (writes to DOM)
3. **Components build the same CSS var names** using the same utilities
4. **Components reference those CSS vars** in their styles
5. **When toolbar updates a CSS var, components automatically reflect the change**

**Example Flow:**
```typescript
// Toolbar (ComponentToolbar.tsx)
const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', selectedLayer)
updateCssVar(bgVar, newValue) // Updates DOM CSS variable

// Component (Button.tsx) - Reactively reads CSS variable
const bgVar = getComponentCssVar('Button', 'colors', 'solid-background', layer)
const [bgFromVar, setBgFromVar] = useState(() => readCssVar(bgVar))

useEffect(() => {
  const handleUpdate = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail?.cssVars || detail.cssVars.includes(bgVar)) {
      setBgFromVar(readCssVar(bgVar))
    }
  }
  window.addEventListener('cssVarsUpdated', handleUpdate)
  return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
}, [bgVar])

style={{ '--button-bg': `var(${bgVar})` }} // References the same CSS variable

// CSS File (Button.css)
.mantine-Button-root {
  background-color: var(--button-bg) !important; // Uses component custom property
}
```

**Key Insight:** Components don't need to know about the toolbar - they just reference CSS variables that the toolbar updates. This creates a clean separation of concerns.

### Library CSS Variables

Library-specific CSS variables (e.g., `--mantine-color-*`, `--cds-*`, `--mui-*`) should:
- **NOT** be modified directly
- **ONLY** be used as fallbacks in `var()` functions
- Be documented in the component audit

## Testing Requirements

### Test File Structure

```
src/components/adapters/
├── __tests__/
│   ├── {ComponentName}.test.tsx              # Adapter tests
│   ├── {ComponentName}.cssVars.test.tsx      # CSS variable coverage tests
│   ├── {ComponentName}.integration.test.tsx  # Integration tests
│   └── {ComponentName}.toolbar.test.tsx      # Toolbar integration tests (MANDATORY)
├── mantine/
│   └── {ComponentName}/
│       └── {ComponentName}.test.tsx      # Mantine-specific tests
├── material/
│   └── {ComponentName}/
│       └── {ComponentName}.test.tsx      # Material-specific tests
└── carbon/
    └── {ComponentName}/
        └── {ComponentName}.test.tsx      # Carbon-specific tests
```

### 1. Unit Tests

**File**: `{ComponentName}.test.tsx` (adapter) and `{library}/{ComponentName}/{ComponentName}.test.tsx`

Test individual component functionality:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles onClick events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('applies variant styles', () => {
    const { container } = render(<Button variant="solid">Solid</Button>)
    const button = container.querySelector('button')
    // Check CSS variables are applied
    expect(button).toHaveStyle({
      backgroundColor: expect.stringContaining('var(--recursica-ui-kit-components-button')
    })
  })

  it('applies size styles', () => {
    const { container } = render(<Button size="small">Small</Button>)
    const button = container.querySelector('button')
    // Check size CSS variables
    expect(button).toHaveStyle({
      height: expect.stringContaining('var(--recursica-ui-kit-components-button-size-variant-small-height')
    })
  })

  it('applies layer styles', () => {
    const { container } = render(<Button layer="layer-1">Layer 1</Button>)
    const button = container.querySelector('button')
    // Check layer-specific CSS variables
    expect(button).toHaveStyle({
      backgroundColor: expect.stringContaining('var(--recursica-ui-kit-components-button-color-layer-1')
    })
  })
})
```

### 2. Integration Tests

**File**: `{ComponentName}.integration.test.tsx`

Test component interaction with the registry and library switching:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UiKitProvider } from '../../providers/UnifiedThemeProvider'
import { Button } from '../Button'

describe('Button Integration', () => {
  it('renders Mantine button when Mantine is selected', () => {
    render(
      <UiKitProvider initialKit="mantine">
        <Button>Mantine Button</Button>
      </UiKitProvider>
    )
    // Check for Mantine-specific classes
    expect(screen.getByText('Mantine Button').closest('.mantine-Button-root')).toBeInTheDocument()
  })

  it('renders Material button when Material is selected', () => {
    render(
      <UiKitProvider initialKit="material">
        <Button>Material Button</Button>
      </UiKitProvider>
    )
    // Check for Material-specific classes
    expect(screen.getByText('Material Button').closest('.MuiButton-root')).toBeInTheDocument()
  })

  it('renders Carbon button when Carbon is selected', () => {
    render(
      <UiKitProvider initialKit="carbon">
        <Button>Carbon Button</Button>
      </UiKitProvider>
    )
    // Check for Carbon-specific classes
    expect(screen.getByText('Carbon Button').closest('.cds--btn')).toBeInTheDocument()
  })

  it('maintains consistent styling across libraries', () => {
    const mantine = render(
      <UiKitProvider initialKit="mantine">
        <Button variant="solid" size="default">Test</Button>
      </UiKitProvider>
    )
    const material = render(
      <UiKitProvider initialKit="material">
        <Button variant="solid" size="default">Test</Button>
      </UiKitProvider>
    )
    const carbon = render(
      <UiKitProvider initialKit="carbon">
        <Button variant="solid" size="default">Test</Button>
      </UiKitProvider>
    )

    // Check that all use the same CSS variables
    const mantineButton = mantine.container.querySelector('button')
    const materialButton = material.container.querySelector('button')
    const carbonButton = carbon.container.querySelector('button')

    // All should reference the same Recursica CSS variables
    expect(mantineButton).toHaveStyle({
      backgroundColor: expect.stringContaining('--recursica-ui-kit-components-button')
    })
    expect(materialButton).toHaveStyle({
      backgroundColor: expect.stringContaining('--recursica-ui-kit-components-button')
    })
    expect(carbonButton).toHaveStyle({
      backgroundColor: expect.stringContaining('--recursica-ui-kit-components-button')
    })
  })
})
```

### 3. CSS Variable Coverage Tests

**File**: `{ComponentName}.cssVars.test.tsx`

Test that all required CSS variables are defined and used:

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../Button'
import { readCssVar } from '../../../core/css/readCssVar'

describe('Button CSS Variables', () => {
  it('defines all required CSS variables', () => {
    // Render component to trigger CSS variable application
    render(<Button variant="solid" size="default" layer="layer-0">Test</Button>)

    // Check that CSS variables are defined
    const bgVar = readCssVar('--recursica-ui-kit-components-button-color-layer-0-variant-solid-background')
    const textVar = readCssVar('--recursica-ui-kit-components-button-color-layer-0-variant-solid-text')
    const heightVar = readCssVar('--recursica-ui-kit-components-button-size-variant-default-height')

    expect(bgVar).toBeDefined()
    expect(textVar).toBeDefined()
    expect(heightVar).toBeDefined()
  })

  it('uses CSS variables in component styles', () => {
    const { container } = render(<Button variant="solid">Test</Button>)
    const button = container.querySelector('button')
    const styles = window.getComputedStyle(button!)

    // Check that styles use CSS variables
    expect(styles.backgroundColor).toContain('var(--recursica-ui-kit-components-button')
    expect(styles.color).toContain('var(--recursica-ui-kit-components-button')
  })

  it('handles missing CSS variables gracefully', () => {
    // Remove a CSS variable
    document.documentElement.style.removeProperty('--recursica-ui-kit-components-button-color-layer-0-variant-solid-background')
    
    const { container } = render(<Button variant="solid">Test</Button>)
    const button = container.querySelector('button')
    
    // Should fall back to library default or handle gracefully
    expect(button).toBeInTheDocument()
  })
})
```

### 4. Toolbar Integration Tests (MANDATORY)

**File**: `{ComponentName}.toolbar.test.tsx`

**CRITICAL**: This test file is **mandatory** and must be created for every component. It verifies that components reactively update when toolbar props are changed.

These tests simulate toolbar updates by directly updating CSS variables and verify that components respond correctly. This ensures that the toolbar and components stay in sync.

**Test Coverage Requirements**:

1. **Color Props Updates**: Test all color properties for all variants and layers
2. **Size Props Updates**: Test all size properties for all size variants
3. **Component-Level Props Updates**: Test all component-level properties (elevation, border-radius, etc.)
4. **Multiple Props Updates**: Test simultaneous updates of multiple CSS variables
5. **Variant Switching**: Test that components update when variants change
6. **Reactive Updates**: Test both `cssVarsUpdated` events and MutationObserver detection

**Example**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'

describe('{ComponentName} Toolbar Props Integration', () => {
  it('updates background color when toolbar changes', async () => {
    const { container } = renderWithProviders(
      <{ComponentName} variant="solid" layer="layer-0">Test</{ComponentName}>
    )
    const element = container.querySelector('{selector}')
    
    const bgVar = getComponentCssVar('{ComponentName}', 'colors', 'solid-background', 'layer-0')
    
    // Simulate toolbar update
    updateCssVar(bgVar, '#ff0000')
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: [bgVar] }
    }))

    // Verify component updates reactively
    await waitFor(() => {
      const styles = window.getComputedStyle(element!)
      expect(styles.getPropertyValue('--{component}-bg')).toContain(bgVar)
    })
  })
})
```

**See**: `src/components/adapters/__tests__/Button.toolbar.test.tsx` for a complete reference implementation.

### 5. Visual Regression Tests

**File**: `{ComponentName}.visual.test.tsx`

Test visual appearance across libraries (requires visual testing tool like Chromatic or Percy):

```typescript
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { UiKitProvider } from '../../providers/UnifiedThemeProvider'
import { Button } from '../Button'

describe('Button Visual Regression', () => {
  const variants = ['solid', 'outline', 'text'] as const
  const sizes = ['default', 'small'] as const
  const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3'] as const

  variants.forEach(variant => {
    sizes.forEach(size => {
      layers.forEach(layer => {
        it(`renders ${variant} ${size} button on ${layer} correctly`, () => {
          ['mantine', 'material', 'carbon'].forEach(kit => {
            const { container } = render(
              <UiKitProvider initialKit={kit as any}>
                <Button variant={variant} size={size} layer={layer as any}>
                  {variant} {size}
                </Button>
              </UiKitProvider>
            )
            // Visual regression tool will capture screenshot
            expect(container).toMatchSnapshot(`${kit}-${variant}-${size}-${layer}`)
          })
        })
      })
    })
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Button.test.tsx
```

## Component Audit

**IMPORTANT**: Audits are **library-specific**. You must create **separate audit documents for each library** (Mantine, Material UI, Carbon). Each library has unique CSS variables, fallback chains, and implementation details that must be documented independently.

### Audit Requirements

Each library implementation must include its own audit document that identifies:

1. **Library CSS Variables Used** (specific to that library)
2. **Recursica CSS Variables Overriding Library Vars** (how Recursica vars override library vars)
3. **Uncovered Library CSS Variables** (library vars not overridden by Recursica)
4. **CSS Variable Fallback Chain** (Recursica → Library → Browser default)
5. **Toolbar Config Validation** (schema validation and prop coverage) - **REQUIRED**

### Schema Validation Step

Before completing the audit, validate your toolbar configuration:

#### 1. Validate JSON Schema

```bash
# Validate toolbar config JSON structure
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('src/modules/toolbar/configs/Button.toolbar.json', 'utf8'));

// Check required fields
if (!config.props) throw new Error('Missing required field: props');
if (config.variants && typeof config.variants !== 'object') throw new Error('variants must be an object');

// Validate each prop
for (const [propName, propConfig] of Object.entries(config.props)) {
  if (!propConfig.icon) throw new Error(\`Prop \${propName} missing required field: icon\`);
  if (!propConfig.label) throw new Error(\`Prop \${propName} missing required field: label\`);
  if (propConfig.group) {
    for (const [groupName, groupConfig] of Object.entries(propConfig.group)) {
      if (!groupConfig.label) throw new Error(\`Grouped prop \${groupName} missing required field: label\`);
    }
  }
}

console.log('✓ Toolbar config schema is valid');
"
```

#### 2. Validate Prop Coverage

Ensure all root-level props from `UIKit.json` are represented in the toolbar config:

```bash
# Compare UIKit.json props with toolbar config
node -e "
const fs = require('fs');
const uikit = JSON.parse(fs.readFileSync('src/vars/UIKit.json', 'utf8'));
const config = JSON.parse(fs.readFileSync('src/modules/toolbar/configs/Button.toolbar.json', 'utf8'));

function extractRootProps(obj, prefix = []) {
  const props = new Set();
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'variant' || key === 'size') continue;
    if (value && typeof value === 'object' && !value.\$type && !value.\$value) {
      if (key !== 'variant' && key !== 'size') {
        continue;
      }
    } else if (value && (value.\$type || value.value)) {
      props.add(key);
    }
  }
  return Array.from(props);
}

function getConfigProps(config) {
  const props = new Set();
  if (config.props) {
    for (const [key, value] of Object.entries(config.props)) {
      props.add(key);
      if (value.group) {
        for (const groupKey of Object.keys(value.group)) {
          props.add(groupKey);
        }
      }
    }
  }
  return Array.from(props);
}

const component = uikit['ui-kit'].components.button;
const rootProps = extractRootProps(component);
const configProps = getConfigProps(config);
const missing = rootProps.filter(p => !configProps.includes(p));

if (missing.length > 0) {
  console.error('✗ Missing props in toolbar config:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✓ All root props are represented in toolbar config');
}
"
```

#### 3. Validate Config Registration

**CRITICAL**: Verify the component is registered in `loadToolbarConfig.ts`:

```bash
# Check that component is imported and registered
node -e "
const fs = require('fs');
const componentName = 'Badge'; // Replace with your component name
const componentKey = componentName.toLowerCase().replace(/\s+/g, '-');
const loadToolbarConfig = fs.readFileSync('src/modules/toolbar/utils/loadToolbarConfig.ts', 'utf8');

// Check for import
const importPattern = new RegExp(\`import.*\${componentName}Config.*from.*configs/\${componentName}\\.toolbar\\.json\`, 'i');
if (!importPattern.test(loadToolbarConfig)) {
  console.error(\`✗ Component config not imported: \${componentName}Config\`);
  console.error('  Add: import \${componentName}Config from \\'../configs/\${componentName}.toolbar.json\\'');
  process.exit(1);
}

// Check for switch case
const casePattern = new RegExp(\`case\\s+['\\"]\${componentKey}['\\"]:\`, 'i');
if (!casePattern.test(loadToolbarConfig)) {
  console.error(\`✗ Component not registered in switch statement: case '\${componentKey}'\`);
  console.error(\`  Add: case '\${componentKey}': return \${componentName}Config as ToolbarConfig\`);
  process.exit(1);
}

console.log(\`✓ Component '\${componentName}' is properly registered in loadToolbarConfig.ts\`);
"
```

**Manual Verification Steps**:
1. Open `src/modules/toolbar/utils/loadToolbarConfig.ts`
2. Verify the import statement exists: `import {ComponentName}Config from '../configs/{ComponentName}.toolbar.json'`
3. Verify the switch case exists: `case '{component-key}': return {ComponentName}Config as ToolbarConfig`
4. Navigate to the component's detail page in the browser
5. Verify props and variants appear in the toolbar
6. Check browser console for any errors about missing configs

#### 4. Validate Icon Names

Ensure all icon names are valid Phosphor Icons:

```bash
# Check that all icons exist in iconLibrary
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('src/modules/toolbar/configs/Button.toolbar.json', 'utf8'));
const iconLibrary = fs.readFileSync('src/modules/components/iconLibrary.ts', 'utf8');

function getAllIcons(config) {
  const icons = new Set();
  if (config.variants) {
    for (const variant of Object.values(config.variants)) {
      if (variant.icon) icons.add(variant.icon);
    }
  }
  if (config.props) {
    for (const prop of Object.values(config.props)) {
      if (prop.icon) icons.add(prop.icon);
    }
  }
  return Array.from(icons);
}

const icons = getAllIcons(config);
const missing = icons.filter(icon => !iconLibrary.includes(icon));

if (missing.length > 0) {
  console.error('✗ Icons not found in iconLibrary:', missing.join(', '));
  console.log('Note: Icons should be automatically imported by Vite plugin when config is saved');
  process.exit(1);
} else {
  console.log('✓ All icons are valid');
}
"
```

#### 5. Add Validation to Audit Document

Include validation results in your audit document:

```markdown
## Toolbar Config Validation

### Schema Validation
- [x] JSON structure is valid
- [x] All required fields present (icon, label, visible)
- [x] Group structure is correct (no icons in grouped props)
- [x] Variant structure is correct

### Config Registration
- [x] Component config imported in `loadToolbarConfig.ts`
- [x] Component registered in switch statement with correct kebab-case key
- [x] Props and variants appear in toolbar when navigating to component page
- [x] No console errors about missing configs

### Prop Coverage
- [x] All root props from UIKit.json are represented
- [x] Variant props are correctly grouped
- [x] Grouped props match UIKit.json prop names exactly

### Icon Validation
- [x] All icons are valid Phosphor Icons
- [x] Icons are automatically imported (verified in iconLibrary.ts)
- [x] No missing icon warnings in browser console
```

### Audit File Location

**Each library must have its own audit file**:

```
src/components/adapters/
├── mantine/
│   └── {ComponentName}/
│       └── {ComponentName}.mantine.audit.md  # Mantine-specific audit
├── material/
│   └── {ComponentName}/
│       └── {ComponentName}.material.audit.md  # Material UI-specific audit
└── carbon/
    └── {ComponentName}/
        └── {ComponentName}.carbon.audit.md  # Carbon-specific audit
```

**File Path Pattern**: `src/components/adapters/{library}/{ComponentName}/{ComponentName}.{library}.audit.md`

**Naming Convention**: `{ComponentName}.{library}.audit.md`
- Examples: `Button.mantine.audit.md`, `Button.material.audit.md`, `Button.carbon.audit.md`
- This naming makes it clear which component and library the audit covers

**Do NOT create**:
- ❌ Global audit reports at the adapter root level
- ❌ Combined audit files covering multiple libraries
- ❌ Audit files outside the library's component folder

### Toolbar Config Validation (Required in Audit)

**IMPORTANT**: Every component audit must include a **Toolbar Config Validation** section that verifies the toolbar configuration is complete and correct.

#### Required Validation Checks

1. **Config Registration** (CRITICAL): The component is properly registered in `loadToolbarConfig.ts`
   - Import statement exists for the component's config file
   - Switch case exists with the correct kebab-case component name
   - Props and variants appear in the toolbar when navigating to the component page
   - No console errors about missing configs

2. **Schema Compliance**: The toolbar config JSON follows the correct schema structure
3. **Prop Coverage**: All root-level props from `UIKit.json` are represented in the toolbar config
3. **Icon Validity**: All icon names are valid Phosphor Icons and are imported
4. **Group Integrity**: All grouped props match actual prop names from `UIKit.json`
5. **Variant Alignment**: Variant props are correctly configured to match `UIKit.json` structure

#### Example Audit Section Template

Include this section in every audit document:

```markdown
## Toolbar Config Validation

### Schema Validation
- [x] JSON structure is valid
- [x] All required fields present (icon, label, visible)
- [x] Group structure is correct (no icons in grouped props)
- [x] Variant structure is correct

### Prop Coverage
- [x] All root props from UIKit.json are represented:
  - [x] `font-size`
  - [x] `border-radius`
  - [x] `elevation`
  - [x] `max-width`
- [x] Variant props are correctly grouped:
  - [x] `background` and `background-hover` grouped
  - [x] `text` and `text-hover` grouped

### Icon Validation
- [x] All icons are valid Phosphor Icons
- [x] Icons are automatically imported (verified in iconLibrary.ts)
- [x] No missing icon warnings in browser console

### Notes
- Size variant props (height, icon, etc.) are handled automatically via size variant selection
- Color variant props are filtered based on selected color variant
- Grouped props appear in parent prop's floating palette (no separate icons)
```

**Validation Script**: Use the validation scripts provided in the [Schema Validation Step](#schema-validation-step) section above to automate these checks.

### Audit File Template

**File**: `src/components/adapters/{library}/{ComponentName}/{ComponentName}.{library}.audit.md`

```markdown
# {ComponentName} Component Audit - {Library}

## Overview

This document audits the {ComponentName} component implementation for {Library}, identifying all CSS variables used, their sources, and any gaps in coverage.

## Library CSS Variables

### Variables Used (with Fallbacks)

| Library Variable | Recursica Override | Fallback Behavior | Status |
|-----------------|-------------------|-------------------|--------|
| `--mantine-color-blue-6` | `--recursica-ui-kit-components-button-color-...` | Used as fallback in `var()` | ✅ Covered |
| `--mantine-scale` | N/A | Used for border calculations | ⚠️ Library Internal |
| `--button-bg` | `--recursica-ui-kit-components-button-color-...` | Set via style prop | ✅ Covered |
| `--button-color` | `--recursica-ui-kit-components-button-color-...` | Set via style prop | ✅ Covered |

### Variables NOT Overridden

| Library Variable | Reason | Impact | Recommendation |
|-----------------|--------|--------|----------------|
| `--mantine-scale` | Library internal scaling factor | Low - used for responsive scaling | Document as library internal |
| `--mantine-color-{name}-{shade}` | Used only as fallbacks | Low - fallback only | No action needed |

## Recursica CSS Variables

### Variables Defined

| Variable Name | Source | Used For |
|--------------|--------|----------|
| `--recursica-ui-kit-components-button-color-layer-0-variant-solid-background` | UIKit.json | Button background color |
| `--recursica-ui-kit-components-button-color-layer-0-variant-solid-text` | UIKit.json | Button text color |
| `--recursica-ui-kit-components-button-size-variant-default-height` | UIKit.json | Button height |
| `--recursica-ui-kit-components-button-size-variant-default-horizontal-padding` | UIKit.json | Button padding |

### Variables Used (with Library Fallbacks)

```css
/* Example from Button.css */
.mantine-Button-root {
  background-color: var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-background, var(--mantine-color-blue-6)) !important;
}
```

## Component-Level CSS Variables

### Variables Set in TSX

| Variable | Purpose | Default |
|---------|---------|---------|
| `--button-icon-size` | Icon width/height | `0px` (when no icon) |
| `--button-icon-text-gap` | Gap between icon and text | `0px` (when no icon) |
| `--button-content-max-width` | Maximum content width | From UIKit.json |

### Variables Used in CSS

```css
.mantine-Button-leftSection {
  width: var(--button-icon-size, var(--recursica-ui-kit-components-button-size-variant-default-icon)) !important;
  margin-inline-end: var(--button-icon-text-gap, var(--recursica-ui-kit-components-button-size-variant-default-icon-text-gap)) !important;
}
```

## CSS Variable Fallback Chain

```
Component Style
  ↓
--recursica-ui-kit-components-button-color-... (Primary)
  ↓ (if not defined)
--mantine-color-blue-6 (Library fallback)
  ↓ (if not defined)
Browser default
```

## Coverage Checklist

- [x] All color variables use Recursica vars with library fallbacks
- [x] All size variables use Recursica vars with library fallbacks
- [x] Component-level custom properties are properly scoped
- [x] No direct modification of library CSS variables
- [x] All CSS variables from JSON files are namespaced with `--recursica-*`
- [x] Library variables are only used as fallbacks in `var()` functions
- [x] Visual appearance matches across all libraries
- [x] All variants, sizes, and layers are tested
- [x] TSX to CSS migration opportunities identified and documented

## Running Audits

### Audit Process

**IMPORTANT**: Audits are **library-specific**. You must run audits **separately for each library** (Mantine, Material UI, Carbon). Each library has unique CSS variables, fallback chains, and implementation details that must be documented independently.

**Audit Steps**:

1. **Mantine Audit**: Analyze `mantine/{ComponentName}/` files
   - Review `mantine/{ComponentName}/{ComponentName}.tsx`
   - Review `mantine/{ComponentName}/{ComponentName}.css`
   - Document all Mantine-specific CSS variables
   - Save to: `mantine/{ComponentName}/{ComponentName}.mantine.audit.md`

2. **Material UI Audit**: Analyze `material/{ComponentName}/` files
   - Review `material/{ComponentName}/{ComponentName}.tsx`
   - Review `material/{ComponentName}/{ComponentName}.css`
   - Document all Material UI-specific CSS variables
   - Save to: `material/{ComponentName}/{ComponentName}.material.audit.md`

3. **Carbon Audit**: Analyze `carbon/{ComponentName}/` files
   - Review `carbon/{ComponentName}/{ComponentName}.tsx`
   - Review `carbon/{ComponentName}/{ComponentName}.css`
   - Document all Carbon-specific CSS variables
   - Save to: `carbon/{ComponentName}/{ComponentName}.carbon.audit.md`

**Do NOT create**:
- ❌ Global audit reports at the adapter root level
- ❌ Combined audit files covering multiple libraries
- ❌ Audit files outside the library's component folder

### TSX to CSS Migration Audit

**Goal**: Minimize code in TSX files and maximize CSS usage. During the audit process, identify any styling logic in the TSX file that could/should be moved to CSS.

#### What to Look For

Review the `{ComponentName}.tsx` file and identify:

1. **Inline Styles in `style` prop**:
   - Static CSS properties that don't change based on props
   - Properties that could use CSS selectors instead
   - Properties that could use CSS custom properties (CSS variables)

2. **Conditional Style Objects**:
   - Style objects built conditionally that could use CSS classes
   - Variant-based styles that could use CSS attribute selectors or classes
   - State-based styles (hover, active, disabled) that should be in CSS

3. **Computed Style Values**:
   - Style values calculated in TSX that could be CSS variables
   - Dynamic values that could be set as CSS custom properties and used in CSS

4. **Library-Specific Style Props**:
   - Material UI `sx` prop usage that could be moved to CSS
   - Mantine `styles` prop usage that could be moved to CSS
   - Carbon inline styles that could be moved to CSS

#### Migration Strategy

**Before (TSX-heavy)**:
```typescript
// ❌ Bad: Inline styles in TSX
style={{
  backgroundColor: `var(${buttonBgVar})`,
  color: `var(${buttonColorVar})`,
  fontSize: `var(${fontSizeVar})`,
  height: `var(${heightVar})`,
  paddingLeft: `var(${horizontalPaddingVar})`,
  paddingRight: `var(${horizontalPaddingVar})`,
  borderRadius: `var(${borderRadiusVar})`,
  ...(variant === 'outline' ? {
    border: `1px solid var(${buttonColorVar})`,
  } : {}),
  ...(variant === 'text' ? {
    border: 'none',
  } : {}),
}}
```

**After (CSS-heavy)**:
```typescript
// ✅ Good: CSS variables set in TSX, styles in CSS
style={{
  '--button-bg': `var(${buttonBgVar})`,
  '--button-color': `var(${buttonColorVar})`,
  '--button-font-size': `var(${fontSizeVar})`,
  '--button-height': `var(${heightVar})`,
  '--button-padding-x': `var(${horizontalPaddingVar})`,
  '--button-border-radius': `var(${borderRadiusVar})`,
}}
```

```css
/* ✅ Good: All styling in CSS */
.button-root {
  background-color: var(--button-bg);
  color: var(--button-color);
  font-size: var(--button-font-size);
  height: var(--button-height);
  padding-left: var(--button-padding-x);
  padding-right: var(--button-padding-x);
  border-radius: var(--button-border-radius);
}

.button-root[data-variant='outline'] {
  border: 1px solid var(--button-color);
}

.button-root[data-variant='text'] {
  border: none;
}
```

#### Audit Checklist

When auditing, check for:

- [ ] **Inline style properties** that could be moved to CSS
- [ ] **Conditional style logic** that could use CSS selectors
- [ ] **Computed style values** that could be CSS variables
- [ ] **Library-specific style props** (sx, styles) that could be CSS
- [ ] **State-based styles** (hover, active, disabled) that should be in CSS
- [ ] **Variant-based styles** that could use CSS attribute selectors
- [ ] **Size-based styles** that could use CSS attribute selectors

#### Documentation

In the audit document, add a section documenting:

1. **TSX Code That Could Be CSS**:
   - List specific inline styles or style objects
   - Explain why they could be moved to CSS
   - Provide migration recommendations

2. **CSS Migration Opportunities**:
   - Identify which styles can be moved
   - Suggest CSS selectors or classes to use
   - Document any CSS variables that should be created

3. **Priority**:
   - Mark high-priority items (easy wins, large impact)
   - Mark low-priority items (complex, minimal benefit)

#### Example Audit Section

```markdown
## TSX to CSS Migration Opportunities

### High Priority

1. **Inline Style Properties** (Lines 97-110 in Button.tsx)
   - **Current**: Direct style properties in `sx` prop
   - **Recommendation**: Move to CSS using component-level CSS variables
   - **Impact**: Reduces TSX complexity, improves maintainability
   - **Migration**: Set CSS variables in TSX, use in CSS file

2. **Variant-Based Border Styles** (Lines 102-109 in Button.tsx)
   - **Current**: Conditional border styles in TSX
   - **Recommendation**: Use CSS attribute selectors `[data-variant='outline']`
   - **Impact**: Cleaner TSX, better separation of concerns

### Low Priority

1. **Dynamic Elevation Calculation** (Lines 198-229 in Button.tsx)
   - **Current**: Box-shadow calculated and applied in TSX
   - **Recommendation**: Could use CSS custom properties, but complexity may justify TSX
   - **Impact**: Minimal - logic is complex and dynamic
```

### Automated Audit Commands

Use these commands to find CSS variables in your component files. **Run these commands for each library separately**:

### Find Library CSS Variables

```bash
# Find all library CSS variables in component files
grep -r "var(--mantine-\|var(--cds-\|var(--mui-" src/components/adapters/{library}/{ComponentName}/
```

### Find Recursica CSS Variables

```bash
# Find all Recursica CSS variables
grep -r "var(--recursica-" src/components/adapters/{library}/{ComponentName}/
```

### Check for Direct Library Variable Modification

```bash
# Find any direct library variable assignments (should be none)
grep -r "'--mantine-\|'--cds-\|'--mui-" src/components/adapters/{library}/{ComponentName}/
```

### Verify CSS Variable Usage

```bash
# Check that all Recursica vars are used with library fallbacks
grep -r "var(--recursica-.*var(--" src/components/adapters/{library}/{ComponentName}/
```

## Visual Regression Testing

### Test Cases

1. **Variants**: solid, outline, text
2. **Sizes**: default, small
3. **Layers**: layer-0, layer-1, layer-2, layer-3
4. **States**: default, hover, active, disabled, focus
5. **With Icons**: icon-left, icon-right, icon-only
6. **With Long Text**: truncation behavior

### Screenshots

Screenshots should be captured for each test case across all three libraries to ensure visual consistency.

## Recommendations

1. ✅ All critical CSS variables are covered
2. ⚠️ Library internal variables (e.g., `--mantine-scale`) are documented but not overridden
3. ✅ Component-level custom properties are properly scoped
4. ✅ No direct library variable modification

## Last Updated

{Date}
```

### Automated Audit Script

Create a script to generate audit data for a specific library:

**File**: `scripts/audit-component.js`

**Usage**: Run the script separately for each library:
```bash
# Audit Mantine implementation
node scripts/audit-component.js Button mantine

# Audit Material UI implementation
node scripts/audit-component.js Button material

# Audit Carbon implementation
node scripts/audit-component.js Button carbon
```

**Important**: The script generates library-specific audit data. Each library must be audited separately.

```javascript
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const componentName = process.argv[2]
const library = process.argv[3]

if (!componentName || !library) {
  console.error('Usage: node audit-component.js <ComponentName> <library>')
  process.exit(1)
}

const componentPath = path.join(__dirname, '../src/components/adapters', library, componentName)

// Find all CSS variables
const cssFiles = [
  path.join(componentPath, `${componentName}.css`),
  path.join(componentPath, `${componentName}.tsx`),
]

const libraryVars = new Set()
const recursicaVars = new Set()

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return
  
  const content = fs.readFileSync(file, 'utf-8')
  
  // Find library CSS variables
  const libraryMatches = content.matchAll(/var\(--(mantine|cds|mui)-[^)]+\)/g)
  for (const match of libraryMatches) {
    libraryVars.add(match[0])
  }
  
  // Find Recursica CSS variables
  const recursicaMatches = content.matchAll(/var\(--recursica-[^)]+\)/g)
  for (const match of recursicaMatches) {
    recursicaVars.add(match[0])
  }
})

console.log(`\n=== ${componentName} - ${library} Audit ===\n`)
console.log('Library CSS Variables Found:')
libraryVars.forEach(v => console.log(`  - ${v}`))

console.log('\nRecursica CSS Variables Found:')
recursicaVars.forEach(v => console.log(`  - ${v}`))

console.log(`\nTotal: ${libraryVars.size} library vars, ${recursicaVars.size} Recursica vars`)
```

## Migration Checklist

After creating a new component, complete this checklist:

### Development

- [ ] Adapter component created with unified props interface
- [ ] Mantine implementation created
- [ ] Material UI implementation created
- [ ] Carbon implementation created
- [ ] CSS override files created for all libraries
- [ ] Components registered in registry files
- [ ] Component name added to `ComponentName` type union
- [ ] Toolbar config file created at `src/modules/toolbar/configs/{ComponentName}.toolbar.json`
- [ ] Toolbar config imported in `loadToolbarConfig.ts` (import statement added)
- [ ] Toolbar config registered in `loadToolbarConfig.ts` (switch case added with correct kebab-case key)
- [ ] Toolbar config registration verified (props and variants appear in toolbar, no console errors)
- [ ] All UIKit.json props have icons, labels, and visible properties defined

### CSS Variables

- [ ] All CSS variables from JSON files use `--recursica-*` namespace
- [ ] Library CSS variables only used as fallbacks in `var()` functions
- [ ] No direct modification of library CSS variables
- [ ] Component-level custom properties properly scoped
- [ ] CSS variable fallback chain documented

### Testing

- [ ] Unit tests written for adapter component
- [ ] Unit tests written for each library implementation
- [ ] Integration tests written for library switching
- [ ] CSS variable coverage tests written
- [ ] **Toolbar integration tests written (MANDATORY)** - `{ComponentName}.toolbar.test.tsx`
  - [ ] All color props tested for all variants and layers
  - [ ] All size props tested for all size variants
  - [ ] All component-level props tested
  - [ ] Multiple simultaneous updates tested
  - [ ] Variant switching tested
  - [ ] Reactive updates via `cssVarsUpdated` events tested
  - [ ] Reactive updates via MutationObserver tested
- [ ] Visual regression tests written
- [ ] All tests passing

### Audit

- [ ] **Mantine audit document created** at `mantine/{ComponentName}/{ComponentName}.mantine.audit.md`
- [ ] **Material UI audit document created** at `material/{ComponentName}/{ComponentName}.material.audit.md`
- [ ] **Carbon audit document created** at `carbon/{ComponentName}/{ComponentName}.carbon.audit.md`
- [ ] All Mantine library CSS variables documented in Mantine audit
- [ ] All Material UI library CSS variables documented in Material UI audit
- [ ] All Carbon library CSS variables documented in Carbon audit
- [ ] All Recursica CSS variables documented (in each library's audit)
- [ ] Uncovered variables identified and documented (in each library's audit)
- [ ] **TSX to CSS migration opportunities identified and documented** (in each library's audit)
- [ ] **No global audit reports created** (audits are library-specific only)

### Migration

- [ ] All direct library imports replaced with adapter imports
- [ ] All component usages updated to use unified props
- [ ] Preview/example pages updated
- [ ] Shell components updated (if applicable)
- [ ] Token pages updated (if applicable)
- [ ] All application code using component updated

### Documentation

- [ ] Component props documented
- [ ] Usage examples provided
- [ ] CSS variable usage documented
- [ ] Library-specific considerations documented

### Verification

- [ ] Component works correctly in Mantine
- [ ] Component works correctly in Material UI
- [ ] Component works correctly in Carbon
- [ ] Visual appearance consistent across libraries
- [ ] All variants, sizes, and layers tested
- [ ] All states (hover, active, disabled, focus) tested
- [ ] Icon support tested (if applicable)
- [ ] Text truncation tested (if applicable)

## Example: Complete Button Component Implementation

See the existing Button component as a reference:

- **Adapter**: `src/components/adapters/Button.tsx`
- **Mantine**: `src/components/adapters/mantine/Button/Button.tsx`
- **Material**: `src/components/adapters/material/Button/Button.tsx`
- **Carbon**: `src/components/adapters/carbon/Button/Button.tsx`
- **CSS Files**: `src/components/adapters/{library}/Button/Button.css`
- **Tests**: `src/components/adapters/{library}/Button/Button.test.tsx`
- **Audits**: `src/components/adapters/{library}/Button/Button.{library}.audit.md`

## Additional Resources

- **CSS Variable Utilities**: `src/components/utils/cssVarNames.ts`
  - `getComponentCssVar()` - For variant properties (colors, sizes)
  - `getComponentLevelCssVar()` - For component-level properties (elevation, border-radius, etc.)
- **Brand CSS Variable Utilities**: `src/components/utils/brandCssVars.ts`
  - `getBrandTypographyCssVar()` - For typography CSS variables
  - `getBrandStateCssVar()` - For state CSS variables (disabled, hover, etc.)
  - `getElevationBoxShadow()` - For generating elevation box-shadow values
  - `parseElevationValue()` - For parsing elevation values from CSS variables
- **Component Registry**: `src/components/registry/`
- **Testing Setup**: `vitest.setup.ts`
- **UIKit.json Structure**: `src/vars/UIKit.json`
  - **NEW STRUCTURE**: Uses `variants.styles.{variant}.properties.colors` for color variants
  - **NEW STRUCTURE**: Uses `variants.sizes.{variant}.properties.{property}` for size variants
  - **NEW STRUCTURE**: Uses `properties.{property}` for component-level properties

## Questions?

If you're unsure about any aspect of component development:

1. Review the existing Button component implementation
2. Review the CSS Override Files section above for CSS override guidelines
3. Review the library-specific audit documents for examples:
   - `mantine/{ComponentName}/{ComponentName}.mantine.audit.md`
   - `material/{ComponentName}/{ComponentName}.material.audit.md`
   - `carbon/{ComponentName}/{ComponentName}.carbon.audit.md`
   
   **Note**: Each library has its own audit document - do not create global audit reports.
4. Consult the testing examples above
5. Ask for clarification before proceeding

