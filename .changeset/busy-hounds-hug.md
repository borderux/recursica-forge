---
"recursica-forge": patch
---

Add Textarea component with full library support and toolbar integration

- New Textarea adapter component with Mantine, Material, and Carbon implementations
- Supports stacked and side-by-side layouts, state variants (default, focus, disabled, error, read-only), and layer-based theming
- Configurable rows (integer, range 2–20), min-width (64–400px), max-width (400–1000px), placeholder opacity, border, padding, and text styling
- UIKit.json entry with global form refs for shared properties (border, padding, colors) and component-specific properties (rows, min/max width, placeholder opacity)
- Toolbar config with Colors (background, text, placeholder opacity), Border, Padding, Size (rows, min/max width), Text style, and Top/bottom margin sections
- Textarea preview page with stacked and side-by-side layout examples, sample values, and placeholder states
- Registered in component sidebar, detail page routing, and all three library registries
- Generic slider now supports unitless values for `$type: "number"` properties (e.g., rows displays "4" not "4px")
- Max-width uses a hardcoded px slider (400–1000) instead of a global form token reference
