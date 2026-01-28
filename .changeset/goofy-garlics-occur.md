---
"recursica-forge": patch
---

Accordion component implementation and enhancements:

- Split Accordion into container (Accordion) and item (AccordionItem) components, similar to Menu/MenuItem structure
- Added AccordionItem to ComponentName type and navigation sidebar
- Fixed icon-size dimension category for AccordionItem to use 'icons' instead of 'general'
- Fixed border-radius visibility for AccordionItem by applying it to control elements
- Added header-content-gap property to AccordionItem with slider control in divider group
- Added elevation property to AccordionItem with reactive toolbar control
- Fixed Accordion container border-radius to apply to the same element as the border
- Added padding slider to Accordion container (defaults to none)
- Added min-width (20-200px) and max-width (100-1500px) pixel sliders to Accordion container
- Changed Accordion item-gap default from vertical gutter to none
- Fixed Accordion preview to render all items in a single container instead of separate components
- Updated all test cases to properly handle both Accordion (container) and AccordionItem (item) components
- Separated toolbar configurations: Accordion.toolbar.json for container properties, AccordionItem.toolbar.json for item properties
