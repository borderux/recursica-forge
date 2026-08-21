/**
 * Mantine CheckboxItem Adapter
 *
 * An item in a Forge CheckboxGroup is just a plain Checkbox upstream — there's no separate
 * "item" export. Same underlying real component, and the exact same bug already fixed on
 * `mantine/Checkbox/Checkbox.tsx`: the real Checkbox's `onChange` fires a native
 * `ChangeEvent<HTMLInputElement>`, not the `(checked: boolean) => void` Forge declares.
 * Adapted here the same way.
 */

import { Checkbox as MantineCheckbox } from '@recursica/mantine-adapter'
import type { CheckboxItemProps } from '../../common/CheckboxItem'
import type { AssertWired } from '../../common/wiringCheck'

export default function CheckboxItem({
    checked,
    indeterminate,
    onChange,
    disabled,
    label,
    mantine,
}: CheckboxItemProps) {
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

// Compile-time only — see Checkbox's wrapper for the full explanation. `onChange` is
// excluded: it's explicitly adapted above (event -> boolean), not passed through unchanged.
type _Wiring = AssertWired<
    CheckboxItemProps,
    typeof MantineCheckbox,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange'
>
const _wiringCheck: _Wiring = true
