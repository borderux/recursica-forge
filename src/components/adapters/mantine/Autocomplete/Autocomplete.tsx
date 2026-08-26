/**
 * Mantine Autocomplete Adapter
 *
 * Not a 1:1 pass-through: Forge's `items` is an array of rich objects (label, icons, supporting
 * text, dividers, ...) but the real adapter's `data` takes `RecursicaComboboxItem`s
 * (`{ value, label?, disabled?, leadingIcon?, supportingText? }`) — a real, native slot for
 * icon + supporting text now (2026-08, `@recursica/mantine-adapter@0.49.0` — previously the
 * adapter's own `data` had no icon/supporting-text slot at all, and this wrapper worked around
 * it with a `renderOption` callback; removed now that the adapter renders these fields itself).
 * `label` stays a real string (falls back to `value` when omitted) since it's what gets
 * matched against typed text and written into the input as the selected display text — a whole
 * subtree can't be matched/written, so Forge's richer `AutocompleteItem.label` (typed as
 * `ReactNode`, for other kits) still needs coercing down to a string here when it isn't one.
 *
 * `divider`/`leadingIconType`'s radio/checkbox modes remain real, narrower gaps: the adapter's
 * `data` has no divider slot, and `leadingIcon` is always rendered as a plain icon — both left
 * as-is rather than half-implemented.
 *
 * `zIndex` has a real destination too, just nested: reshaped into `comboboxProps={{ zIndex }}`,
 * which the real type forwards straight to Mantine's `Combobox` popover.
 *
 * `state` and `minWidth` have no real equivalent (same systemic gap as TextField/NumberInput).
 *
 * `defaultValue` is real (re-added via the base `@recursica/adapter-common` type) but never
 * actually reaches this wrapper at runtime — the Autocomplete dispatcher resolves it into its
 * own uncontrolled state first and only ever forwards a resolved `value` down.
 */

import React from 'react'
import { AutoComplete as MantineAutocomplete } from '@recursica/mantine-adapter'
import type { AutocompleteProps } from '../../common/Autocomplete'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, AutocompleteProps>(function Autocomplete({
    items,
    value,
    onChange,
    placeholder,
    label,
    helpText,
    errorText,
    leadingIcon,
    trailingIcon,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    zIndex,
    mantine,
}, ref) {
    const data = items.map((item) => ({
        value: item.value,
        label: typeof item.label === 'string' ? item.label : undefined,
        disabled: item.disabled,
        leadingIcon: item.leadingIconType === 'none' ? undefined : (item.icon ?? item.leadingIcon),
        supportingText: item.supportingText,
    }))

    return (
        <MantineAutocomplete
            data={data}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            label={label}
            assistiveText={helpText}
            error={errorText}
            leftSection={leadingIcon}
            rightSection={trailingIcon}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            comboboxProps={zIndex !== undefined ? { zIndex } : undefined}
            {...mantine}
            ref={ref}
        />
    )
})

// Compile-time only — fails the build the moment AutocompleteProps declares a prop with no
// real, type-compatible home on the real AutoComplete (directly, or via the renames below).
// `items`, `zIndex` and `defaultValue` are excluded: `items` is explicitly reshaped into `data`
// above (a different shape, not a rename), `zIndex` is explicitly reshaped into
// `comboboxProps`, and `defaultValue` never reaches this wrapper at runtime (see header) — all
// three are already type-checked by the literal attributes above, so re-checking their
// untranslated shape here would be a false positive. `layout` is excluded
// for the same reason DatePicker excludes it: Forge types it as an open `string`, wider than
// the real `formLayout` union, and the ternary above is the actual translation that gets
// type-checked. `state` and `minWidth` are excluded with no rename and no adaptation:
// confirmed no real equivalent exists (no state-like field on RecursicaAutocompleteProps;
// controlMinWidth/controlMaxWidth are Omitted from the real type, same gap as TextField's).
type _Wiring = AssertWired<
    AutocompleteProps,
    typeof MantineAutocomplete,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'items'
    | 'zIndex'
    | 'defaultValue'
    | 'layout'
    | 'state'
    | 'minWidth',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
