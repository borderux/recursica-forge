---
"recursica-forge": patch
---

## Avatar — remove redundant `properties.size` token

### Background
The `sizes` variant group (`small` / `default` / `large`) previously had three dimension tokens under `properties`: `size`, `width`, and `height`. The `size` token predated the addition of separate `width` and `height` tokens and was left in place as a duplicate.

### Changes

**`recursica_ui-kit.json` and `src/components/test-exports/avatar.json`**
Removed the `"size"` property token from `variants.sizes.small.properties`, `variants.sizes.default.properties`, and `variants.sizes.large.properties` in both files.

**Avatar adapters (Mantine, Carbon, Material)**
- Removed the dangling `--avatar-size` CSS custom property that was being set but never consumed by any CSS rule (CSS only ever read `--avatar-width` and `--avatar-height`).
- Material UI adapter: switched `sx.width` and `sx.height` from `var(properties.size)` to `var(properties.width)` / `var(properties.height)`.

**Timeline consumers**
Four files that derived avatar bullet sizing from `Avatar > variants > sizes > {size} > properties.size` were updated to use `properties.width` instead:
- `adapters/mantine/Timeline/Timeline.tsx`
- `modules/components/TimelinePreview.tsx`
- `modules/components/TimelineBulletPreview.tsx`
