/**
 * Mantine RadioButtonItem Adapter
 *
 * An item in a Forge RadioButtonGroup is just a plain Radio upstream — there's no separate
 * "item" export. Same underlying real component as RadioButton, and the exact same bug:
 * the real Radio's `onChange` is the native input event, not the `(selected: boolean) =>
 * void` Forge declares, and it's driven by the native `checked` boolean, not `selected`.
 * Fixed the same way here.
 */

import { Radio as MantineRadio } from '@recursica/mantine-adapter'
import type { RadioButtonItemProps } from '../../common/RadioButtonItem'
import type { AssertWired } from '../../common/wiringCheck'

export default function RadioButtonItem({
    selected,
    onChange,
    disabled,
    label,
    value,
    mantine,
}: RadioButtonItemProps) {
    return (
        <MantineRadio
            checked={selected}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            label={label}
            value={value}
            {...mantine}
        />
    )
}

// Compile-time only — see RadioButton's wrapper for the full explanation. `onChange` is
// excluded: it's explicitly adapted above, not passed through unchanged.
type _Wiring = AssertWired<
    RadioButtonItemProps,
    typeof MantineRadio,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange',
    { selected: 'checked' }
>
const _wiringCheck: _Wiring = true
