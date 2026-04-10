---
"recursica-forge": minor
---

### Component-level WCAG AA compliance checker

- Added a data-driven scanner (`checkComponentTextColors`) to `ComplianceService` that validates text and icon foreground colors against their backgrounds for form fields, buttons, chips, badges, accordion items, and menu items across all layers and modes, skipping disabled states
- Grouped component compliance issues by component name on the compliance page (e.g., separate sections for Chip, Button, Badge) with per-group issue count badges
- Replaced the toolbar `⚠` warning icon with a clickable contrast ratio link (e.g., "3.21:1") styled in the alert color that navigates directly to the compliance page
- Added anchor-scroll deep linking: clicking a compliance issue row's location link navigates to the component page with the correct variant and layer pre-selected via query params (`?style=`, `?states=`, `?layer=`)
- Added a gold highlight animation on the target compliance row when navigated to via anchor link
- Formatted location labels in sentence case without hyphens for readability (e.g., "Error selected / Layer 2" instead of "error-selected / layer-2")
