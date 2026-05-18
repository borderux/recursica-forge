---
"recursica-forge": patch
---

**Pagination toolbar variant selection & fixture sync**

- Fixed pagination toolbar not selecting the correct variant option on init; toolbar now correctly reflects the active CSS variable value on load
- Replaced hardcoded `Pagination.toolbar.json` config with a dynamic `componentExtensionToolbar` factory that auto-generates variant dropdowns and CSS variable orchestration from `recursica.component` extension tokens in `recursica_ui-kit.json`
- Added `componentToolbarUtils.ts` with shared helpers for the component extension toolbar pattern
- Updated `PropControlContent.tsx` to render virtual props and `h4` group headers for component extension groups
- Updated `loadToolbarConfig.ts` to route `recursica.component` tokens to the new factory
- Fixed pagination button layout: standardised icon-only approach so page number buttons clip correctly as squares/rounds; added `navDisplay` guard in `Pagination.tsx` to prevent UI breakage from stale CSS variable values
- Removed `boxShadow` from `recursica_brand.json` (replaced by `elevation` composite pattern)
- Synced all component test-export JSON fixtures (`accordion`, `avatar`, `badge`, `button`, `card`, `chip`, `hoverCardPopover`, `menu`, `modal`, `pagination`, `panel`, `segmentedControl`, `slider`, `switch`, `toast`, `tooltip`) to match the current `recursica_ui-kit.json` structure — preserving test values while adopting DTCG-compliant structural changes (elevation tokens converted from `$type: "elevation"` to `$extensions.recursica.type: "elevation"`, font tokens using generic DTCG primitive types)
- Fixed transform validators (`recursicaJsonTransformScoped`, `recursicaJsonTransformSpecific`): `collectVars` now skips tokens with `$extensions['recursica.component']` so component-reference pointers are never emitted as CSS vars or validated as scalar references
- Added `validateSchemas.test.ts` with schema compliance tests for all component fixtures; updated `validateJsonSchemas.ts` to support the revised schema shapes
