---
"recursica-forge": patch
---

**Tooltip Component Enhancements & Unified Tooltip Styling**

This release introduces significant improvements to the Tooltip component and establishes unified tooltip styling across the entire application.

### New Features

- **Min-height Control**: Added configurable `min-height` property to Tooltip component
  - Exposed in toolbar under "Dimensions" section
  - Persists to UIKit.json for theme consistency
  - Applies to all tooltip instances across the app

- **Vertical Text Centering**: Tooltips now use flexbox for perfect vertical and horizontal text alignment
  - `display: flex`, `align-items: center`, `justify-content: center`
  - Ensures consistent text positioning regardless of tooltip height

### Unified Tooltip Styling

- **Slider Tooltips**: Mantine slider thumb tooltips now use the same CSS variables as the unified Tooltip component
  - Consistent colors, typography, padding, borders, and dimensions
  - Affects all sliders: dimensions, typography, opacity, layers, elevation, etc.
  - Replaces unstyled native browser tooltips with premium styled tooltips

- **SegmentedControl Tooltips**: Updated custom tooltip implementation to use Tooltip component's CSS variables
  - Icon-only segmented controls (e.g., theme mode switcher) now have consistent tooltip styling
  - Removed hardcoded brand layer variables in favor of centralized Tooltip styling

### Technical Improvements

- **Centralized Control**: All tooltips can now be styled from a single source (Tooltip component toolbar)
- **Theme Awareness**: Tooltips automatically adapt to light/dark mode changes
- **Persistence**: Tooltip styling persists across sessions via UIKit.json
- **Consistency**: Uniform appearance across all tooltip types (component tooltips, slider tooltips, segmented control tooltips)

### Files Modified

- `src/vars/UIKit.json`: Added min-height property to Tooltip definition
- `src/components/adapters/mantine/Tooltip/Tooltip.tsx`: Added min-height support and reactive listeners
- `src/components/adapters/mantine/Tooltip/Tooltip.css`: Added vertical centering and min-height styles
- `src/modules/toolbar/configs/Tooltip.toolbar.json`: Added min-height control to toolbar
- `src/components/adapters/mantine/Slider/Slider.css`: Added unified tooltip styling for slider labels
- `src/components/adapters/mantine/SegmentedControl/SegmentedControl.tsx`: Updated to use Tooltip CSS variables
- `src/core/css/updateUIKitValue.ts`: Fixed imports and enhanced path parsing
- `src/modules/pickers/PaletteSwatchPicker.tsx`: Integrated updateUIKitValue for color persistence

### Migration Impact

This change improves UX across the entire application by providing consistent, professional tooltip styling. All existing tooltips continue to work without breaking changes, but now benefit from the unified styling system.

