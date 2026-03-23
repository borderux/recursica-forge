---
"recursica-forge": minor
---

Custom variant support: fix component adapters and preview components so user-created state/layout/style/size variants work correctly across all components.

**Runtime fixes:**
- TransferList: remove hardcoded `stateName` fallback that mapped custom states to `'default'`, causing border-size, border-color, background, and header-color to always read from the default state's CSS vars instead of the custom state's
- 7 field preview components (TextField, Textarea, TimePicker, DatePicker, FileUpload, FileInput, CheckboxGroup): `layoutsToShow` was hardcoded to `['stacked', 'side-by-side']`, ignoring `selectedVariants.layouts`; custom layout variants now show in the preview
- 6 field preview components (TextField, Textarea, TimePicker, DatePicker, FileUpload, FileInput): state-conditional rendering blocked display of custom states entirely; added fallback render block so custom state variants show the component with their CSS vars applied

**Type widening:**
- 14 wrapper adapter files: widened `layout?: 'stacked' | 'side-by-side'` to `layout?: string` and `state?: '...' | '...'` to `state?: string` so custom variant names pass TypeScript without type casts
- `Link.tsx`: widened `forceState` to accept custom state variant names
- `ComponentToolbar.tsx`: hide "Add variant" button for zero-variant components; fix variant axis filter to show newly created single-variant axes
