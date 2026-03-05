---
"recursica-forge": minor
---

All core components are now feature complete.

### Fixes & Improvements

- **Timeline**: Fixed right-aligned timeline layout issues (itemTitle/itemContent display, itemBody flex alignment). Added `title-description-gap` and `description-timestamp-gap` spacing tokens to the toolbar. Removed non-existent `item-gap` property reference from TimelineBulletPreview.

- **CSS Variable Audit Fixes**: Removed references to non-existent text properties (`letter-spacing`, `font-style`, `text-decoration`, `text-transform`) in CheckboxItem and RadioButtonItem adapters across Mantine, Material, and Carbon. Fixed PanelPreview typography variables (`letter-spacing` → `font-letter-spacing`).

- **Icon Library**: Added `Fire`, `Tree`, `Shield`, `Crown`, `Lightning`, `Sparkle`, `Sword`, and `Hammer` Phosphor icons to the icon library. Removed duplicate `TextAUnderline` import.

- **Preview Icon Updates**: Replaced inline SVG arrow icons with contextual Phosphor icons across ButtonPreview, ChipPreview, SegmentedControlPreview, SegmentedControlItemPreview, and TabsPreview. Icons now match their associated text labels (e.g., Forge→fire, Mines→diamond, Armory→shield, Treasury→crown).

- **Goblin Text Updates**: Updated AccordionPreview, AccordionItemPreview, and ButtonPreview with thematic goblin-flavored sample content.

- **Removed "Show Unmapped" Feature**: Removed the toggle and related filtering logic from ComponentsSidebar, ComponentToolbar, and PreviewPage as it was non-functional.

- **Test Fix**: Fixed TransferList toolbar test (`renders items in correct panes`) by wrapping checkbox assertion in `waitFor` to account for Suspense lazy-loading.
