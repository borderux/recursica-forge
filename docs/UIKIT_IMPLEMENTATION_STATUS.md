# UIKit Component Architecture - Implementation Status

## ✅ Completed

### 1. Component Adapter Infrastructure
- **Location**: `src/components/`
- **Files Created**:
  - `registry/types.ts` - Type definitions for components, layers, and library-specific props
  - `registry/index.ts` - Component registry with lazy loading
  - `registry/mantine.ts` - Mantine component registrations
  - `registry/material.ts` - Material UI component registrations
  - `registry/carbon.ts` - Carbon component registrations
  - `hooks/useComponent.ts` - Hook to get current library's component
  - `hooks/useCssVar.ts` - Hook for reactive CSS variable reading
  - `utils/cssVarNames.ts` - CSS variable name generation utilities
  - `utils/layerStyles.ts` - Layer-based styling utilities

### 2. Button Component Implementation
- **Location**: `src/components/adapters/`
- **Files Created**:
  - `Button.tsx` - Unified Button adapter component
  - `mantine/Button.tsx` - Mantine-specific implementation
  - `material/Button.tsx` - Material UI-specific implementation
  - `carbon/Button.tsx` - Carbon-specific implementation

**Features**:
- ✅ Supports `variant` prop (solid, outline, text)
- ✅ Supports `size` prop (default, small)
- ✅ Supports `layer` prop (layer-0, layer-1, layer-2, layer-3) with CSS cascading
- ✅ Supports library-specific props via `mantine`, `material`, `carbon` props
- ✅ Uses CSS variables for theming: `--recursica-ui-kit-components-button-*`

### 3. Unified Theme Provider
- **Location**: `src/components/providers/UnifiedThemeProvider.tsx`
- **Features**:
  - ✅ Wraps app with all library providers (Mantine, Material, Carbon)
  - ✅ Lazy loads providers to optimize bundle size
  - ✅ Ensures components can render regardless of selected kit

### 4. CSS Variable System
- **Naming Pattern**: `--recursica-ui-kit-components-{component}-{category}-{layer?}-{property}`
- **Examples**:
  - `--recursica-ui-kit-components-button-color-layer-0-background-solid`
  - `--recursica-ui-kit-components-button-size-default-height`
  - `--recursica-ui-kit-components-button-size-small-height`

### 5. PreviewPage Integration
- **Location**: `src/modules/preview/PreviewPage.tsx`
- **Status**: ✅ Button component now uses adapter
- **Next**: Update remaining components to use adapters

### 6. Missing Props Tracking
- **Location**: `src/vars/missing-props.txt`
- **Format**: Organized by component, listing missing props per library

## 🔄 In Progress / Next Steps

### 1. CSS Variable Generation from UIKit.json
**Status**: Not yet implemented
**Required**: 
- Create utility to read UIKit.json
- Generate CSS variables from UIKit.json structure
- Apply CSS variables to document root
- Handle light/dark mode switching (currently handled at app level)

**Files Needed**:
- `src/components/utils/generateCssVars.ts` - Generate CSS vars from UIKit.json
- Integration with existing CSS variable system

### 2. Remaining Component Adapters
**Status**: Button only implemented
**Components to Implement** (35 total):
- Card
- TextField (uses `ui-kit.form.*` tokens)
- Checkbox
- Radio
- Select/Dropdown
- Textarea
- Switch
- Chip
- Badge
- Avatar
- Accordion
- Breadcrumb
- DatePicker
- FileInput
- FileUpload
- Link
- Loader
- Menu
- Modal
- NumberInput
- Pagination
- Panel
- Popover
- ReadOnlyField
- Search
- SegmentedControl
- Slider
- Stepper
- Tabs
- TimePicker
- Timeline
- Toast
- Tooltip
- TransferList
- Divider
- List
- HoverCard

**Pattern to Follow**:
1. Create adapter component in `src/components/adapters/{Component}.tsx`
2. Create library implementations:
   - `src/components/adapters/mantine/{Component}.tsx`
   - `src/components/adapters/material/{Component}.tsx`
   - `src/components/adapters/carbon/{Component}.tsx`
3. Register in registry files
4. Update PreviewPage to use adapter

### 3. UIKit.json Structure Expansion
**Status**: Only Button has full structure
**Required**: 
- Add component definitions to UIKit.json for all 35 components
- Follow the pattern established for Button:
  ```json
  {
    "components": {
      "{component}": {
        "color": {
          "layer-0": { ... },
          "layer-1": { ... },
          "layer-2": { ... },
          "layer-3": { ... }
        },
        "size": {
          "default": { ... },
          "small": { ... },
          ...
        }
      }
    }
  }
  ```

### 4. Form Components Special Handling
**Status**: Not yet implemented
**Note**: Form components (TextField, Checkbox, etc.) use `ui-kit.form.*` tokens as defaults
- These should use form tokens from `ui-kit.form.field.*`, `ui-kit.form.label.*`, etc.
- Component-specific overrides can be added under `components.*`

## 📋 Architecture Overview

### Component Flow
```
User Code
  ↓
Adapter Component (e.g., Button.tsx)
  ↓
useComponent Hook
  ↓
Component Registry
  ↓
Library-Specific Implementation (mantine/material/carbon)
  ↓
CSS Variables (--recursica-ui-kit-components-*)
```

### CSS Variable Flow
```
UIKit.json
  ↓
CSS Variable Generator (to be implemented)
  ↓
Document Root CSS Variables
  ↓
Component Styles (via useCssVar hook)
```

### Layer System
- Components accept `layer` prop (default: "layer-0")
- CSS variables include layer in name: `...-layer-0-background-solid`
- CSS cascading handles layer overrides
- Example: `<Button layer="layer-1">` uses `...-layer-1-background-solid`

## 🐛 Known Issues / Considerations

1. **CSS Variable Generation**: Need to generate CSS vars from UIKit.json and apply them
2. **Theme Mode**: Light/dark mode switching needs to update CSS variable names or values
3. **Library Provider Loading**: All providers load even if not needed (acceptable for now)
4. **Component Lazy Loading**: Components are lazy-loaded but providers are not
5. **Missing UIKit.json Definitions**: Only Button has full structure defined

## 📝 Usage Example

```tsx
import { Button } from './components/adapters/Button'

function MyComponent() {
  return (
    <div>
      {/* Default layer-0 */}
      <Button variant="solid">Primary</Button>
      
      {/* Different layer */}
      <Button variant="solid" layer="layer-1">Secondary</Button>
      
      {/* Library-specific props */}
      <Button 
        variant="outline" 
        mantine={{ radius: 'xl' }}
        material={{ sx: { fontWeight: 'bold' } }}
      >
        Custom
      </Button>
    </div>
  )
}
```

## 🎯 Next Implementation Priority

1. **CSS Variable Generation** - Critical for theming to work
2. **Card Component** - Simple component, good for testing
3. **TextField Component** - Uses form tokens, important for forms
4. **Remaining Form Components** - Checkbox, Radio, Select, etc.
5. **Remaining Components** - Complete the full set

