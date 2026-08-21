/**
 * Mantine Menu Adapter
 *
 * The real Menu is Mantine's composable Menu (confirmed via @recursica/mantine-adapter's own
 * `MenuProps_2 & RecursicaMenuProps`, the latter contributing nothing beyond the Mantine
 * shape) — `children` is expected to be `Menu.Target`/`Menu.Dropdown` composition, which
 * passes straight through unchanged; Forge's own `MenuItem` is separately registered as
 * `Menu.Item`, confirming composition is already how callers use this.
 *
 * `maxHeight` is dropped: no real prop on Mantine's Menu (or its Dropdown) accepts a max
 * height for the dropdown panel — an adapter gap, not an oversight.
 */

import { Menu as MantineMenu } from '@recursica/mantine-adapter'
import type { MenuProps } from '../../common/Menu'
import type { AssertWired } from '../../common/wiringCheck'

export default function Menu({
    children,
    mantine,
}: MenuProps) {
    return (
        <MantineMenu {...mantine}>
            {children}
        </MantineMenu>
    )
}

// Compile-time only — fails the build the moment MenuProps declares a prop with no real,
// type-compatible home on the real Menu. `maxHeight` is excluded with no rename: confirmed
// no real slot exists on Mantine's Menu/Menu.Dropdown for a dropdown max-height.
type _Wiring = AssertWired<
    MenuProps,
    typeof MantineMenu,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'maxHeight'
>
const _wiringCheck: _Wiring = true
