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
 *   RESHAPES  — the capability exists upstream but under a different *shape* (e.g. nested
 *               under a Mantine sub-prop object). Expressed as a function.
 *   DROPPED   — a Forge prop with no adapter equivalent. Dropping it is not hiding a
 *               problem: the capability genuinely does not exist upstream, and dropping is
 *               what stops it leaking to the DOM. Each one is logged once (dev only) and
 *               is a candidate to raise upstream.
 *
 * Renames and reshapes are translation — the adapter can already do the thing. Drops are
 * adapter gaps, and are the entries that should drive upstream fixes; they are marked GAP.
 * Nothing here may substitute a Forge implementation for a missing adapter capability.
 *
 * Keeping this as data rather than edits spread across ~50 dispatcher files means the gap
 * between the two APIs is readable in one place, and shrinks visibly as upstream adds
 * the missing capabilities.
 *
 * This only covers components whose mantine/{X}/{X}.tsx wrapper is a bare pass-through with
 * no translation code of its own. A growing number of wrappers (Accordion, Dropdown, Panel,
 * SegmentedControl, DatePicker, FileInput, FileUpload, TransferList, ...) do their own
 * explicit, per-prop translation inline instead — either because the mismatch is structural
 * (composition API vs. data-driven `items`) or because inline translation can carry an
 * `AssertWired` check
 * (common/wiringCheck.ts) verifying it against the real adapter types, which this table
 * cannot. A component with its own wrapper translation must NOT also appear in this file or
 * in FIELD_COMPONENTS below — `useComponent.ts` applies this table before the wrapper ever
 * runs, so props would arrive pre-renamed and the wrapper's own destructuring would silently
 * receive `undefined`.
 */

import type { ComponentName } from '../registry/types'

/**
 * How one Forge prop maps onto the adapter:
 *   string   — rename to this adapter prop
 *   null     — no upstream equivalent; drop it (an adapter gap)
 *   function — the capability exists upstream in a different shape; returns the props to merge
 */
type PropMapping = string | null | ((value: unknown) => Record<string, unknown>)

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
  // `colorVariant`/`sizeVariant` are NOT dropped globally here (they used to be): Avatar's
  // mantine wrapper (mantine/Avatar/Avatar.tsx) now does its own inline, AssertWired-checked
  // translation of both onto the real adapter's `variant`/`size`, and this table is applied
  // before that wrapper ever runs — a global drop here would starve it of both props before
  // its own destructuring saw them. Switch's mantine wrapper (mantine/Switch/Switch.tsx) now
  // drops both explicitly itself, for the same reason.
  'mantine', // Forge's per-kit escape hatches
  'material',
  'carbon',
])

/**
 * Shared by every form-field component. Forge grew its own field vocabulary; the adapter
 * uses Mantine's (description / error / leftSection / rightSection) and composes labels
 * through FormControlLayout, so Forge's id and alignment plumbing has nowhere to go.
 */
const FIELD_CONTRACT: Record<string, PropMapping> = {
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
const FIELD_COMPONENTS: ComponentName[] = []
// FileInput and FileUpload used to be here too. Their mantine wrappers now do their own
// inline translation instead (mantine/FileInput/FileInput.tsx, mantine/FileUpload/
// FileUpload.tsx) — partly because FIELD_CONTRACT's leadingIcon->leftSection/
// trailingIcon->rightSection renames are simply wrong for them: the real
// RecursicaFileInputProps/RecursicaFileUploadProps have neither `leftSection` nor
// `rightSection` at all, only a single `icon` slot.
// Switch used to be here too, sharing FIELD_CONTRACT despite declaring none of its
// helpText/errorText/layout/etc. fields (see common/Switch.ts) — the fold below never did
// anything for it either. Its mantine wrapper (mantine/Switch/Switch.tsx) now does its own
// explicit, AssertWired-checked translation instead, so it must NOT appear here.
// CheckboxItem, RadioButton, and RadioButtonItem used to share FIELD_CONTRACT here, but none
// of their real prop vocabularies (see common/CheckboxItem.ts, common/RadioButton.ts,
// common/RadioButtonItem.ts) actually declare helpText/errorText/layout/etc. in the first
// place — this table's rename never did anything for them. Their mantine wrappers
// (mantine/CheckboxItem, mantine/RadioButton, mantine/RadioButtonItem) now do their own
// explicit, AssertWired-checked translation instead, so they must NOT appear here — this
// table applies before the wrapper runs, and a component here would arrive pre-renamed.

/**
 * Per-component renames: Forge prop name → adapter prop name.
 * A value of null means "no equivalent upstream — drop it".
 */
export const PROP_CONTRACT: Partial<Record<ComponentName, Record<string, PropMapping>>> = {
  // Modal, Switch, Link, and Tree used to have entries here. Their mantine wrappers
  // (mantine/Modal/Modal.tsx, mantine/Switch/Switch.tsx, mantine/Link/Link.tsx,
  // mantine/Tree/Tree.tsx) now do their own explicit, AssertWired-checked translation
  // instead, so none of them may appear here — this table applies before the wrapper runs,
  // and a component here would arrive pre-renamed.

  // TransferList used to have an entry here that dropped `searchable` along with the
  // dispatcher's own composed-UI-only bookkeeping (filteredSource, sourceSelected,
  // onToggleSourceItem, etc). The `searchable: null` line was STALE: it was written when the
  // adapter's RecursicaTransferListProps was genuinely empty, but the currently-installed
  // @recursica/mantine-adapter has since grown a real `searchable?: boolean` field with
  // matching semantics ("Enable per-pane search filtering. Defaults to true"). Rather than
  // leave a half-correct table entry, TransferList's mantine wrapper
  // (mantine/TransferList/TransferList.tsx) now does its own inline translation for all of
  // it — wiring `searchable` through for real and translating `state` into the real
  // `disabled` field — so it no longer goes through this table at all.
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

    // Reshape: the capability exists upstream under a different shape. Merged rather than
    // assigned so several Forge props could contribute to the same adapter sub-object.
    if (typeof mapped === 'function') {
      for (const [outKey, outValue] of Object.entries(mapped(value))) {
        const existing = out[outKey]
        out[outKey] =
          existing && typeof existing === 'object' && outValue && typeof outValue === 'object'
            ? { ...(existing as object), ...(outValue as object) }
            : outValue
      }
      continue
    }

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
