---
"recursica-forge": patch
---

Fix WCAG AA compliance fixes not persisting when palette scales or core colors are updated.

**`updateBrandValue`: wrong JSON write location**
The core bug — `cssVarToRef()` strips `themes.{mode}.` from brand references for component theme-agnosticism. `updateBrandValue` was using its output directly as the JSON navigation path, so writes landed at `brand.palettes.core-colors.*` (a non-existent node) instead of the correct `brand.themes.dark.palettes.core-colors.*`. Every fix was silently discarded, and `recomputeAndApplyAll` restored the original failing value on the next cycle. Fixed by reusing `cssVarToRef`'s battle-tested de-flattening rules (which also correctly resolves `elements_text-alert` → `elements.text.alert`, etc.) and then re-injecting the mode segment before navigation. Missing path segments now abort the write rather than auto-creating spurious nodes.

**`ComplianceService`: invalid suggestion value format**
When black or white was not an exact token-index match, `tryBlackWhiteTokens` generated a `{brand.themes.light.palettes.core-colors.white}` DTCG reference as the suggestion value. `validateCssVarValue` only accepts `var()` format, so the fix was silently rejected by `updateCssVar`. Fixed to emit a proper `var(--recursica_brand_themes_...)` reference via `paletteCore()`.

**`ComplianceService`: conflicting high/low emphasis suggestions**
High-emphasis and low-emphasis compliance issues for the same CSS var each generated independent suggestions. Applying them in sequence caused the last write to undo the first. Fixed by suppressing the low-emphasis issue when a high-emphasis issue already covers the same CSS var, and by threading an `otherEmphasisOpacity` constraint through `findBestPassingColor` and `tryBlackWhiteTokens` so that any generated suggestion is guaranteed to satisfy both emphasis levels simultaneously.
