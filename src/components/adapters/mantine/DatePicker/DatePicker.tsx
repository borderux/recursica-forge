/**
 * Mantine DatePicker Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body: two
 * real bugs were hiding behind `useComponent`'s generic prop spread.
 *
 *   - `onChange` only ever fires with a date STRING (`DateStringValue`), never a `Date`
 *     object — confirmed against @mantine/dates' own PickerBaseProps. Forge's declared
 *     `onChange(date: Date | null)` was receiving a string and calling it a Date; anything
 *     that touched the value as a Date (`.getMonth()`, etc.) would have thrown. Converted
 *     here instead.
 *   - `dateFormat` had no real destination at all — confirmed via AssertWired below — but
 *     the real underlying DatePickerInput does accept `valueFormat` (a dayjs format string,
 *     not Forge's spaced 'MM / DD / YY' convention), so this maps to a real capability
 *     instead of being dropped. The token *dialect* differs from Forge's; callers passing a
 *     dayjs-style format (e.g. 'MM/DD/YYYY') now get real formatting, but Forge's own spaced
 *     convention isn't translated — worth a follow-up if that convention matters here.
 *
 * `value`/`defaultValue` are fine as-is: the real prop's type is a union that includes `Date`
 * alongside the string form, so passing a `Date` in works even though what comes back out
 * via `onChange` doesn't match.
 */

import { DatePicker as MantineDatePicker } from '@recursica/mantine-adapter'
import type { DatePickerProps } from '../../common/DatePicker'
import type { AssertWired } from '../../common/wiringCheck'

export default function DatePicker({
    value,
    defaultValue,
    onChange,
    placeholder,
    label,
    helpText,
    errorText,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    name,
    readOnly,
    dateFormat,
    mantine,
}: DatePickerProps) {
    return (
        <MantineDatePicker
            value={value}
            defaultValue={defaultValue}
            onChange={(next) => onChange?.(next ? new Date(next) : null)}
            placeholder={placeholder}
            label={label}
            assistiveText={helpText}
            error={errorText}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            name={name}
            readOnly={readOnly}
            valueFormat={dateFormat}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment DatePickerProps declares a prop that has
// no real, type-compatible home on the real DatePicker (directly, or via the renames below).
// `onChange` and `dateFormat` are excluded: both are explicitly adapted above (not passed
// through unchanged), so checking their untranslated shape here would be a false positive.
// `layout` is also excluded: Forge deliberately types it as an open `string` (to accept
// custom layout variant names elsewhere in the app), wider than the real `formLayout` union
// — the ternary above is the actual translation, and it's what gets type-checked.
// `state` is excluded with no rename and no adaptation: confirmed no real equivalent exists
// at all (RecursicaDatePickerProps_2 — the adapter's own DatePicker-specific additions — is
// a literally empty interface).
type _Wiring = AssertWired<
    DatePickerProps,
    typeof MantineDatePicker,
    'layer' | 'disableTopBottomMargin' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange' | 'state' | 'dateFormat' | 'layout',
    { helpText: 'assistiveText'; errorText: 'error'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
