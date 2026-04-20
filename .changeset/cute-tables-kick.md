---
"recursica-forge": patch
---

## Compliance: Suggest Tones — fix on-tone evaluation

**`SuggestTonesModal.tsx`** — removed the `issue.rawOnToneHex` pin from the `generateSuggestedTones` call. Passing the failing tone's on-tone hex was forcing every candidate to be evaluated against that fixed color, which always produced "black" as the best on-tone. Candidates are now evaluated independently, allowing the engine to pick the optimal on-tone (black or white) for each suggested tone.

## Compliance: Component text suggestions — fix suggestion generation & persistence

**`ComplianceService.ts`** — two related fixes to `checkComponentTextColors`:

1. **Suggestions were always `null`** — all five component scan blocks (form fields, button, chip/badge, accordion item, menu item) were hardcoded to `suggestion: null`. Each block now calls `generateSteppedColorSuggestion`, surfacing actionable Fix buttons for component text and icon contrast failures.

2. **Fixes were overwritten on rebuild** — component suggestions were targeting UIKit CSS vars (e.g. `--recursica_ui-kit_themes_light_components_chip_...close-icon-color`). These vars are regenerated on every `recomputeAndApplyAll`, silently reverting any applied fix. Added a `resolveToBrandVar` helper that walks one chain level: if the UIKit fg var's computed value is a `var(--recursica_brand_...)` reference (e.g. `interactive-tone`, `text-color`), the suggestion now targets that brand var instead. This means:
   - `applyFixToThemeCopy` persists the change to the theme JSON
   - `buildLayerVars` re-reads the updated JSON on the next rebuild
   - The UIKit component var continues to chain through to the corrected brand value automatically
   - A brand-level fix (e.g. fixing `interactive-tone`) simultaneously clears all downstream component issues that reference the same var, so a rescan after a layer fix correctly shows zero chip/button issues

## Compliance page: layout restructuring

**`CompliancePage.tsx` / `CompliancePage.css`** — restructured the issue list into two clearly-delineated sections:

- **h2 "Theme"** — contains palette on-tone, core color, layer text, and layer interactive groups (in that fixed order), each rendered as an **h3** heading + table
- **h2 "Components"** — contains one **h3** + table per component (chip, button, accordion item, etc.)
- Either section is omitted entirely when it has no issues
- Table rendering extracted into a `renderGroup` helper to avoid duplication

**Spacing tokens applied:**
- `general_lg` gap between each h3 heading and its table
- `general_xl` `margin-bottom` below each table's border box (outside the border, not inside)
- `general_2xl` `margin-top` on the Components section when it follows the Theme section (via adjacent-sibling selector)
