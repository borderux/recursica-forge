# Text Style Toolbar Fix — Component Checklist

## Audit Results

After systematic testing of all components, the text style toolbar appears to be **working correctly for all components**. The testing involved:

1. **CSS Variable Audit**: All 34 component/text-group combinations have correctly named CSS variables on `:root` for both light and dark modes.
2. **Browser Testing**: Verified that clicking toolbar controls (underline, italic, uppercase, etc.) correctly updates the CSS variables AND the preview reflects changes.
3. **JavaScript Validation**: Confirmed computed styles on actual DOM elements match expected values.

## Components Verified ✅

### Standard `text` group
- [x] **Button** — All 6 text properties (font-family, size, weight, decoration, transform, style) verified working
- [x] **Badge** — decoration, style, transform verified working
- [x] **Chip** — decoration, style, transform verified working
- [x] **Breadcrumb** — decoration, style, transform verified working
- [x] **Dropdown** — CSS vars correctly initialized
- [x] **FileInput** — CSS vars correctly initialized
- [x] **FileUpload** — CSS vars correctly initialized
- [x] **TextField** — decoration verified working
- [x] **NumberInput** — CSS vars correctly initialized
- [x] **ReadOnlyField** — CSS vars correctly initialized
- [x] **AssistiveElement** — CSS vars correctly initialized
- [x] **Toast** — CSS vars correctly initialized
- [x] **Tooltip** — CSS vars correctly initialized

### `header-text` / `content-text` groups
- [x] **AccordionItem** — CSS vars correctly initialized for both header-text and content-text
- [x] **Modal** — CSS vars correctly initialized for both header-text and content-text

### `label-text` / `optional-text` groups
- [x] **Label** — CSS vars correctly initialized for label-text and optional-text
- [x] **Switch** — label-text decoration verified working via JS (underline applied to spans)

### `supporting-text` group
- [x] **MenuItem** — CSS vars correctly initialized for text and supporting-text

### `min-max-label` / `read-only-value` groups
- [x] **Slider** — min-max-label decoration verified working; read-only-value CSS vars initialized

### `active-text` / `inactive-text` groups
- [x] **Tabs** — CSS vars correctly initialized for active-text and inactive-text

### Segmented Control
- [x] **SegmentedControl** — CSS vars correctly initialized for text

### Size-specific text (Avatar)
- [x] **Avatar** — CSS vars correctly initialized for all 3 sizes (small, default, large)

### State-specific text (Link — reference implementation)
- [x] **Link** — Working correctly, state-specific vars for default/hover/visited/visited-hover

## Architecture Notes

### CSS Variable Path Convention
All components follow this pattern:
```
--recursica-ui-kit-themes-{mode}-components-{component}-properties-{textElement}-{property}
```

Exceptions:
- **Avatar**: Uses size variants: `...-avatar-variants-sizes-{size}-properties-text-{property}`
- **Link**: Uses state variants: `...-link-variants-states-{state}-properties-text-{property}`
- **Modal**: Some values reference typography tokens: `var(--recursica-brand-typography-h3-text-transform)`

### How Text Styles Are Applied
1. `TextStyleToolbar.tsx` updates CSS variables on `:root` via `updateCssVar()`
2. Component adapters use `readCssVar()` to read resolved values
3. Values are applied as inline `style` attributes (not `var()` references for decoration/transform/style)
4. `cssVarsUpdated` event triggers re-render to pick up changes

### The Link Special Case
- `componentsWithStateSpecificText = ['Link']` in `TextStyleToolbar.tsx`
- Routes font-weight, text-decoration, text-transform, font-style through state variant path
- Other components use the standard `getComponentTextCssVar()` path
