---
"recursica-forge": patch
---

- Combined "Hover card" and "Popover" into a single component page/link in the left nav, with a route redirect from `/components/popover` to `/components/hover-card`
- Fixed dark mode text visibility issues
- Replaced the "Read docs" anchor tag with the Button adapter component on the component detail page
- Replaced raw HTML radio inputs with the RadioButtonItem adapter component on the layers page
- Fixed palette toast notification after adding a palette, with a scroll-to action
- Replaced the ellipsis menu Dropdown with Menu and MenuItem adapter components in PaletteGrid
- Fixed the Panel close button styling
- Fixed the Modal close button styling
- Fixed the color delete button in the floating color palette
- Updated floating color palette behavior
- Replaced raw file input in the Import modal with the FileUpload adapter component across all shells
- Replaced raw checkbox in the AA compliance modal with the CheckboxItem adapter component; renamed title to "WCAG AA Issues"
- Simplified Import modal header to "Import", label to "JSON File(s)", and help text to "tokens.json, brand.json, and/or uikit.json only"
