---
"recursica-forge": patch
---

- **Fix Token Ref Generation:** Updated `recursica_tokens.json` alias to standardize `line-through` (previously `strikethrough`) eliminating DTCG cross-file validation misses. Added new `line-through` injection constraints directly across Randomizer iteration maps for UI consistency.
- **Fix Component Icon Sizing Sliders:** Updated dynamic dimensional mapping conditionals strictly verifying both `icon` and `size` parameters to automatically bridge properties like `icon-left-size` accurately into `{brand.dimensions.icon-size.X}` dependencies securely, bypassing generic dimension scales. 
- **Cleanup Redundant Border Controls:** Extracted legacy decoupled `item-border-radius` mappings fully off CSS binding configurations (Carbon, Material, Mantine), the `AccordionItem.toolbar.json`, and the local `recursica_ui-kit.json` resolving toolbar overlap redundancies.
