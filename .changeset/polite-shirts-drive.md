---
"recursica-forge": patch
---

Accordion item token and toolbar refinements

- Replaced `padding` with `padding-horizontal` and `padding-vertical` dimension tokens in `accordion-item` properties; applied independently to header controls and content area across all three adapters (Mantine, Material, Carbon)
- Replaced `icon-size` with `icon-left-size` (custom title icon) and `icon-right-size` (chevron/expand icon); title icon now fills its container via `style` rather than a hardcoded `size` prop; widened `AccordionItem.icon` type to accept `style?: React.CSSProperties`
- Removed `content-padding` token; added `divider-size` (0–10px, default 1px) and `content-bottom-padding` tokens
- Added `header-content-gap` token; content area top padding now uses this instead of `padding-vertical`
- Toolbar: grouped `padding-horizontal`, `padding-vertical`, `header-content-gap`, and `content-bottom-padding` into a dedicated **Padding** section; grouped `icon-left-size` and `icon-right-size` under **Icon sizes**; added `divider-size` slider to the **Divider** section
- Extended `PaddingGroupToolbar` to render any extra dimension props in a padding group config beyond the standard horizontal/vertical/top-bottom-margin set, so new tokens appear automatically without further code changes
- Added `AccordionDividerSizeSlider` to `PropControlContent` for live editing of `divider-size`
- All three adapter CSS files: zeroed library default padding on item wrappers; divider borders use `var(--accordion-item-divider-size)`
