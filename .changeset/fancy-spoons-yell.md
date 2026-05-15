---
"recursica-forge": patch
---

## Component reset — consistent snapshot resolution

### Bug
Clicking "Reset" on a component (to either last imported version or Forge defaults) had no visible effect when the user had made changes and the store contained edited brand or token values.

### Root cause
`handleReset` called `buildUIKitVars(tokensJson, brandJson, sourceUikit, mode)` using the **live, edited** `tokensJson` and `brandJson` from component props. UIKit tokens reference brand paths such as `{brand.palettes.neutral.500.color.tone}`, so resolving them against an edited brand produced the same edited values even when `sourceUikit` was the pristine or imported JSON. The computed "defaults" matched the current store state, making the reset a no-op.

### Fix
`handleReset` now resolves all three JSON sources — UIKit, brand, and tokens — from the same version snapshot:

| Target | UIKit | Tokens | Brand |
|---|---|---|---|
| Reset to last imported | `getImportedUikit()` | `getImportedTokens()` | `getImportedBrand()` |
| Reset to Forge defaults | `getPristineUikit()` | `getPristineTokens()` | `getPristineBrand()` |

Three new getters were added to `VarsStore`: `getImportedBrand()`, `getImportedTokens()`, and `getPristineTokens()`, completing the set alongside the existing `getImportedUikit()`, `getPristineUikit()`, and `getPristineBrand()`.
