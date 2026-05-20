---
"recursica-forge": minor
---

## Adapter isolation & multi-library visual parity

### Cross-library isolation
- Removed all cross-library prop references from component adapters — Material adapters no longer accept `carbon` props, Carbon adapters no longer accept `mantine`/`material` props, and vice versa. Each adapter is now strictly typed to its own library's pass-through props only.
- Removed dead Tabs variant logic that referenced other library implementations.

### Visual parity fixes (Material UI & Carbon)
- **Button:** Fixed `sizePrefix` mapping (`small`/`default` tokens instead of `sm`/`lg` aliases) so icon-only buttons render at the correct size in all three libraries. Added missing `icon-label` content variant support.
- **Badge:** Applied `align-self: flex-start` and `width: fit-content` to prevent Badge stretching inside flex containers in Material and Carbon shells.
- **Tabs:** Fixed `tabContentAlignment` missing from `TabsContextValue` interface; font treatment (case, alignment) and border-radius tokens now apply correctly.
- **Dropdown:** Resolved `ReferenceError: material is not defined` crash in the Mantine Dropdown adapter caused by a stale cross-library reference.
- **SegmentedControl (Material):** Added CSS overrides for `.MuiToggleButtonGroup-grouped` first/last-of-type selectors that were overriding token-driven `border-radius` with MUI's built-in group rounding.
- **Switch (Carbon):** Aligned CSS custom property names between the TSX wrapper and the Carbon Toggle CSS overrides. Wrapper now injects `--switch-*` local properties for track/thumb sizing, colors, elevation, and border-radius; the CSS references these consistently.
- **Shell nav buttons:** Fixed broken `border-radius` token path in both `MaterialShell` and `CarbonShell` — replaced `getComponentCssVar('Button', 'size', 'border-radius')` (non-existent path) with `buildComponentCssVarPath('Button', 'variants', 'content', 'label', 'variants', 'sizes', 'default', 'properties', 'border-radius')`.
- **CarbonShell action buttons:** Changed `size='default'` to `size='small'` for Reset/Import/Export buttons to match Mantine and Material shells.

### Codebase cleanup
- Removed `PropControlContent.tsx` legacy implementation (5 000+ lines of dead code).
- Removed `StyledSlider.tsx` standalone component in favour of the `Slider` adapter.
- Cleaned up `RandomizerResults.tsx`, `FontPropertiesTokens.tsx`, `TabsPreview.tsx`, and `ThemeSidebar.tsx`.
- Fixed `useComponent` hook to resolve lazy imports more reliably.

### Kit locked to Mantine (temporary)
- `UiKitContext` now hardcodes `kit = 'mantine'` and makes `setKit` a no-op while multi-library visual parity work continues.
- Library switcher `<Dropdown>` hidden from the `MantineShell` header until re-enabled.
- Accordion integration tests for Material and Carbon marked `.skip` to match the locked kit.
