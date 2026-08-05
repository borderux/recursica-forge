/**
 * Mantine Component Registry
 *
 * Registers the REAL published adapter, @recursica/mantine-adapter, as the
 * Mantine implementation for every component Forge previews.
 *
 * Forge's local hand-written Mantine implementations (src/components/adapters/mantine)
 * have been deleted. There is deliberately no fallback: a component with no upstream
 * equivalent stays unregistered so `getComponent` returns null and the preview renders
 * empty. A blank preview is honest signal; a local implementation quietly filling in
 * would make an unwired prop look wired.
 *
 * The adapter styles itself purely from --recursica_* custom properties, so editing a
 * token in Forge should move the real component. Where it doesn't, the prop isn't wired
 * up in the adapter — which is the whole point of pointing Forge at the real thing.
 * Run `npm run report:adapter-wiring` for the exhaustive list.
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

type AdapterModule = typeof import('@recursica/mantine-adapter')

/**
 * Registers a component by picking a named export off the adapter and re-shaping it
 * into the `{ default }` module the registry's lazy loader expects.
 *
 * `select` receives the whole adapter module so sub-components can be reached
 * (e.g. Table.Td, Menu.Item) — upstream composes several of Forge's separately
 * registered names as static properties of a parent component.
 */
function register(
  componentName: ComponentName,
  select: (m: AdapterModule) => unknown
) {
  registerComponent('mantine', componentName, () =>
    import('@recursica/mantine-adapter').then((m) => {
      const Component = select(m)
      if (!Component) {
        throw new Error(
          `[registry] @recursica/mantine-adapter has no export for "${componentName}". ` +
            `The adapter's export surface likely changed — update src/components/registry/mantine.ts.`
        )
      }
      return { default: Component as React.ComponentType<any> }
    })
  )
}

// ─── Direct 1:1 exports ──────────────────────────────────────────────────────

register('Accordion', (m) => m.Accordion)
register('AssistiveElement', (m) => m.AssistiveElement)
register('Avatar', (m) => m.Avatar)
register('Badge', (m) => m.Badge)
register('Breadcrumb', (m) => m.Breadcrumb)
register('Button', (m) => m.Button)
register('Card', (m) => m.Card)
register('Checkbox', (m) => m.Checkbox)
register('CheckboxGroup', (m) => m.CheckboxGroup)
register('Chip', (m) => m.Chip)
register('DatePicker', (m) => m.DatePicker)
register('Dropdown', (m) => m.Dropdown)
register('FileInput', (m) => m.FileInput)
register('FileUpload', (m) => m.FileUpload)
register('HoverCard', (m) => m.HoverCard)
register('Label', (m) => m.Label)
register('Link', (m) => m.Link)
register('Loader', (m) => m.Loader)
register('Menu', (m) => m.Menu)
register('Modal', (m) => m.Modal)
register('NumberInput', (m) => m.NumberInput)
register('Pagination', (m) => m.Pagination)
register('Panel', (m) => m.Panel)
register('Popover', (m) => m.Popover)
register('ReadOnlyField', (m) => m.ReadOnlyField)
register('SegmentedControl', (m) => m.SegmentedControl)
register('Slider', (m) => m.Slider)
register('Stepper', (m) => m.Stepper)
register('Switch', (m) => m.Switch)
register('Table', (m) => m.Table)
register('Tabs', (m) => m.Tabs)
register('TextField', (m) => m.TextField)
register('TimePicker', (m) => m.TimePicker)
register('Timeline', (m) => m.Timeline)
register('Toast', (m) => m.Toast)
register('Tooltip', (m) => m.Tooltip)
register('TransferList', (m) => m.TransferList)
register('Tree', (m) => m.Tree)

// ─── Renamed upstream ────────────────────────────────────────────────────────

register('Autocomplete', (m) => m.AutoComplete) // capital C upstream
register('Textarea', (m) => m.TextArea) // capital A upstream
register('RadioButton', (m) => m.Radio)
register('RadioButtonGroup', (m) => m.RadioGroup)

// ─── Collapsed into a parent upstream ────────────────────────────────────────
// Forge registers these as standalone components; the adapter models them as
// sub-components or as the plain single-item component.

register('CheckboxItem', (m) => m.Checkbox) // an item in a group is just a Checkbox
register('RadioButtonItem', (m) => m.Radio)
register('MenuItem', (m) => m.Menu.Item)
register('TableCell', (m) => m.Table.Td)
register('TableHeader', (m) => m.Table.Th)
register('TableFooter', (m) => m.Table.Tfoot)

// ─── Intentionally unregistered ──────────────────────────────────────────────
// No upstream equivalent, so these render as nothing rather than falling back:
//
//   TimelineBullet        — upstream has no standalone bullet; it is internal to
//                           Timeline.Item, so its tokens cannot be exercised.
//   SegmentedControlItem  — upstream SegmentedControl is data-driven (a `data`
//                           array), with no per-item component to render.
//   AccordionItem / AccordionHeader / AccordionContent
//                         — upstream exposes Accordion.Item / .Control / .Panel,
//                           but Forge has no dispatcher for these names.
//   SwitchGroup / SwitchItem
//                         — dispatchers exist but were never registered for
//                           Mantine here either; upstream does export SwitchGroup,
//                           so these are candidates to wire up next.
//   Divider / List / Select / Radio / Text / TabsItem / HoverCardPopover
//                         — declared in ComponentName but never registered.
