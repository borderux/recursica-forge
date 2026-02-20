---
"recursica-forge": patch
---

### Panel Component

- Added new Panel component (adapter, Mantine implementation, CSS, toolbar config, UIKit.json entry, and PanelPreview)
- Panel supports `overlay` mode with fixed positioning, `width`, `zIndex`, `position` (left/right), `title`, `onClose`, `footer`, and `layer` props
- Renamed `divider-thickness` to `divider-size` across UIKit.json, toolbar config, PanelPreview, and Mantine adapter
- Added `--panel-border-radius` CSS custom property to Mantine Panel for test accessibility
- Updated COMPONENT_DEVELOPMENT_GUIDE.md to allow literal px values for `border-size`, `divider-size`, `min-width`, `max-width`, `min-height`, `max-height`

### Panel Refactoring

- Replaced hand-built panel containers in TypeStylePanel, TypeTokensPanel, ElevationStylePanel, and LayerStylePanel with the new Panel component
- Removed ~200 lines of manual header/close button/elevation/border styling across 4 files
- Panel width set to 400px, min/max labels hidden on all panel sliders (`showMinMaxLabels={false}`)
- Fixed TypeTokensPanel blocking pointer events when closed (early return when `!open`)

### Test Fixes

- Updated Panel.toolbar.test.tsx to use current CSS variable names (`header-footer-horizontal-padding`, `header-footer-vertical-padding`, `header-close-gap`)
- Increased Accordion test timeouts to prevent flaky failures under full-suite load
