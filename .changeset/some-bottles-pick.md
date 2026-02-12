---
"recursica-forge": patch
---

Added NumberInput component with full integration across all UI libraries (Mantine, Material UI, Carbon).

**New Component:**
- Created NumberInput adapter component with support for all TextField features (label, placeholder, help text, error text, leading/trailing icons, states, layouts)
- Implemented library-specific versions for Mantine, Material UI, and Carbon Design System
- Added number-specific props: min, max, step, defaultValue

**Configuration:**
- Added NumberInput entry to UIKit.json with global form token references
- Configured variants for states (default, error, focus, disabled) and layouts (stacked, side-by-side)
- Created NumberInput.toolbar.json for toolbar controls

**Registration & Integration:**
- Registered component in all three UI library registries
- Added comprehensive NumberInputPreview component showing multiple states, layouts, and icon variations
- Integrated preview in ComponentDetailPage with toolbar support

**Toolbar & Export:**
- Wired up export and randomization functionality alongside TextField
- Added NumberInput handling in BorderGroupToolbar for proper border property resolution
- Added NumberInput to PropControlContent for dimension sliders and property controls
- Ensured all toolbar controls work correctly with variant-specific properties
