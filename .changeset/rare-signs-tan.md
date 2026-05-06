---
"recursica-forge": patch
---

Fixes and improvements for Chip component rendering across all framework adapters (Mantine, Material, Carbon):
- **Prevented Icon Clipping**: Addressed layout issues where increasing the `icon-text-gap` or utilizing specific descenders would clip icons on the left/right boundaries. Swapped margin-based spacing for flex `gap` to create cleaner inner layouts.
- **Dynamic Centering & Spacing**: When `min-width` is greater than the chip's inner content, the text label will now naturally expand to fill the available space, centering the text while ensuring leading and trailing icons are pushed out toward the far edges.
- **Text Wrapping & Truncation**: Forced aggressive `display: block` and `white-space: nowrap` rules on all text-bearing elements. The chip text will strictly remain on one line and cleanly truncate with an ellipsis if it runs out of space, rather than wrapping onto two lines.
- **Checkmark Gap Logic**: Fixed an issue where the `icon-text-gap` wasn't being correctly applied to the checkmark if the user had not explicitly configured a leading icon.
