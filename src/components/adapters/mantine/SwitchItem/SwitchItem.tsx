/**
 * Mantine SwitchItem Adapter
 *
 * Not previously implemented for Mantine at all — no folder existed here and it was not
 * registered in registry/mantine.ts. The real adapter's Switch (from
 * @recursica/mantine-adapter) already accepts a `label` prop directly, so this is cheap to
 * wire up, but it carries the same class of bug already fixed on Checkbox: the real
 * Switch's `onChange` fires the native input event (`(event: ChangeEvent<HTMLInputElement>)
 * => void`, confirmed against @mantine/core's own Switch.d.ts — it composes
 * `ElementProps<'input', 'size' | 'children'>`, i.e. native input attributes), not the
 * `(checked: boolean) => void` Forge declares. Adapted here the same way.
 *
 * `colorVariant`/`sizeVariant` — no real equivalent: upstream drives colour and size
 * entirely from tokens (see the central PROP_CONTRACT's own `Switch: { colorVariant: null,
 * sizeVariant: null }` entry — the same gap applies here). `elevation` is token-driven, not
 * a prop, same as every other component.
 */

import { Switch as MantineSwitch } from '@recursica/mantine-adapter'
import type { SwitchItemProps } from '../../common/SwitchItem'
import type { AssertWired } from '../../common/wiringCheck'

export default function SwitchItem({
    checked,
    onChange,
    disabled,
    label,
    mantine,
}: SwitchItemProps) {
    return (
        <MantineSwitch
            checked={checked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            label={label}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment SwitchItemProps declares a prop with no
// real, type-compatible home on the real Switch. `onChange` is excluded: it's explicitly
// adapted above (event -> boolean), not passed through unchanged. `colorVariant`/
// `sizeVariant`/`elevation` are genuine adapter gaps — see file header.
type _Wiring = AssertWired<
    SwitchItemProps,
    typeof MantineSwitch,
    | 'layer'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'onChange'
    | 'colorVariant'
    | 'sizeVariant'
    | 'elevation'
>
const _wiringCheck: _Wiring = true
