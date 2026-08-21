/**
 * Mantine Component Registry
 *
 * Registers the REAL published adapter, @recursica/mantine-adapter, as the
 * Mantine implementation for every component Forge previews.
 *
 * Every entry points at a local wrapper file under src/components/adapters/mantine/ — one
 * folder per component, exactly like registry/material.ts and registry/carbon.ts. Most of
 * those wrappers are a trivial one-line pass-through (the adapter's own shape already
 * matches Forge's); a handful (Accordion, Dropdown, Panel, SegmentedControl) do real
 * translation because their Forge shape differs *structurally* from the adapter's own
 * (composition API vs. data-driven `items`, or a `data` array with different field names).
 * See each wrapper file for its specific case.
 *
 * Forge's local hand-written Mantine implementations (the pre-migration contents of that
 * same folder) have been deleted. There is deliberately no fallback implementation: a
 * component with no upstream equivalent stays unregistered, so `getComponent` returns null
 * and `useComponent` renders its generic NoAdapterImplementation box instead. That visible
 * "not implemented" signal is honest; a local implementation quietly filling in would make
 * an unwired prop look wired.
 *
 * The adapter styles itself purely from --recursica_* custom properties, so editing a
 * token in Forge should move the real component. Where it doesn't, the prop isn't wired
 * up in the adapter — which is the whole point of pointing Forge at the real thing.
 * Run `npm run report:adapter-wiring` for the exhaustive list.
 */

import { registerComponent } from './index'

// ─── Structural mismatches ───────────────────────────────────────────────────
// Forge's shape differs structurally from the adapter's, so the wrapper does real
// translation (composition API, `items` → `data`, etc.) — see each file for its case.

registerComponent('mantine', 'Accordion', () => import('../adapters/mantine/Accordion/Accordion'))
registerComponent('mantine', 'Dropdown', () => import('../adapters/mantine/Dropdown/Dropdown'))
registerComponent('mantine', 'Panel', () => import('../adapters/mantine/Panel/Panel'))
registerComponent('mantine', 'SegmentedControl', () => import('../adapters/mantine/SegmentedControl/SegmentedControl'))

// ─── Direct 1:1 pass-throughs ────────────────────────────────────────────────

registerComponent('mantine', 'AssistiveElement', () => import('../adapters/mantine/AssistiveElement/AssistiveElement'))
registerComponent('mantine', 'Avatar', () => import('../adapters/mantine/Avatar/Avatar'))
registerComponent('mantine', 'Badge', () => import('../adapters/mantine/Badge/Badge'))
registerComponent('mantine', 'Breadcrumb', () => import('../adapters/mantine/Breadcrumb/Breadcrumb'))
registerComponent('mantine', 'Button', () => import('../adapters/mantine/Button/Button'))
registerComponent('mantine', 'Card', () => import('../adapters/mantine/Card/Card'))
registerComponent('mantine', 'Checkbox', () => import('../adapters/mantine/Checkbox/Checkbox'))
registerComponent('mantine', 'CheckboxGroup', () => import('../adapters/mantine/CheckboxGroup/CheckboxGroup'))
registerComponent('mantine', 'Chip', () => import('../adapters/mantine/Chip/Chip'))
registerComponent('mantine', 'DatePicker', () => import('../adapters/mantine/DatePicker/DatePicker'))
registerComponent('mantine', 'FileInput', () => import('../adapters/mantine/FileInput/FileInput'))
registerComponent('mantine', 'FileUpload', () => import('../adapters/mantine/FileUpload/FileUpload'))
registerComponent('mantine', 'HoverCard', () => import('../adapters/mantine/HoverCard/HoverCard'))
registerComponent('mantine', 'Label', () => import('../adapters/mantine/Label/Label'))
registerComponent('mantine', 'Link', () => import('../adapters/mantine/Link/Link'))
registerComponent('mantine', 'Loader', () => import('../adapters/mantine/Loader/Loader'))
registerComponent('mantine', 'Menu', () => import('../adapters/mantine/Menu/Menu'))
registerComponent('mantine', 'Modal', () => import('../adapters/mantine/Modal/Modal'))
registerComponent('mantine', 'NumberInput', () => import('../adapters/mantine/NumberInput/NumberInput'))
registerComponent('mantine', 'Pagination', () => import('../adapters/mantine/Pagination/Pagination'))
registerComponent('mantine', 'Popover', () => import('../adapters/mantine/Popover/Popover'))
registerComponent('mantine', 'ReadOnlyField', () => import('../adapters/mantine/ReadOnlyField/ReadOnlyField'))
registerComponent('mantine', 'Slider', () => import('../adapters/mantine/Slider/Slider'))
registerComponent('mantine', 'Stepper', () => import('../adapters/mantine/Stepper/Stepper'))
registerComponent('mantine', 'Switch', () => import('../adapters/mantine/Switch/Switch'))
registerComponent('mantine', 'SwitchGroup', () => import('../adapters/mantine/SwitchGroup/SwitchGroup'))
registerComponent('mantine', 'SwitchItem', () => import('../adapters/mantine/SwitchItem/SwitchItem'))
registerComponent('mantine', 'Table', () => import('../adapters/mantine/Table/Table'))
registerComponent('mantine', 'Tabs', () => import('../adapters/mantine/Tabs/Tabs'))
registerComponent('mantine', 'TextField', () => import('../adapters/mantine/TextField/TextField'))
registerComponent('mantine', 'TimePicker', () => import('../adapters/mantine/TimePicker/TimePicker'))
registerComponent('mantine', 'Timeline', () => import('../adapters/mantine/Timeline/Timeline'))
registerComponent('mantine', 'Toast', () => import('../adapters/mantine/Toast/Toast'))
registerComponent('mantine', 'Tooltip', () => import('../adapters/mantine/Tooltip/Tooltip'))
registerComponent('mantine', 'TransferList', () => import('../adapters/mantine/TransferList/TransferList'))
registerComponent('mantine', 'Tree', () => import('../adapters/mantine/Tree/Tree'))

// ─── Renamed upstream ────────────────────────────────────────────────────────
// The wrapper is still a one-line pass-through; only the export name differs.

registerComponent('mantine', 'Autocomplete', () => import('../adapters/mantine/Autocomplete/Autocomplete')) // capital C upstream
registerComponent('mantine', 'Textarea', () => import('../adapters/mantine/Textarea/Textarea')) // capital A upstream
registerComponent('mantine', 'RadioButton', () => import('../adapters/mantine/RadioButton/RadioButton'))
registerComponent('mantine', 'RadioButtonGroup', () => import('../adapters/mantine/RadioButtonGroup/RadioButtonGroup'))

// ─── Collapsed into a parent upstream ────────────────────────────────────────
// Forge registers these as standalone components; the adapter models them as
// sub-components or as the plain single-item component. The wrapper pulls the static off
// its parent instead of a plain named import, but is otherwise still a pass-through.

registerComponent('mantine', 'CheckboxItem', () => import('../adapters/mantine/CheckboxItem/CheckboxItem')) // an item in a group is just a Checkbox
registerComponent('mantine', 'RadioButtonItem', () => import('../adapters/mantine/RadioButtonItem/RadioButtonItem'))
registerComponent('mantine', 'MenuItem', () => import('../adapters/mantine/MenuItem/MenuItem'))
registerComponent('mantine', 'TableCell', () => import('../adapters/mantine/TableCell/TableCell'))
registerComponent('mantine', 'TableHeader', () => import('../adapters/mantine/TableHeader/TableHeader'))
registerComponent('mantine', 'TableFooter', () => import('../adapters/mantine/TableFooter/TableFooter'))

// ─── Intentionally unregistered ──────────────────────────────────────────────
// No upstream equivalent, so these get NoAdapterImplementation's grey box rather than a
// look-alike local implementation faking a real one:
//
//   TimelineBullet        — upstream has no standalone bullet; it is internal to
//                           Timeline.Item, so its tokens cannot be exercised.
//   SegmentedControlItem  — upstream SegmentedControl is data-driven (a `data`
//                           array), with no per-item component to render.
//   AccordionItem / AccordionHeader / AccordionContent
//                         — upstream exposes Accordion.Item / .Control / .Panel,
//                           but Forge has no dispatcher for these names.
//   Divider / List / Select / Radio / Text / TabsItem / HoverCardPopover
//                         — declared in ComponentName but never registered.
