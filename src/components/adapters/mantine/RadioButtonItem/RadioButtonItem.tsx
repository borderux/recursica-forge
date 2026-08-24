/**
 * Mantine RadioButtonItem Adapter
 *
 * An item in a Forge RadioButtonGroup is just a plain Radio upstream — there's no separate
 * "item" export. Same underlying real component as RadioButton, and the same `checked`
 * pass-through (see RadioButton's wrapper for the full explanation of why `selected` was
 * renamed to `checked`). `onChange` is still adapted: the real Radio's `onChange` is the
 * native input event, not the `(checked: boolean) => void` Forge declares.
 */

import { Radio as MantineRadio } from '@recursica/mantine-adapter'
import type { RadioButtonItemProps } from '../../common/RadioButtonItem'
import type { AssertWired } from '../../common/wiringCheck'

export default function RadioButtonItem({
    checked,
    onChange,
    disabled,
    label,
    value,
    mantine,
}: RadioButtonItemProps) {
    return (
        <MantineRadio
            checked={checked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            label={label}
            value={value}
            {...mantine}
        />
    )
}

// Compile-time only — see RadioButton's wrapper for the full explanation. `onChange` is
// excluded: it's explicitly adapted above, not passed through unchanged. No `Rename` map
// needed anymore — `checked` now matches the real prop name directly.
type _Wiring = AssertWired<
    RadioButtonItemProps,
    typeof MantineRadio,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange'
>
const _wiringCheck: _Wiring = true
