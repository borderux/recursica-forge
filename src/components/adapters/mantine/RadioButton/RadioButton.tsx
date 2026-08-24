/**
 * Mantine RadioButton Adapter
 *
 * `checked` is now a straight, same-name pass-through to the real Radio's own `checked` —
 * both raw @mantine/core and raw @mui/material already agree the name is `checked`
 * (confirmed native `<input>`-based on both), so Forge's former `selected` was its own
 * unforced divergence, not something the adapter needed bridging. `onChange` is still
 * adapted: the real Radio's `onChange` is the native input event (`(event:
 * ChangeEvent<HTMLInputElement>) => void`, confirmed against @mantine/core's own Radio.d.ts
 * — it composes `ElementProps<'input', 'size' | 'children'>`), not the `(checked: boolean)
 * => void` Forge declares. Same class of adaptation as Checkbox.
 */

import React from 'react'
import { Radio as MantineRadio } from '@recursica/mantine-adapter'
import type { RadioButtonProps } from '../../common/RadioButton'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, RadioButtonProps>(function RadioButton({
    checked,
    onChange,
    disabled,
    label,
    value,
    mantine,
}, ref) {
    return (
        <MantineRadio
            checked={checked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            label={label}
            value={value}
            {...mantine}
            ref={ref}
        />
    )
})

// Compile-time only — fails the build the moment RadioButtonProps declares a prop with no
// real, type-compatible home on the real Radio. `onChange` is excluded: it's explicitly
// adapted above (event -> boolean), not passed through unchanged, so checking its
// untranslated shape here would be a false positive — that adaptation is exactly what the
// literal `onChange={...}` attribute above already type-checks on its own. No `Rename` map
// needed anymore — `checked` now matches the real prop name directly.
type _Wiring = AssertWired<
    RadioButtonProps,
    typeof MantineRadio,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange'
>
const _wiringCheck: _Wiring = true
