/**
 * Mantine Autocomplete Adapter
 *
 * Not a 1:1 pass-through: Forge's `items` is an array of rich objects (label, icons,
 * supporting text, dividers, ...) but the real adapter's `data` is `unknown[]`, which at
 * runtime the underlying Mantine `AutoComplete` treats as `ComboboxStringData` — plain
 * strings or `{ value, disabled }` pairs with no separate display label, icon, or divider
 * slot (confirmed against @mantine/core's `ComboboxStringItem`). Reshaped here to `{ value,
 * disabled }` rather than just renamed; everything else on `AutocompleteItem` (label as a
 * distinct node, icons, supportingText, divider) has no upstream destination and is dropped.
 *
 * `zIndex` has a real destination too, just nested: the real type doesn't expose a top-level
 * `zIndex`, but does forward `comboboxProps` straight to Mantine's `Combobox`, whose popover
 * accepts `zIndex`. Reshaped into `comboboxProps={{ zIndex }}` instead of being dropped.
 *
 * `state` has no real equivalent anywhere (RecursicaAutocompleteProps carries no state-like
 * field) — dropped, same systemic gap as TextField/NumberInput/Slider.
 *
 * `minWidth` is the same documented gap as TextField's: the real type Omits
 * `controlMinWidth`/`controlMaxWidth` entirely, so there is no way to shrink the control
 * below its token width.
 *
 * `defaultValue` has no real destination either — the real type Omits Mantine's own
 * `defaultValue` from AutocompleteProps and doesn't re-add it (only `value` is re-declared).
 * The Autocomplete dispatcher already only ever forwards the resolved `value`, never
 * `defaultValue`, so nothing observable changes by dropping it here too.
 */

import { AutoComplete as MantineAutocomplete } from '@recursica/mantine-adapter'
import type { AutocompleteProps } from '../../common/Autocomplete'
import type { AssertWired } from '../../common/wiringCheck'

export default function Autocomplete({
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
}: AutocompleteProps) {
    return (
        <MantineAutocomplete
            data={items.map((item) => ({ value: item.value, disabled: item.disabled }))}
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
        />
    )
}

// Compile-time only — fails the build the moment AutocompleteProps declares a prop with no
// real, type-compatible home on the real AutoComplete (directly, or via the renames below).
// `items`, `zIndex` and `defaultValue` are excluded: `items` is explicitly reshaped into
// `data` above (a different shape, not a rename), `zIndex` is explicitly reshaped into
// `comboboxProps`, and `defaultValue` is dropped with no adaptation (see file header) — all
// three are already type-checked by the literal attributes above, so re-checking their
// untranslated shape here would be a false positive. `layout` is excluded for the same reason
// DatePicker excludes it: Forge types it as an open `string`, wider than the real `formLayout`
// union, and the ternary above is the actual translation that gets type-checked.
// `state` and `minWidth` are excluded with no rename and no adaptation: confirmed no real
// equivalent exists (no state-like field on RecursicaAutocompleteProps; controlMinWidth /
// controlMaxWidth are Omitted from the real type, same gap as TextField's).
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
