/**
 * Mantine MenuItem Adapter
 *
 * An item in a Mantine Menu is just Menu.Item — there's no standalone MenuItem export
 * upstream, so this pulls it off the Menu static instead of a plain named import.
 *
 * Had ZERO contract coverage anywhere (not in PROP_CONTRACT, not in FIELD_COMPONENTS)
 * despite Forge declaring a rich vocabulary. The real Menu.Item type
 * (`RecursicaOverStyled<Omit<MenuItemProps, "color">>`, confirmed against @mantine/core's
 * own MenuItem.d.ts) is close to bare Mantine MenuItemProps with almost no Recursica
 * additions:
 *
 *   - leadingIcon -> leftSection (real, confirmed)
 *   - trailingIcon -> rightSection (real, confirmed)
 *   - children, disabled, onClick pass straight through unchanged
 *
 * Dropped — confirmed no real equivalent on Menu.Item:
 *   - leadingIconType — Forge's own affordance for choosing which glyph renders in
 *     leftSection (radio/checkbox/icon); the real component just takes a rendered node.
 *   - supportingText — no secondary text slot; only leftSection/rightSection/children exist.
 *   - selected / selectionState — no selected-state prop at all; upstream relies on the
 *     browser's own :hover/:focus and closeMenuOnClick, not a controlled visual state.
 *   - divider / dividerColor / dividerOpacity — modeled upstream as a separate `Menu.Divider`
 *     sibling element, not a prop on the item itself.
 *   - variant — no visual-variant prop; only `color` exists upstream (and Forge doesn't use
 *     it — the Recursica type explicitly Omits "color").
 */

import { Menu } from '@recursica/mantine-adapter'
import type { MenuItemProps } from '../../common/MenuItem'
import type { AssertWired } from '../../common/wiringCheck'

export default function MenuItem({
    children,
    leadingIcon,
    trailingIcon,
    disabled,
    onClick,
    mantine,
}: MenuItemProps) {
    return (
        <Menu.Item
            leftSection={leadingIcon}
            rightSection={trailingIcon}
            disabled={disabled}
            onClick={onClick}
            {...mantine}
        >
            {children}
        </Menu.Item>
    )
}

// Compile-time only — fails the build the moment MenuItemProps declares a prop with no real,
// type-compatible home on the real Menu.Item (directly, or via the renames below).
// `onClick` is excluded: the real component's polymorphic call signature types its native
// button props as effectively `any` (it accepts whatever the rendered element accepts), so
// there's nothing meaningful for the same-name structural check to compare against — the
// literal `onClick={onClick}` attribute above is what actually type-checks the handler.
type _Wiring = AssertWired<
    MenuItemProps,
    typeof Menu.Item,
    | 'layer'
    | 'mantine'
    | 'material'
    | 'carbon'
    | 'className'
    | 'style'
    | 'onClick'
    | 'variant'
    | 'leadingIconType'
    | 'supportingText'
    | 'selected'
    | 'selectionState'
    | 'divider'
    | 'dividerColor'
    | 'dividerOpacity',
    {
        leadingIcon: 'leftSection'
        trailingIcon: 'rightSection'
    }
>
const _wiringCheck: _Wiring = true
