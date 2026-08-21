/**
 * Mantine Link Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body.
 *
 * `startIcon` -> `icon` (renamed; the real Link only has one icon slot and always renders it
 * leading, matching Forge's `startIcon` semantics exactly — confirmed in the compiled adapter,
 * the icon wrapper is unconditionally rendered before the label text). Previously documented
 * in adapterPropContract.ts's PROP_CONTRACT['Link'], moved here now that this wrapper does its
 * own translation.
 *
 * `endIcon` — dropped. The adapter's Link supports a single leading icon only; there is no
 * trailing-icon slot to render `endIcon` into.
 *
 * `underline` — dropped, and genuinely unreachable, not merely omitted from the type: the real
 * Link's own type Omits `underline` entirely (`Omit<AnchorProps, "underline">`), *and* the
 * compiled implementation hardcodes `underline: "never"` after spreading the rest of the
 * props, so even forcing it through via `mantine`/`as any` would be silently overwritten.
 * There is no escape hatch that reaches it.
 *
 * `showIcon` / `iconPosition` — dropped from this wrapper's own forwarding. The dispatcher
 * (`adapters/Link.tsx`) already resolves these into `startIcon`/`endIcon` before this
 * component ever sees them (reading the toolbar's icon-name/position CSS vars and rendering
 * the resolved icon into whichever of `startIcon`/`endIcon` applies) — passing the raw flags
 * through again here would have nothing left to do.
 *
 * `className` / `style` (and `inlineStyle`, folded into `style` by the dispatcher's own
 * `mapLinkProps` before this wrapper ever runs) are on the adapter's blocked-styling-keys list
 * (the real Link type is `RecursicaOverStyled`-wrapped) and are ignored unless the caller
 * opts in with `overStyled: true` — which the `mantine` escape hatch can still do
 * (`mantine={{ overStyled: true, style: {...} }}`). Nothing in this app currently sets either
 * on `<Link>`, so left dropped rather than forced on.
 *
 * `variant` / `size` match directly: the real Link inherits Mantine's generic
 * `variant?: string` / `size?: string`-compatible catch-alls (via `StylesApiProps`/`TextProps`),
 * which a plain Forge `string` is assignable to.
 */

import { Link as MantineLink } from '@recursica/mantine-adapter'
import type { LinkProps } from '../../common/Link'
import type { AssertWired } from '../../common/wiringCheck'

export default function Link({
    children,
    href,
    target,
    rel,
    onClick,
    startIcon,
    title,
    variant,
    size,
    mantine,
}: LinkProps) {
    return (
        <MantineLink
            href={href}
            target={target}
            rel={rel}
            onClick={onClick}
            icon={startIcon}
            title={title}
            variant={variant}
            size={size}
            {...mantine}
        >
            {children}
        </MantineLink>
    )
}

// Compile-time only — fails the build the moment LinkProps declares a prop with no real,
// type-compatible home on the real Link — directly, or via the rename below.
//
// `endIcon`, `underline`, `showIcon`, `iconPosition`, `className`, `style`, `inlineStyle` are
// all excluded: genuinely dropped, see header comment for why each has no real (or reachable)
// destination. `forceState` is Forge-internal (see FORGE_ONLY_PROPS), handled centrally.
//
// `href`/`target`/`rel`/`onClick`/`title` are excluded too, but for a different reason: the
// real Link is polymorphic (`component` may swap the rendered tag), so its exported type is a
// union of "default `<a>`, native attributes merged in" vs. "custom `component`, no native
// attributes assumed". `keyof` over a union only sees keys common to *every* branch, and the
// custom-`component` branch has none of the native anchor attributes — so this generic check
// can't see them even though they're real: they're present in the default-`<a>` branch (
// confirmed structurally in the adapter's own .d.ts) and the literal JSX attributes above
// type-check them correctly on their own.
type _Wiring = AssertWired<
    LinkProps,
    typeof MantineLink,
    | 'layer' | 'elevation' | 'mantine' | 'material' | 'carbon'
    | 'endIcon' | 'underline' | 'showIcon' | 'iconPosition' | 'className' | 'style' | 'inlineStyle' | 'forceState'
    | 'href' | 'target' | 'rel' | 'onClick' | 'title',
    { startIcon: 'icon' }
>
const _wiringCheck: _Wiring = true
