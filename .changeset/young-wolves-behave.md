---
"recursica-forge": patch
---

Fix token assignment logic during component randomization:
- Color randomizer previously injected bare token color references (`{tokens.colors.*}`) into component state. All component-level color randomizations will now strictly assign semantic palette references (`{brand.palettes.*.color.tone}`) for consistent theming architecture.
- Font family and font style property randomization was occasionally skipping due to incomplete token matching. Added missing token path resolution for `{brand.fonts.*}` and improved regex matching for `font-style` to properly cycle through values during component randomization.
