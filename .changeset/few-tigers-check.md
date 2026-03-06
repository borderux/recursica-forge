---
"recursica-forge": patch
---

Fix Panel z-index and add slide animation

- Fixed Panel overlay not appearing above toolbar controls (layer segmented control, theme toggle) by rendering overlay panels via React portal to `document.body`, escaping the sticky preview area's stacking context
- Added slide-in/out CSS animations to the Panel component's overlay mode, matching native drawer behavior with easeOut/easeIn cubic-bezier timing
- Moved overlay animation logic into the Panel component itself so all overlay panels (elevations, type styles, layers, panel preview) animate consistently
- Removed "Edit Type Tokens" button and associated panel from the Type page
- Centered the panel preview in its container on the Panel component detail page
- Updated panel preview title from "Right panel" to "Goblin's Rest" and overlay title to "The Crystalline Abyss"
