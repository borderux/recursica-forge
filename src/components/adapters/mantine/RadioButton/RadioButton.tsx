/**
 * Mantine RadioButton Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body: the
 * real Radio's `onChange` is the native input event (`(event: ChangeEvent<HTMLInputElement>)
 * => void`, confirmed against @mantine/core's own Radio.d.ts — it composes
 * `ElementProps<'input', 'size' | 'children'>`, i.e. native input attributes), not the
 * `(selected: boolean) => void` Forge declares. And the real component is driven by the
 * native `checked` boolean attribute, not `selected`. Same class of bug as Checkbox, same
 * fix: rename `selected` -> `checked`, adapt the event.
 */

import { Radio as MantineRadio } from '@recursica/mantine-adapter'
import type { RadioButtonProps } from '../../common/RadioButton'
import type { AssertWired } from '../../common/wiringCheck'

export default function RadioButton({
    selected,
    onChange,
    disabled,
    label,
    value,
    mantine,
}: RadioButtonProps) {
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

// Compile-time only — fails the build the moment RadioButtonProps declares a prop with no
// real, type-compatible home on the real Radio. `onChange` is excluded: it's explicitly
// adapted above (event -> boolean), not passed through unchanged, so checking its
// untranslated shape here would be a false positive — that adaptation is exactly what the
// literal `onChange={...}` attribute above already type-checks on its own.
type _Wiring = AssertWired<
    RadioButtonProps,
    typeof MantineRadio,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange',
    { selected: 'checked' }
>
const _wiringCheck: _Wiring = true
