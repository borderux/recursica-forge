---
"recursica-forge": patch
---

**FloatingPalette refactor & UI polish**

- Refactored `ColorPickerOverlay` and `OpacityPickerOverlay` from `Modal` to `FloatingPalette` (scroll-aware, non-sticky-header popover); updated all callers (`PaletteScale`, `ColorCell`, `ColorScale`, `ColorTokens`, `PaletteGridCell`) to pass `anchorElement: HTMLElement` instead of `swatchRect: DOMRect`
- Rewrote `FloatingPalette` to use forge design tokens: `genericLayerProperty`/`genericLayerText` for surface/border/text, `getElevationBoxShadow` + Modal component tokens for elevation and border-radius, `h3` typography for title, `Button` adapter for close action, and `data-recursica-layer="3"` for layer context propagation to children
- Fixed FloatingPalette positioning: `useLayoutEffect` post-render flip uses actual element height instead of a 200 px estimate, preventing overflow when anchored near the bottom of the viewport
- Removed hardcoded CSS from `FloatingPalette.css`; all theming is now inline via token helpers
- Slider (`Slider.css` + `Slider.tsx`): removed Mantine's default `padding-top/bottom` on `Slider-root` (reserved tooltip label space); added `disableTopBottomMargin={true}` to the internal `TextField` to zero the adapter facade's outer wrapper margin
- `ColorPickerOverlay`: wrapped HSV gradient and hue slider in a flex-column group with `general_default` gap; FloatingPalette body uses `general_sm` gap between top-level children
- `OpacityTokens` / `SizeTokens`: tightened slider row gap to `general_sm`
- `CompliancePage`: suppressed compliance-count tooltip when issue count is zero; fixed icon and link color tokens on the color-scales "used in" links
- `SidebarFooter` / `MantineShell`: compliance icon and status styling fixes
- Link adapter: corrected visited/hover color token references across Mantine, Material, and Carbon implementations
- Removed unused `.color-token-picker-overlay` and `.color-picker-overlay` CSS rules from `Modal.css`
