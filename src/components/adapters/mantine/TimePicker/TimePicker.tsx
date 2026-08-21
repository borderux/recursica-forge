/**
 * Mantine TimePicker Adapter
 *
 * Not actually a 1:1 pass-through — several real mismatches were hiding behind the bare
 * re-export:
 *
 *   - `onChange` only ever fires with a time STRING (confirmed against @mantine/dates' own
 *     TimePickerProps — `onChange?: (value: string) => void`), never a native `ChangeEvent`.
 *     Forge's declared `onChange(event: ChangeEvent<HTMLInputElement>)` never matched; a
 *     minimal synthetic event carrying the string on `target.value` is built here so existing
 *     `event.target.value` call sites keep working.
 *   - `state` was never wired to anything real. The real TimePicker DOES have a genuine
 *     `disabled` prop (confirmed: it's not in RecursicaTimePickerProps's Omit list, unlike
 *     `format`/`min`/`max`/the AM-PM props), so `state === 'disabled'` is translated straight
 *     into it, the same pattern as Dropdown's structural wrapper.
 *   - `period`/`onPeriodChange` have no real destination: RecursicaTimePickerProps explicitly
 *     Omits every one of Mantine's own AM/PM props (`format`, `amPmInputLabel`, `amPmLabels`,
 *     `amPmSelectProps`, `amPmRef`) with nothing put back in their place. Dropped — a real
 *     adapter gap, not an oversight.
 *   - `onKeyDown`/`onBlur` have no correctly-typed home either. Forge declares both against
 *     `HTMLInputElement` (matching the old local `<input>`-based implementation), but the
 *     real TimePicker is a composite rooted in a `<div>` (its own `onBlur` is explicitly
 *     retyped by @mantine/dates to `FocusEvent<HTMLDivElement>`, and `onKeyDown` inherits the
 *     same div-rooted `ElementProps`) — there is no single `HTMLInputElement` target to hand
 *     back once the picker is split across separate hour/minute/second sub-inputs. Dropped.
 *   - `editIconGap` has no real destination, and the TimePicker dispatcher
 *     (`adapters/TimePicker.tsx`) doesn't even forward it to this component.
 *   - `placeholder` has no real destination at all: the real TimePicker is rooted in a
 *     `<div>` (not a native `<input>`), and neither `@mantine/dates`' own `TimePickerProps`
 *     nor `__BaseInputProps` re-adds a `placeholder` field for it — divs have no such HTML
 *     attribute to forward it to. Dropped; a real (if minor) adapter gap.
 */

import { TimePicker as MantineTimePicker } from '@recursica/mantine-adapter'
import type { TimePickerProps } from '../../common/TimePicker'
import type { AssertWired } from '../../common/wiringCheck'

export default function TimePicker({
    value,
    defaultValue,
    onChange,
    onClick,
    label,
    helpText,
    errorText,
    leadingIcon,
    state,
    layout,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    name,
    autoFocus,
    readOnly,
    mantine,
}: TimePickerProps) {
    return (
        <MantineTimePicker
            value={value}
            defaultValue={defaultValue}
            onChange={(val) =>
                onChange?.({ target: { value: val } } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
            onClick={onClick}
            label={label}
            assistiveText={helpText}
            error={errorText}
            leftSection={leadingIcon}
            disabled={state === 'disabled'}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            name={name}
            autoFocus={autoFocus}
            readOnly={readOnly}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment TimePickerProps declares a prop with no
// real, type-compatible home on the real TimePicker (directly, or via the renames below).
// `onChange` is excluded: it's explicitly adapted above (string -> synthetic event). `state`
// is excluded: it's explicitly translated into the real `disabled` prop above, not renamed
// (the other state values, e.g. `focus`/`error`, have no real destination beyond `error`
// itself, which is already covered by `errorText`). `layout` is excluded like DatePicker's:
// Forge types it as an open `string`, wider than the real `formLayout` union, and the ternary
// above is the real translation. `onKeyDown`, `onBlur`, `period`, `onPeriodChange` and
// `editIconGap` are excluded with no rename and no adaptation: confirmed no real equivalent
// exists for any of them (see header); `editIcon` similarly has no real slot (same rationale
// as TextField's).
type _Wiring = AssertWired<
    TimePickerProps,
    typeof MantineTimePicker,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'onChange'
    | 'state'
    | 'layout'
    | 'onKeyDown'
    | 'onBlur'
    | 'period'
    | 'onPeriodChange'
    | 'editIcon'
    | 'editIconGap'
    | 'placeholder',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
