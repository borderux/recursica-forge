/**
 * Forge → @recursica/mantine-adapter prop contract
 *
 * Forge's dispatchers (src/components/adapters/*.tsx) were written against Forge's own
 * local Mantine implementations, which accepted a Forge-invented prop vocabulary. The real
 * adapter has its own vocabulary, and it does NOT filter unknown props — anything it does
 * not recognise is forwarded to Mantine and then onto the DOM, producing a flood of
 * "React does not recognize the X prop on a DOM element" warnings and stray attributes.
 *
 * This module is the single place that reconciles the two vocabularies:
 *
 *   RENAMES   — a Forge prop that has a genuine adapter equivalent, renamed in flight.
 *   DROPPED   — a Forge prop with no adapter equivalent. Dropping it is not hiding a
 *               problem: the capability genuinely does not exist upstream, and dropping is
 *               what stops it leaking to the DOM. Each one is logged once (dev only) and
 *               is a candidate to raise upstream.
 *
 * Keeping this as data rather than edits spread across ~50 dispatcher files means the gap
 * between the two APIs is readable in one place, and shrinks visibly as upstream adds
 * the missing capabilities.
 */

import type { ComponentName } from '../registry/types'

/**
 * Props Forge's dispatcher layer adds for its own bookkeeping. No adapter component takes
 * any of them, so they are dropped for every component rather than listed per-component.
 */
export const FORGE_ONLY_PROPS = new Set([
  'layer', // translated into a <Layer> wrapper by useComponent
  'elevation', // token-driven upstream, not a prop
  'componentNameForCssVars', // Forge's CSS-var lookup hint
  'selectionState', // Forge's custom selection-state variant name
  'showLabel', // Forge's label visibility toggle
  'disableTopBottomMargin', // Forge layout tweak
  // Preview-only affordances that pin a component into an interaction state without the
  // user interacting. Used by Breadcrumb/Link/Tree as well as the field components, and
  // there is no upstream equivalent anywhere.
  'forceState',
  'forceHover',
  'colorVariant', // Forge per-instance colour/size overrides; upstream is token-driven only
  'sizeVariant',
  'mantine', // Forge's per-kit escape hatches
  'material',
  'carbon',
])

/**
 * Shared by every form-field component. Forge grew its own field vocabulary; the adapter
 * uses Mantine's (description / error / leftSection / rightSection) and composes labels
 * through FormControlLayout, so Forge's id and alignment plumbing has nowhere to go.
 */
const FIELD_CONTRACT: Record<string, string | null> = {
  helpText: 'assistiveText',
  errorText: 'error',
  leadingIcon: 'leftSection',
  trailingIcon: 'rightSection',
  // The field components embed FormControlWrapper, so label layout IS supported upstream —
  // just under different names. `layout` in particular is what makes a label sit beside its
  // control instead of above it.
  layout: 'formLayout',
  labelAlign: 'labelAlignment',
  labelSize: 'labelSize',
  optional: 'labelOptionalText',
  // The adapter renders its own edit affordance beside the label and exposes the click hook;
  // it has no slot for a caller-supplied icon node short of replacing the whole action area.
  onEditIconClick: 'onLabelEditClick',
  editIcon: null,
  editIconTitle: null,
  labelId: null, // adapter wires its own aria relationships
  helpId: null,
  errorId: null,
}

/**
 * Components that share FIELD_CONTRACT. Label is included because the adapter's standalone
 * Label takes the same prefixed props (labelSize / labelAlignment / onLabelEditClick), and
 * Forge renders it directly inside controls like Slider.
 */
const FIELD_COMPONENTS: ComponentName[] = [
  'Label',
  'TextField',
  'Textarea',
  'NumberInput',
  'Dropdown',
  'Autocomplete',
  'DatePicker',
  'TimePicker',
  'FileInput',
  'FileUpload',
  'ReadOnlyField',
  'Slider',
  'Checkbox',
  'CheckboxItem',
  'RadioButton',
  'RadioButtonItem',
  'Switch',
]

/**
 * Per-component renames: Forge prop name → adapter prop name.
 * A value of null means "no equivalent upstream — drop it".
 */
export const PROP_CONTRACT: Partial<Record<ComponentName, Record<string, string | null>>> = {
  Accordion: {
    allowMultiple: 'multiple',
    openItems: 'value',
    onOpenItemsChange: 'onChange',
    onItemToggle: null, // adapter exposes only the aggregate onChange
  },

  Modal: {
    isOpen: 'opened',
    showCloseButton: 'withCloseButton',
    // The adapter's Modal is a shell (opened / withCloseButton / title). Header, footer and
    // the action-button row are composed by the caller via Modal.Header / .Body / .Footer,
    // so none of Forge's convenience props have an upstream counterpart.
    showHeader: null,
    showFooter: null,
    scrollable: null,
    showSecondaryButton: null,
    primaryActionLabel: null,
    onPrimaryAction: null,
    primaryActionDisabled: null,
    secondaryActionLabel: null,
    onSecondaryAction: null,
    secondaryActionDisabled: null,
  },

  Switch: {
    // Upstream drives colour and size entirely from tokens; there is no per-instance override.
    colorVariant: null,
    sizeVariant: null,
  },

  Link: {
    startIcon: 'icon',
    endIcon: null, // adapter supports a leading icon only
  },

  Tabs: {
    tabContentAlignment: null, // no upstream equivalent
  },

  // The adapter's RecursicaTransferListProps is empty — it exposes no Recursica-specific
  // API at all — so every prop Forge's dispatcher drives the two panes with is unmatched.
  // This is the widest single-component gap in the set; worth raising upstream as a whole
  // rather than prop by prop.
  Label: {
    // Label shares the label vocabulary but is not itself a form control, so it has no
    // FormControlWrapper and nothing to do with `formLayout`.
    layout: null,
  },

  Tree: {
    // Without this rename the components sidebar looks fine but does not navigate: the
    // handler lands on the <ul> as an unknown prop, so a node highlights and nothing else
    // happens.
    onSelect: 'onSelectedChange',
    // Forge drives selection as controlled state (the component from the URL); upstream only
    // offers an uncontrolled initial value. Mapping keeps the node highlighted on mount, but
    // selection will not re-sync if the route changes by some other means — see note below.
    selected: 'initialSelectedValues',
  },

  Chip: {
    // Upstream shows the remove icon when an onRemove handler is present, so a boolean
    // "deletable" flag has nothing to map to.
    deletable: null,
  },

  TransferList: {
    searchable: null,
    filteredSource: null,
    filteredTarget: null,
    sourceSelected: null,
    targetSelected: null,
    onSourceSearchChange: null,
    onTargetSearchChange: null,
    onToggleSourceItem: null,
    onToggleTargetItem: null,
    onTransferToSource: null,
    onTransferToTarget: null,
    onTransferAllToSource: null,
    onTransferAllToTarget: null,
  },

  Slider: {
    minIcon: 'icon', // adapter supports a single leading icon
    maxIcon: null,
    onChangeCommitted: 'onChangeEnd',
    // `tooltipText` is the tooltip, so it owns the adapter's tooltipLabel. Forge's separate
    // `valueLabel`/`showValueLabel` pair (a value readout next to the track) has no upstream
    // counterpart, and min/max labels upstream are a boolean toggle with no custom content.
    tooltipText: 'tooltipLabel',
    valueLabel: null,
    showValueLabel: null,
    minLabel: null,
    maxLabel: null,
  },
}

// Fold the shared field vocabulary into each field component, letting a component's own
// entry win where the two overlap.
for (const component of FIELD_COMPONENTS) {
  PROP_CONTRACT[component] = { ...FIELD_CONTRACT, ...(PROP_CONTRACT[component] ?? {}) }
}

const reported = new Set<string>()

/**
 * Applies the contract to one component's props.
 *
 * Logs each dropped prop once per session in dev so the gap stays visible without flooding
 * the console the way the raw React warnings did.
 */
export function applyPropContract(
  componentName: ComponentName,
  props: Record<string, unknown>
): Record<string, unknown> {
  const contract = PROP_CONTRACT[componentName]
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (FORGE_ONLY_PROPS.has(key)) continue

    const mapped = contract && key in contract ? contract[key] : key
    if (mapped === null) {
      if (import.meta.env.DEV) {
        const id = `${componentName}.${key}`
        if (!reported.has(id)) {
          reported.add(id)
          console.info(
            `[adapter] <${componentName}> prop "${key}" has no equivalent in ` +
              `@recursica/mantine-adapter and was dropped. Candidate to raise upstream.`
          )
        }
      }
      continue
    }

    out[mapped] = value
  }

  return out
}
