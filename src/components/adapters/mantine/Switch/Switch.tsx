/**
 * Mantine Switch Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body:
 *
 *   - The real Switch is built on the same native `<input>` pattern as Checkbox — its
 *     `onChange` is `(event: ChangeEvent<HTMLInputElement>) => void` (confirmed: Mantine's
 *     own SwitchProps extends `ElementProps<'input', 'size' | 'children'>`, i.e. native input
 *     attributes), not the `(checked: boolean) => void` Forge declares. Same bug as Checkbox,
 *     adapted here the same way.
 *   - The real Switch's prop type is `RequireAccessibleLabel<...>` — it requires a real value
 *     for one of `label` / `aria-label` / `aria-labelledby`. Forge's Switch has no `label` (or
 *     any label-ish prop) in its vocabulary at all, and every real usage in this app renders
 *     `<Switch>` inside its own external `<label>` element (see e.g.
 *     `modules/preview/componentSections.tsx`), which already associates it accessibly at the
 *     DOM level — Forge's Switch was never meant to carry its own label. There is nothing to
 *     forward, so `label={undefined}` is passed explicitly (React.ReactNode includes
 *     `undefined`) purely to satisfy the required *key*; this is a genuine adapter/Forge API
 *     mismatch worth flagging, not a real capability being dropped.
 *
 * `className`/`style` are on the adapter's blocked-styling-keys list (the real Switch type is
 * also `RecursicaOverStyled`-wrapped) and are ignored unless the caller opts in with
 * `overStyled: true` — which the `mantine` escape hatch can still do
 * (`mantine={{ overStyled: true, style: {...} }}`). Not forwarded here.
 */

import { Switch as MantineSwitch } from '@recursica/mantine-adapter'
import type { SwitchProps } from '../../common/Switch'
import type { AssertWired } from '../../common/wiringCheck'

export default function Switch({ checked, onChange, disabled, mantine }: SwitchProps) {
    return (
        <MantineSwitch
            label={undefined}
            checked={checked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            disabled={disabled}
            {...mantine}
        />
    )
}

// Compile-time only — fails the build the moment SwitchProps declares a prop with no real,
// type-compatible home on the real Switch. `onChange` is excluded: adapted above (event ->
// boolean), same reasoning as Checkbox's identical exclusion. `colorVariant`/`sizeVariant` are
// excluded: upstream drives colour/size entirely from tokens, no per-instance override (this
// used to live as a documented drop in adapterPropContract.ts's PROP_CONTRACT['Switch'], now
// folded in here since this wrapper does its own translation).
type _Wiring = AssertWired<
    SwitchProps,
    typeof MantineSwitch,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onChange' | 'colorVariant' | 'sizeVariant'
>
const _wiringCheck: _Wiring = true
