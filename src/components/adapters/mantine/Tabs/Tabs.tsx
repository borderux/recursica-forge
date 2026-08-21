/**
 * Mantine Tabs Adapter
 *
 * This wrapper is only for the root `Tabs` component (registered via this file) — `Tabs.List`
 * / `Tabs.Tab` / `Tabs.Panel` are hand-written directly against raw `@mantine/core` inside the
 * shared dispatcher (`adapters/Tabs.tsx`) and are untouched here.
 *
 * Almost a clean pass-through: `value`, `defaultValue`, `onChange`, `orientation`, `variant`
 * (confirmed as the same 3-value union — `'default' | 'outline' | 'pills'` — on the real
 * `RecursicaTabsProps`), `children` all match directly. `tabContentAlignment` has no real
 * equivalent — moved in here from adapterPropContract.ts's `PROP_CONTRACT['Tabs']` entry,
 * which documented the same gap.
 */

import { Tabs as MantineTabs } from '@recursica/mantine-adapter'
import type { TabsProps } from '../../common/Tabs'
import type { AssertWired } from '../../common/wiringCheck'

export default function Tabs({
    value,
    defaultValue,
    onChange,
    orientation,
    variant,
    children,
    mantine,
}: TabsProps) {
    return (
        <MantineTabs
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            orientation={orientation}
            variant={variant}
            {...mantine}
        >
            {children}
        </MantineTabs>
    )
}

// Compile-time only — fails the build the moment TabsProps declares a prop with no real,
// type-compatible home on the real Tabs. `tabContentAlignment` is excluded with no rename and
// no adaptation: confirmed no real equivalent exists (see header).
type _Wiring = AssertWired<
    TabsProps,
    typeof MantineTabs,
    'layer' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'tabContentAlignment'
>
const _wiringCheck: _Wiring = true
