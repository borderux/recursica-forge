/**
 * Mantine NumberInput Adapter
 *
 * `onChange` is now a straight, same-shape pass-through: the real NumberInput's `onChange`
 * fires with the parsed `number | string` value directly (confirmed against @mantine/core's
 * own NumberInputProps — `onChange?: (value: number | string) => void`), and Forge's own type
 * was corrected (2026-08) to match exactly, rather than declaring a `ChangeEvent`-based shape
 * this path never actually delivered.
 *
 * `min`/`max`/`step` also need adapting, not just renaming: Forge types them `number | string`
 * (matching the native `<input>` attribute convention used by TextField), but the real
 * NumberInput's own `min`/`max`/`step` (RecursicaNumberInputProps_2) are typed strictly
 * `number`. Coerced with `Number(...)` here.
 *
 * `state` has no real equivalent (no state-like field anywhere on RecursicaNumberInputProps) —
 * dropped, same systemic gap as TextField/Autocomplete/Slider.
 *
 * `minWidth` is the same documented gap as TextField's: `controlMinWidth`/`controlMaxWidth`
 * are never Picked onto the real type, so there is no way to shrink the control below its
 * token width.
 */

import { NumberInput as MantineNumberInput } from '@recursica/mantine-adapter'
import type { NumberInputProps } from '../../common/NumberInput'
import type { AssertWired } from '../../common/wiringCheck'

export default function NumberInput({
    value,
    defaultValue,
    onChange,
    onKeyDown,
    onBlur,
    onClick,
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
    name,
    min,
    max,
    step,
    autoFocus,
    readOnly,
    mantine,
}: NumberInputProps) {
    return (
        <MantineNumberInput
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onClick={onClick}
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
            name={name}
            min={min === undefined ? undefined : Number(min)}
            max={max === undefined ? undefined : Number(max)}
            step={step === undefined ? undefined : Number(step)}
            autoFocus={autoFocus}
            readOnly={readOnly}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment NumberInputProps declares a prop with no
// real, type-compatible home on the real NumberInput (directly, or via the renames below).
// `onChange` now matches the real prop directly (no exclusion needed since the 2026-08 type
// correction). `min`/`max`/`step` are excluded: each is coerced to `number` above, which is
// what actually gets type-checked. `layout` is excluded like DatePicker's: Forge types it as
// an open `string`, wider than the real `formLayout` union, and the ternary above is the real
// translation. `state` and `minWidth` are excluded with no rename and no adaptation:
// confirmed no real equivalent exists for either (see header).
type _Wiring = AssertWired<
    NumberInputProps,
    typeof MantineNumberInput,
    | 'layer'
    | 'disableTopBottomMargin'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'min'
    | 'max'
    | 'step'
    | 'layout'
    | 'state'
    | 'minWidth',
    { helpText: 'assistiveText'; errorText: 'error'; leadingIcon: 'leftSection'; trailingIcon: 'rightSection'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
