---
"recursica-forge": minor
---

## Tabs Component

- Add new Tabs adapter with variant support (default, pills, outline), orientation (horizontal, vertical), and placement options
- Add Mantine Tabs implementation with full theming via UIKit tokens, track/indicator alignment fixes, and masked gap for selected tab
- Add Tabs toolbar config and preview section in Components
- Replace MantineShell, Sidebar, ThemeSidebar, and FontPropertiesTokens tab instances with the Tabs adapter

## Component Updates

- **Suspense fallbacks**: Replace all styled/“Loading...” fallbacks with blank `<span />` across adapters (Accordion, Badge, Breadcrumb, Button, Checkbox, Chip, Dropdown, Label, Menu, MenuItem, SegmentedControl, Slider, Switch, Tabs, TextField, Toast, Tooltip, Avatar, AssistiveElement)
- **Layout**: Use blank fallbacks for shell and page loading states
- **Badge**: Fix intermittent styling loss; remove unused imports
- **Header**: Remove bottom border from app header (Mantine, Material, Carbon shells)
- **Sidebars**: Remove h3 headings from Tokens, Theme, and Components sidebars

## Toolbar & UIKit

- **updateUIKitValue**: Add tabs-content-gap path parsing; brand-dimensions var support; dimension-type `$value` handling; use `setUiKitSilent` to avoid overwriting toolbar color updates
- **varsStore**: Add `setUiKitSilent` for toolbar-driven updates without full recompute
- **PropControlContent**: Brand dimension slider and related prop handling improvements

## Other Fixes

- **jsonImport**: Fix `detectDirtyData` with `stableStringify` for key-order-independent comparison
- **Button tests**: Remove obsolete “Loading...” checks from `waitForButton` helpers
