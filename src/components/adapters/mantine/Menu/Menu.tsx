/**
 * Mantine Menu Adapter
 *
 * The real Menu is Mantine's composable Menu (confirmed via @recursica/mantine-adapter's own
 * `MenuProps_2 & RecursicaMenuProps`, the latter contributing nothing beyond the Mantine
 * shape) — `children` is expected to be `Menu.Target`/`Menu.Dropdown` composition; Forge's own
 * `MenuItem` is separately registered as `Menu.Item`, confirming composition is how callers
 * of the real component use this.
 *
 * Forge's own `MenuProps` has no Target/Dropdown concept, though — every Forge caller (see
 * MenuPreview.tsx) just passes a flat list of MenuItems, wanting an always-visible menu body
 * rather than a real click-to-open dropdown. `Menu.Dropdown` is what actually supplies the
 * floating box's background/border/shadow/vertical-stack styling (`Menu` itself renders
 * neither), and `Menu.Target` needs a real anchor element to position against — without both,
 * `Menu.Item`s fall back to raw inline buttons with no container, which is why they used to
 * render as a horizontal, undropdown-shaped row. So this wrapper synthesizes an invisible
 * `Menu.Target` and defaults `opened` to true, mirroring `Panel.tsx`'s identical "force the
 * real Popover-based component open for a static preview" fix. `withinPortal` defaults to
 * false so the dropdown stays a normal DOM descendant instead of escaping to `document.body`
 * (Forge's preview canvas may apply CSS transforms for zoom/pan, which a portaled element
 * would no longer inherit). Both are overridable via the `mantine` escape hatch.
 */

import React from 'react'
import { Menu as MantineMenu } from '@recursica/mantine-adapter'
import type { MenuProps } from '../../common/Menu'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, MenuProps>(function Menu({
    children,
    maxHeight,
    mantine,
}, ref) {
    // The real Menu is a plain function component (not wrapped in React.forwardRef upstream),
    // so its exported prop type has no `ref` slot — spread `{ ref }` from an `any`-typed
    // object rather than a literal `ref={ref}` attribute to avoid a spurious excess-property
    // error while still attaching the ref at runtime for whenever upstream adds support.
    return (
        <MantineMenu opened withinPortal={false} maxHeight={maxHeight} {...mantine} {...({ ref } as any)}>
            <MantineMenu.Target>
                <span aria-hidden style={{ display: 'inline-block', width: 0, height: 0 }} />
            </MantineMenu.Target>
            <MantineMenu.Dropdown>
                {children}
            </MantineMenu.Dropdown>
        </MantineMenu>
    )
})

// Compile-time only — fails the build the moment MenuProps declares a prop with no real,
// type-compatible home on the real Menu.
type _Wiring = AssertWired<
    MenuProps,
    typeof MantineMenu,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
