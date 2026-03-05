---
"recursica-forge": patch
---

Add Timeline and Timeline Bullet components

- Add new Timeline component (Mantine adapter) with left-aligned and right-aligned layouts
- Add Timeline Bullet component with four variants: default (dot), icon, icon-alternative, and avatar
- Avatar bullet size dynamically maps to Avatar component size variants (small, default, large)
- Active/inactive states with separate opacity, background, border, and icon color tokens per bullet variant
- Connector (line) styling with active/inactive colors and configurable thickness
- Title, description, and timestamp text sections with independent text style and color controls per layer
- Spacing controls: title-description gap, description-timestamp gap, bullet-content gap, and max text width
- Toolbar configs for both Timeline and Timeline Bullet with grouped controls (connector, colors, spacing, text styles, dimensions, avatar, border, background)
- Reset for Timeline and Timeline Bullet operates independently
- Bullet column auto-sizes to the widest bullet variant; bullets and connectors are centered within the column
- Right-aligned layout: text right-aligned with constrained max-width, bullets and connectors on the right
- Unitless CSS variable resolution for opacity and scale properties in the UIKit resolver
- Icon-alternative bullet colors updated to use neutral palette references
- Avatar bullet colors updated to use palette-2 references
