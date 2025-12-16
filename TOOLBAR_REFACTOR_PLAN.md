# Toolbar Refactoring Plan

## Overview
Refactor the toolbar system to improve organization and modularity by:
1. Moving toolbar into its own dedicated folder
2. Converting menu icons and floating palettes/menus into a reusable module

## Current Structure

### Files in `src/modules/components/`:
- `ComponentToolbar.tsx` - Main toolbar component
- `ComponentToolbar.css` - Toolbar styles
- `PropControl.tsx` - Floating palette for prop controls (color pickers, dimension selectors)
- `PropControl.css` - Prop control styles
- `VariantDropdown.tsx` - Dropdown menu for variant selection
- `LayerDropdown.tsx` - Dropdown menu for layer selection
- `AltLayerDropdown.tsx` - Dropdown menu for alt layer selection
- `Dropdown.css` - Shared dropdown styles
- `componentToolbarUtils.ts` - Utility functions for parsing component structure
- `propIconMapping.json` - Icon name mappings
- `iconUtils.ts` - Icon utility functions (shared, may stay in components)
- `iconLibrary.ts` - Icon library (shared, may stay in components)

## Proposed Structure

### New Folder: `src/modules/toolbar/`

```
src/modules/toolbar/
├── index.ts                          # Public API exports
├── ComponentToolbar.tsx              # Main toolbar component
├── ComponentToolbar.css              # Toolbar styles
│
├── menu/                             # Menu icons and floating palettes module
│   ├── index.ts                      # Menu module exports
│   ├── MenuIcon.tsx                  # Reusable menu icon button component
│   ├── MenuIcon.css                  # Menu icon styles
│   │
│   ├── floating-palette/             # Floating palette/menu system
│   │   ├── FloatingPalette.tsx       # Base floating palette component
│   │   ├── FloatingPalette.css       # Base floating palette styles
│   │   ├── PropControl.tsx           # Prop control floating palette
│   │   ├── PropControl.css           # Prop control styles
│   │   ├── ElevationControl.tsx      # Elevation control floating palette
│   │   └── types.ts                  # Shared types for floating palettes
│   │
│   └── dropdown/                     # Dropdown menu system
│       ├── Dropdown.tsx              # Base dropdown component
│       ├── Dropdown.css              # Dropdown styles
│       ├── VariantDropdown.tsx       # Variant selection dropdown
│       ├── LayerDropdown.tsx        # Layer selection dropdown
│       ├── AltLayerDropdown.tsx     # Alt layer selection dropdown
│       └── types.ts                  # Shared types for dropdowns
│
├── utils/                             # Toolbar-specific utilities
│   ├── componentToolbarUtils.ts      # Component structure parsing
│   └── propIconMapping.json          # Icon name mappings
│
└── hooks/                             # Toolbar-specific hooks (if needed)
    └── useToolbarState.ts             # State management hook (optional)
```

## Implementation Steps

### Phase 1: Create New Folder Structure
1. Create `src/modules/toolbar/` directory
2. Create subdirectories: `menu/`, `menu/floating-palette/`, `menu/dropdown/`, `utils/`

### Phase 2: Extract Menu Icon Component
1. Create `MenuIcon.tsx` - Reusable icon button component
   - Accepts: icon, active state, onClick handler, title/aria-label
   - Handles: active styling, click events, ref forwarding
   - Replaces: Individual icon button implementations in ComponentToolbar

### Phase 3: Extract Floating Palette System
1. Create `FloatingPalette.tsx` - Base floating palette component
   - Handles: positioning, dragging, click-outside detection, portal rendering
   - Accepts: anchor element, children, onClose, title
   - Replaces: Common logic in PropControl and elevation panel

2. Refactor `PropControl.tsx` to use `FloatingPalette`
   - Move to `menu/floating-palette/PropControl.tsx`
   - Use `FloatingPalette` as base component
   - Keep prop-specific logic (color controls, dimension selectors)

3. Extract elevation control to `ElevationControl.tsx`
   - Move elevation panel logic from ComponentToolbar
   - Use `FloatingPalette` as base component

### Phase 4: Extract Dropdown System
1. Create `Dropdown.tsx` - Base dropdown component
   - Handles: positioning, click-outside detection, open/close state
   - Accepts: trigger element, menu items, onSelect
   - Replaces: Common logic in VariantDropdown, LayerDropdown, AltLayerDropdown

2. Refactor dropdown components to use base `Dropdown`
   - Move to `menu/dropdown/` folder
   - Use `Dropdown` as base component
   - Keep component-specific logic (variant options, layer options, etc.)

### Phase 5: Move Toolbar Files
1. Move `ComponentToolbar.tsx` and `ComponentToolbar.css` to `toolbar/`
2. Move `componentToolbarUtils.ts` to `toolbar/utils/`
3. Move `propIconMapping.json` to `toolbar/utils/`

### Phase 6: Update Imports
1. Update all imports in `ComponentToolbar.tsx`:
   - Use relative imports for new structure
   - Import from `menu/` module for menu components
   - Import from `utils/` for utilities

2. Update imports in files that use `ComponentToolbar`:
   - `src/modules/preview/ComponentDetailPage.tsx`
   - Any other files importing the toolbar

### Phase 7: Create Module Exports
1. Create `toolbar/index.ts` - Export main toolbar component
2. Create `toolbar/menu/index.ts` - Export menu components
3. Create `toolbar/menu/floating-palette/index.ts` - Export floating palette components
4. Create `toolbar/menu/dropdown/index.ts` - Export dropdown components

### Phase 8: Clean Up
1. Remove old files from `src/modules/components/`
2. Update any remaining references
3. Verify all functionality works

## Component Relationships

```
ComponentToolbar
├── MenuIcon (for prop icons, elevation, reset)
│   └── Opens → FloatingPalette (PropControl, ElevationControl)
│   └── Opens → Dropdown (VariantDropdown, LayerDropdown, AltLayerDropdown)
│
├── VariantDropdown (extends Dropdown)
├── LayerDropdown (extends Dropdown)
├── AltLayerDropdown (extends Dropdown)
│
├── PropControl (extends FloatingPalette)
│   └── Uses → PaletteColorControl, DimensionTokenSelector
│
└── ElevationControl (extends FloatingPalette)
    └── Uses → TokenSlider
```

## Key Abstractions

### MenuIcon Component
A reusable icon button that:
- Renders an icon with consistent styling
- Handles active/inactive states
- Supports click handlers and ref forwarding
- Provides accessibility attributes (title, aria-label)
- Used by: All toolbar icon buttons (props, elevation, reset)

### FloatingPalette Component
A base component for floating panels that:
- Positions relative to an anchor element
- Supports dragging functionality
- Handles click-outside detection
- Renders via React portal
- Provides header with title and close button
- Used by: PropControl, ElevationControl

### Dropdown Component
A base component for dropdown menus that:
- Positions relative to trigger element
- Handles open/close state management
- Supports click-outside detection
- Provides consistent styling
- Used by: VariantDropdown, LayerDropdown, AltLayerDropdown

## Benefits

1. **Better Organization**: Toolbar code is isolated in its own folder
2. **Reusability**: Menu icons and floating palettes become reusable modules
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new menu types or floating palettes
5. **Type Safety**: Shared types for menu components
6. **DRY Principle**: Common functionality extracted into base components

## Considerations

1. **Icon Utilities**: `iconUtils.ts` and `iconLibrary.ts` may stay in `components/` if used elsewhere
2. **Shared Styles**: Some CSS variables and styles may need to remain accessible
3. **Backward Compatibility**: Ensure existing functionality is preserved
4. **Testing**: Verify all toolbar features work after refactoring

## Migration Checklist

- [ ] Create folder structure
- [ ] Extract MenuIcon component
- [ ] Extract FloatingPalette base component
- [ ] Refactor PropControl to use FloatingPalette
- [ ] Extract ElevationControl
- [ ] Extract Dropdown base component
- [ ] Refactor dropdown components
- [ ] Move toolbar files
- [ ] Update all imports
- [ ] Create module exports
- [ ] Test all functionality
- [ ] Clean up old files
- [ ] Update documentation

