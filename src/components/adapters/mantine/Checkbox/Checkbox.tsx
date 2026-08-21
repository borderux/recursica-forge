/**
 * Mantine Checkbox Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body: the
 * real Checkbox's `onChange` is the native input event (`(event: ChangeEvent<HTMLInputElement>)
 * => void`, confirmed against @mantine/core's own Checkbox.d.ts), not the
 * `(checked: boolean) => void` Forge declares. Every consumer written against Forge's own
 * documented signature was silently reading a boolean off a raw DOM event object. Adapted
 * here instead of leaving it to whoever calls this component to discover at runtime.
 */

import { Checkbox as MantineCheckbox } from '@recursica/mantine-adapter'
import type { CheckboxProps } from '../../common/Checkbox'
import type { AssertWired } from '../../common/wiringCheck'

export default function Checkbox({
    checked,
    indeterminate,
    onChange,
    disabled,
    label,
    mantine,
}: CheckboxProps) {
    return (
        <MantineCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            label={label}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment CheckboxProps declares a prop with no real,
// type-compatible home on the real Checkbox. `onChange` is excluded: it's explicitly adapted
// above (event -> boolean), not passed through unchanged, so checking its untranslated shape
// here would be a false positive — that adaptation is exactly what the literal `onChange={...}`
// attribute above already type-checks on its own.
type _Wiring = AssertWired<
    CheckboxProps,
    typeof MantineCheckbox,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange'
>
const _wiringCheck: _Wiring = true
