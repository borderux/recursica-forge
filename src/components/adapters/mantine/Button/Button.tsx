/**
 * Mantine Button Adapter
 *
 * Confirmed clean: every Forge prop has a genuine, type-compatible real equivalent —
 * `variant`, `size` and `icon` land on `RecursicaButtonProps` directly; `disabled` and
 * `children` are declared on Mantine's own ButtonProps; `onClick`, `type` and `title` are
 * plain native `<button>` attributes the real (polymorphic) Button still forwards to its
 * default `"button"` element (confirmed: the adapter's own giant Omit list of blocked native
 * attributes on its non-generic call signature does not include any of the three). Written
 * as literal attributes (not a spread) so TypeScript actually checks what it can.
 *
 * `onClick`/`type`/`title` are excluded from the `AssertWired` check below for a narrower
 * reason than usual: TypeScript can't structurally extract them from the real Button's type.
 * The real Button is polymorphic — its type is an intersection of two independently-shaped
 * call signatures (a generic `<C>(props: PolymorphicComponentProps<C, ButtonProps>)` one and
 * a concrete `FunctionComponent<...>` one) — and conditional-type inference over such an
 * intersection resolves against the generic signature with its type parameter left abstract,
 * so the native-attribute merge that only happens once `C` resolves to a concrete element
 * never gets included. `variant`/`size`/`icon`/`disabled`/`children` still get checked for
 * real because those are declared directly on the adapter/Mantine `ButtonProps` interfaces,
 * not merged in through that generic-element mechanism.
 */

import { Button as MantineButton } from '@recursica/mantine-adapter'
import type { ButtonProps } from '../../common/Button'
import type { AssertWired } from '../../common/wiringCheck'

export default function Button({
    children,
    variant,
    size,
    disabled,
    onClick,
    type,
    icon,
    title,
    mantine,
}: ButtonProps) {
    return (
        <MantineButton
            variant={variant}
            size={size}
            disabled={disabled}
            onClick={onClick}
            type={type}
            icon={icon}
            title={title}
            {...mantine}
        >
            {children}
        </MantineButton>
    )
}

// Compile-time only — fails the build the moment ButtonProps declares a prop with no real,
// type-compatible home on the real Button. `onClick` | `type` | `title` are excluded — see
// header comment for why (a real destination that this check's type extraction can't reach
// on a polymorphic component, not a translation or a drop).
type _Wiring = AssertWired<
    ButtonProps,
    typeof MantineButton,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'onClick' | 'type' | 'title'
>
const _wiringCheck: _Wiring = true
