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
│       └── audit.md                  # Mantine-specific audit
├── material/
│   └── {ComponentName}/
│       ├── {ComponentName}.tsx      # Material UI implementation
│       ├── {ComponentName}.css      # Material UI CSS overrides
│       └── audit.md                  # Material UI-specific audit
└── carbon/
    └── {ComponentName}/
        ├── {ComponentName}.tsx      # Carbon implementation
        ├── {ComponentName}.css      # Carbon CSS overrides
        └── audit.md                  # Carbon-specific audit
```

### Example: Button Component

```
src/components/adapters/
├── Button.tsx
├── mantine/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.css
│       └── audit.md
├── material/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.css
│       └── audit.md
└── carbon/
    └── Button/
        ├── Button.tsx
        ├── Button.css
        └── audit.md
```

## Development Process

### Step 1: Create the Adapter Component

**File**: `src/components/adapters/{ComponentName}.tsx`

The adapter component provides a unified interface that works across all libraries.

#### Requirements:

1. **Define Unified Props Interface**
   ```typescript
   export type {ComponentName}Props = {
     // Unified props that work across all libraries
     children?: React.ReactNode
     variant?: 'solid' | 'outline' | 'text'  // Example
     size?: 'default' | 'small'              // Example
     layer?: ComponentLayer
     disabled?: boolean
     // ... other unified props
   } & LibrarySpecificProps
   ```

2. **Use Component Registry**
   ```typescript
   import { useComponent } from '../hooks/useComponent'
   
   export function {ComponentName}(props: {ComponentName}Props) {
     const Component = useComponent('{ComponentName}')
     
     if (!Component) {
       // Fallback to native HTML element
       return <native-element {...props} />
     }
     
     return (
       <Suspense fallback={<loading-state />}>
         <Component {...mappedProps} />
       </Suspense>
     )
   }
   ```

3. **Map Unified Props to Library Props**
   - Create a mapping function that converts unified props to library-specific props
   - Handle library-specific props via `mantine`, `material`, `carbon` props

4. **Use CSS Variables**
   - Use `getComponentCssVar()` from `../utils/cssVarNames` for component CSS variables
   - Use `--recursica-brand-*` variables for brand tokens
   - All CSS variables from JSON files must be namespaced with `--recursica-*`

### Step 2: Create Library Implementations (Parallel Development)

Create implementations for each library simultaneously. Each library implementation should:

1. **Import the Library Component**
   ```typescript
   import { {ComponentName} as Library{ComponentName} } from '@library/package'
   ```

2. **Map Unified Props to Library Props**
   ```typescript
   // Map unified variant to library variant
   const libraryVariant = variant === 'solid' ? 'filled' : 'outline'
   ```

3. **Use CSS Variables with Library Fallbacks**
   ```typescript
   style={{
     // Use Recursica CSS vars with library vars as fallback
     backgroundColor: `var(--recursica-ui-kit-components-{component}-color-..., var(--library-default-color))`,
     // ... other styles
   }}
   ```

4. **Set CSS Custom Properties for CSS File**
   ```typescript
   style={{
     '--component-icon-size': icon ? `var(${iconSizeVar})` : '0px',
     '--component-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
     // ... other custom properties
   }}
   ```

5. **Import CSS File**
   ```typescript
   import './{ComponentName}.css'
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

See [Testing Requirements](#testing-requirements) section below.

### Step 6: Create Audit Documentation

**IMPORTANT**: Audits are **library-specific** and must be created for **each library separately**.

Create an audit document for each library implementation:
- `src/components/adapters/mantine/{ComponentName}/audit.md`
- `src/components/adapters/material/{ComponentName}/audit.md`
- `src/components/adapters/carbon/{ComponentName}/audit.md`

**Do NOT create global audit reports** - each library has its own unique CSS variables, fallbacks, and implementation details that must be documented separately.

See [Component Audit](#component-audit) section below for details.

### Step 7: Replace Existing Uses

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

### Naming Convention

All CSS variables from JSON files must be namespaced with `--recursica-*`:

- **Component Variables**: `--recursica-ui-kit-components-{component}-{category}-{property}`
- **Component-Level Props**: `--recursica-ui-kit-components-{component}-{property}` (e.g., `elevation`, `alternative-layer`)
- **Brand Variables**: `--recursica-brand-{mode}-{category}-{property}`
- **Token Variables**: `--recursica-tokens-{category}-{property}`

### Using CSS Variables

#### ✅ Correct: Recursica vars with library fallback

```typescript
style={{
  backgroundColor: `var(--recursica-ui-kit-components-button-color-layer-0-variant-solid-background, var(--mantine-color-blue-6))`,
}}
```

```css
.component-root {
  background-color: var(--recursica-ui-kit-components-button-color-..., var(--mantine-color-blue-6)) !important;
}
```

#### ❌ Incorrect: Direct library variable modification

```typescript
// Don't modify library variables directly
style={{
  '--mantine-color-blue-6': '#ff0000',  // ❌ Don't do this
}}
```

#### ✅ Correct: Component-level custom properties

```typescript
// Set component-level custom properties (scoped to component)
style={{
  '--button-icon-size': `var(${iconSizeVar})`,
  '--button-icon-text-gap': `var(${iconGapVar})`,
}}
```

```css
/* Reference component-level custom properties */
.button-icon {
  width: var(--button-icon-size, 0px) !important;
  margin-right: var(--button-icon-text-gap, 0px) !important;
}
```

### Component-Level Props (Elevation and Alternative Layer)

Components support two special component-level props that are stored as separate CSS variables:

1. **Elevation** (`elevation` prop)
   - Type: `string | undefined` (e.g., `"elevation-0"`, `"elevation-1"`, etc.)
   - CSS Variable: `--recursica-ui-kit-components-{component}-elevation`
   - Initial Value: From `UIKit.json` (e.g., `{brand.themes.light.elevations.elevation-1}`)
   - Behavior:
     - When set (and not `"elevation-0"`), applies box-shadow using elevation CSS variables
     - Format: `var(--recursica-brand-{mode}-elevations-elevation-{level}-x-axis) var(--recursica-brand-{mode}-elevations-elevation-{level}-y-axis) var(--recursica-brand-{mode}-elevations-elevation-{level}-blur) var(--recursica-brand-{mode}-elevations-elevation-{level}-spread) var(--recursica-brand-{mode}-elevations-elevation-{level}-shadow-color)`
     - If `elevation-0`, no box-shadow is applied
   - Implementation:
     ```typescript
     // In adapter component
     elevation?: string
     
     // In library implementation
     if (elevation && elevation !== 'elevation-0') {
       const elevationMatch = elevation.match(/elevation-(\d+)/)
       if (elevationMatch) {
         const elevationLevel = elevationMatch[1]
         styles.boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
       }
     }
     ```

2. **Alternative Layer** (`alternativeLayer` prop)
   - Type: `string | null | undefined` (e.g., `"high-contrast"`, `"alert"`, `null`, `"none"`)
   - CSS Variable: `--recursica-ui-kit-components-{component}-alternative-layer`
   - Initial Value: From `UIKit.json` (typically `null` or `"none"`)
   - Behavior:
     - When set (not `null` and not `"none"`), overrides all surface and color props for that component
     - Uses alternative layer's properties: `--recursica-brand-{mode}-layer-layer-alternative-{altLayer}-property-*`
     - Disables toolbar icons for overridden props (handled by toolbar)
     - If `null` or `"none"`, behaves as normal (uses layer prop)
   - Implementation:
     ```typescript
     // In adapter component
     alternativeLayer?: string | null
     
     // In library implementation
     const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
     if (hasComponentAlternativeLayer) {
       const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
       // Override all color/surface props with alt layer properties
       bgVar = `${layerBase}-element-interactive-tone`
       textVar = `${layerBase}-element-interactive-on-tone`
       // ... etc
     }
     ```

**Important Notes:**
- These props use **separate CSS variables** specific to the component (not shared with other components)
- The CSS variable names follow the pattern: `--recursica-ui-kit-components-{component}-{property}`
- Use `getComponentLevelCssVar(componentName, 'elevation')` and `getComponentLevelCssVar(componentName, 'alternative-layer')` to generate the CSS variable names
- The toolbar provides controls for these props in a separate section (after dynamic props, before reset button)
- When `alternativeLayer` is set, it overrides all surface/color props, so those toolbar icons should be disabled

### Library CSS Variables

Library-specific CSS variables (e.g., `--mantine-color-*`, `--cds-*`, `--mui-*`) should:
- **NOT** be modified directly
- **ONLY** be used as fallbacks in `var()` functions
- Be documented in the component audit

## Testing Requirements

### Test File Structure

```
src/components/adapters/
├── {ComponentName}.test.tsx              # Adapter tests
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

### 4. Visual Regression Tests

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

### Audit File Location

**Each library must have its own audit file**:

```
src/components/adapters/
├── mantine/
│   └── {ComponentName}/
│       └── audit.md              # Mantine-specific audit
├── material/
│   └── {ComponentName}/
│       └── audit.md              # Material UI-specific audit
└── carbon/
    └── {ComponentName}/
        └── audit.md              # Carbon-specific audit
```

**File Path Pattern**: `src/components/adapters/{library}/{ComponentName}/audit.md`

**Do NOT create**:
- ❌ Global audit reports at the adapter root level
- ❌ Combined audit files covering multiple libraries
- ❌ Audit files outside the library's component folder

### Audit File Template

**File**: `src/components/adapters/{library}/{ComponentName}/audit.md`

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

## Running Audits

### Audit Process

**IMPORTANT**: Audits are **library-specific**. You must run audits **separately for each library** (Mantine, Material UI, Carbon). Each library has unique CSS variables, fallback chains, and implementation details that must be documented independently.

**Audit Steps**:

1. **Mantine Audit**: Analyze `mantine/{ComponentName}/` files
   - Review `mantine/{ComponentName}/Button.tsx`
   - Review `mantine/{ComponentName}/Button.css`
   - Document all Mantine-specific CSS variables
   - Save to: `mantine/{ComponentName}/audit.md`

2. **Material UI Audit**: Analyze `material/{ComponentName}/` files
   - Review `material/{ComponentName}/Button.tsx`
   - Review `material/{ComponentName}/Button.css`
   - Document all Material UI-specific CSS variables
   - Save to: `material/{ComponentName}/audit.md`

3. **Carbon Audit**: Analyze `carbon/{ComponentName}/` files
   - Review `carbon/{ComponentName}/Button.tsx`
   - Review `carbon/{ComponentName}/Button.css`
   - Document all Carbon-specific CSS variables
   - Save to: `carbon/{ComponentName}/audit.md`

**Do NOT create**:
- ❌ Global audit reports at the adapter root level
- ❌ Combined audit files covering multiple libraries
- ❌ Audit files outside the library's component folder

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
- [ ] Visual regression tests written
- [ ] All tests passing

### Audit

- [ ] **Mantine audit document created** at `mantine/{ComponentName}/audit.md`
- [ ] **Material UI audit document created** at `material/{ComponentName}/audit.md`
- [ ] **Carbon audit document created** at `carbon/{ComponentName}/audit.md`
- [ ] All Mantine library CSS variables documented in Mantine audit
- [ ] All Material UI library CSS variables documented in Material UI audit
- [ ] All Carbon library CSS variables documented in Carbon audit
- [ ] All Recursica CSS variables documented (in each library's audit)
- [ ] Uncovered variables identified and documented (in each library's audit)
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
- **Audits**: `src/components/adapters/{library}/Button/audit.md`

## Additional Resources

- **CSS Variable Utilities**: `src/components/utils/cssVarNames.ts`
- **Component Registry**: `src/components/registry/`
- **Testing Setup**: `vitest.setup.ts`
- **UIKit.json Structure**: `src/vars/UIKit.json`

## Questions?

If you're unsure about any aspect of component development:

1. Review the existing Button component implementation
2. Review the CSS Override Files section above for CSS override guidelines
3. Review the library-specific audit documents for examples:
   - `mantine/{ComponentName}/audit.md`
   - `material/{ComponentName}/audit.md`
   - `carbon/{ComponentName}/audit.md`
   
   **Note**: Each library has its own audit document - do not create global audit reports.
4. Consult the testing examples above
5. Ask for clarification before proceeding

