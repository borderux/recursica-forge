# UI Kit Component Architecture Plan

## Overview
Transform the app to render all UI components using the selected library (Mantine, Material UI, Carbon, etc.) with real-time CSS variable theming. The entire app, including the UI Kit preview page, should dynamically switch between libraries while maintaining consistent theming through CSS variables.

## Current State Analysis

### What Works
- ✅ Library switching for shell/layout (header, navigation)
- ✅ CSS variable system with `--recursica-*` prefix
- ✅ Real-time CSS variable updates
- ✅ UIKit.json defines component tokens (button, card, form, etc.)
- ✅ Three library shells implemented (Mantine, Material, Carbon)

### What Needs Work
- ❌ UI Kit page uses plain HTML/CSS instead of library components
- ❌ Components throughout the app don't use library components
- ❌ CSS variables aren't mapped to library theming systems
- ❌ No abstraction layer for component rendering
- ❌ Not extensible for new libraries

## Architecture Design

### 1. Component Abstraction Layer

Create a unified component interface that can render components from any library.

**Structure:**
```
src/
  components/
    adapters/
      Button.tsx          # Unified Button component
      Card.tsx            # Unified Card component
      TextField.tsx       # Unified TextField component
      ...                 # One adapter per component type
    providers/
      ComponentProvider.tsx  # Provides library-specific implementations
    registry/
      mantine.ts         # Mantine component implementations
      material.ts        # Material UI component implementations
      carbon.ts          # Carbon component implementations
```

**Component Adapter Pattern:**
Each adapter component:
- Accepts props in a library-agnostic format
- Uses `useUiKit()` to determine current library
- Renders the appropriate library component
- Maps CSS variables to library-specific props/styles

**Example:**
```tsx
// components/adapters/Button.tsx
export function Button({ variant, size, children, ...props }) {
  const { kit } = useUiKit()
  const Component = getButtonComponent(kit)
  return <Component {...mapPropsToLibrary(kit, props)}>{children}</Component>
}
```

### 2. CSS Variable → Library Theme Mapping

Each library has different theming approaches:
- **Mantine**: CSS variables + `MantineProvider` theme
- **Material UI**: `createTheme()` with theme object
- **Carbon**: CSS custom properties + `Theme` component

**Strategy:**
- Create theme generators for each library that read CSS variables
- Update themes reactively when CSS variables change
- Use CSS custom properties where possible (works for all libraries)

**Implementation:**
```tsx
// components/providers/ThemeProvider.tsx
export function UnifiedThemeProvider({ children }) {
  const { kit } = useUiKit()
  const cssVars = useCssVars() // Hook to watch CSS vars
  
  const theme = useMemo(() => {
    if (kit === 'mantine') return createMantineTheme(cssVars)
    if (kit === 'material') return createMaterialTheme(cssVars)
    if (kit === 'carbon') return createCarbonTheme(cssVars)
  }, [kit, cssVars])
  
  return <LibrarySpecificProvider theme={theme}>{children}</LibrarySpecificProvider>
}
```

### 3. Component Registry System

Create a registry that maps component names to library implementations.

**Structure:**
```tsx
// components/registry/types.ts
export type ComponentName = 'Button' | 'Card' | 'TextField' | 'Checkbox' | ...

export interface ComponentRegistry {
  [componentName: string]: React.ComponentType<any>
}

// components/registry/mantine.ts
export const mantineRegistry: ComponentRegistry = {
  Button: MantineButton,
  Card: MantineCard,
  TextField: MantineTextInput,
  ...
}

// components/registry/index.ts
export function getComponent(kit: UiKit, componentName: ComponentName) {
  const registry = kit === 'mantine' ? mantineRegistry 
                 : kit === 'material' ? materialRegistry
                 : carbonRegistry
  return registry[componentName]
}
```

### 4. UI Kit Page Transformation

Replace plain HTML components with library components using adapters.

**Current:** Plain HTML with inline styles
**Target:** Library components with CSS variable theming

**Components to Implement:**
Based on PreviewPage.tsx, we need adapters for:
- Accordion
- Avatar
- Badge
- Breadcrumb
- Button ✅ (UIKit.json has tokens)
- Card ✅ (UIKit.json has tokens)
- Checkbox
- Chip
- DatePicker
- Divider
- Dropdown/Select
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
- Radio
- ReadOnlyField
- Search
- SegmentedControl
- Slider
- Stepper
- Switch
- Tabs
- TextField ✅ (UIKit.json has form tokens)
- TimePicker
- Timeline
- Toast
- Tooltip
- TransferList

### 5. CSS Variable Integration Strategy

**Option A: Direct CSS Variable Usage (Recommended)**
- Use CSS variables directly in component styles
- Works across all libraries
- Real-time updates automatically
- Example: `style={{ backgroundColor: 'var(--ui-kit-button-color-background-solid)' }}`

**Option B: Theme Object Mapping**
- Map CSS variables to library theme objects
- More complex but better integration
- Requires reactive theme updates

**Hybrid Approach:**
- Use CSS variables for values that libraries support natively
- Use theme objects for libraries that require it (Material UI)
- Create CSS variable → theme mappers

### 6. Extensibility for New Libraries

**Plugin Architecture:**
```tsx
// components/registry/plugin.ts
export interface UiKitPlugin {
  name: UiKit
  components: ComponentRegistry
  themeProvider: React.ComponentType<{ theme: any; children: ReactNode }>
  createTheme: (cssVars: CssVarMap) => any
}

// Register new library
export function registerUiKit(plugin: UiKitPlugin) {
  registries[plugin.name] = plugin.components
  themeProviders[plugin.name] = plugin.themeProvider
  themeCreators[plugin.name] = plugin.createTheme
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. ✅ Create component adapter structure
2. ✅ Implement component registry system
3. ✅ Create unified theme provider
4. ✅ Implement CSS variable watcher hook
5. ✅ Create basic adapters for Button, Card, TextField

### Phase 2: Core Components (Week 2)
1. ✅ Implement all form components (TextField, Checkbox, Radio, Select, etc.)
2. ✅ Implement layout components (Card, Panel, Divider)
3. ✅ Implement navigation components (Breadcrumb, Tabs, Pagination)
4. ✅ Test CSS variable theming with each library

### Phase 3: Advanced Components (Week 3)
1. ✅ Implement complex components (Modal, Menu, Popover, Tooltip)
2. ✅ Implement data display (List, Timeline, Stepper)
3. ✅ Implement feedback components (Toast, Loader)
4. ✅ Update UI Kit page to use adapters

### Phase 4: Polish & Extensibility (Week 4)
1. ✅ Add plugin registration system
2. ✅ Document component API
3. ✅ Create example plugin for new library
4. ✅ Performance optimization
5. ✅ Testing across all libraries

## Technical Decisions Needed

### Questions for Discussion:

1. **Component API Design:**
   - Should adapters expose all library-specific props, or a simplified unified API?
   - How do we handle props that don't exist in all libraries?

2. **CSS Variable Mapping:**
   - Should we create a mapping file (UIKit.json → CSS vars → Library themes)?
   - Or should components directly read CSS variables?

3. **Performance:**
   - Should we lazy-load library code per component or per page?
   - How do we handle bundle size with multiple libraries?

4. **Styling Strategy:**
   - Use CSS variables directly in styles (simpler, works everywhere)?
   - Or map to library theme systems (more integrated, library-specific)?

5. **Component Coverage:**
   - Should we implement all components from PreviewPage immediately?
   - Or prioritize based on UIKit.json tokens (Button, Card, Form)?

6. **Library Provider Scope:**
   - Should each library's provider wrap the entire app?
   - Or only wrap components that need it?

7. **CSS Variable Naming:**
   - UIKit.json uses paths like `ui-kit.button.color.background-solid`
   - Should CSS vars be `--ui-kit-button-color-background-solid`?
   - Or keep current `--recursica-brand-*` pattern?

8. **Theme Mode (Light/Dark):**
   - UIKit.json has entries for both light (key "0") and dark (key "3")
   - How should we handle theme switching?
   - Should it be separate from library switching?

## Recommended Approach

### Component API: Unified with Library Extensions
```tsx
<Button 
  variant="solid"           // Unified prop
  size="default"            // Unified prop
  color="primary"           // Unified prop
  mantine={{ radius: 'xl' }}  // Library-specific extension
/>
```

### CSS Variables: Direct Usage with Fallbacks
```tsx
const buttonStyle = {
  backgroundColor: 'var(--ui-kit-button-color-background-solid, #000)',
  color: 'var(--ui-kit-button-color-text-solid, #fff)',
  borderRadius: 'var(--ui-kit-button-size-border-radius, 8px)',
}
```

### Theme Provider: Per-Library with CSS Variable Sync
- Each library provider watches CSS variables
- Updates theme object reactively
- Falls back to CSS variables for unsupported properties

### Component Registry: Lazy-Loaded
- Load library code only when needed
- Cache loaded libraries
- Support code splitting per library

## Next Steps

1. **Confirm approach** - Review questions above
2. **Start with Button component** - Implement adapter + all three libraries
3. **Test CSS variable theming** - Verify real-time updates work
4. **Iterate** - Expand to Card, TextField, then remaining components
5. **Document** - Create component API docs and plugin guide

## File Structure Preview

```
src/
  components/
    adapters/
      Button.tsx
      Card.tsx
      TextField.tsx
      Checkbox.tsx
      ...
    providers/
      UnifiedThemeProvider.tsx
      ComponentProvider.tsx
    registry/
      index.ts
      mantine.ts
      material.ts
      carbon.ts
      types.ts
    hooks/
      useComponent.ts
      useCssVars.ts
      useTheme.ts
  modules/
    preview/
      PreviewPage.tsx  # Updated to use adapters
```

