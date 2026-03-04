---
"recursica-forge": patch
---

Add Transfer List component

- New Transfer List component built from Recursica primitives (TextField, CheckboxItem, CheckboxGroup, Badge, Button, Label)
- Supports stacked and side-by-side layouts with transfer actions between source and target panes
- Searchable/filterable item lists with grouped items and item counts via Badge
- Toolbar controls for border (size, radius, color), box (background, header color, title heading level), dimensions (box gap, title-filter gap, filter-items gap, height, width), and padding (horizontal, vertical)
- Height and width sliders with 200–500px range per pane
- State variants: default, focus, error, disabled
- Layer support (layer-0 through layer-3) with per-layer color tokens
- Top/bottom margins for both stacked and side-by-side layouts
- Preview page with centered layout and assistive text for all non-error states
- Toolbar and component rendering tests
