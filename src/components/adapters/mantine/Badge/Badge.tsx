/**
 * Mantine Badge Adapter
 *
 * Not a 1:1 pass-through: confirmed against @mantine/core's own BadgeProps (the real
 * component's base, `Omit<BadgeProps, "variant" | "size" | "color" | "radius"> &
 * RecursicaBadgeProps`) that `size` has no real destination — Mantine's own sizing is
 * explicitly omitted upstream with nothing to replace it.
 *
 * `variant` maps onto a real, matching slot (`RecursicaBadgeProps.variant`), but Forge
 * deliberately types its own `variant` as an open `string` — the material/carbon Badge
 * implementations both key CSS vars off arbitrary custom variant names (e.g. `'my-badge'`),
 * confirmed in adapters/material/Badge/Badge.tsx's own comment — wider than the real adapter's
 * `'alert' | 'primary-color' | 'success' | 'warning'` union, which only enumerates its four
 * known values. The cast below is the actual translation (same spirit as DatePicker's
 * `layout`): a custom variant name still flows through unchanged at runtime (it's a plain
 * string prop with no runtime validation), it just isn't statically provable to be one of the
 * four known members.
 */

import { Badge as MantineBadge } from '@recursica/mantine-adapter'
import type { BadgeProps } from '../../common/Badge'
import type { AssertWired } from '../../common/wiringCheck'

export default function Badge({
    children,
    variant,
    mantine,
}: BadgeProps) {
    return (
        <MantineBadge
            variant={variant as 'alert' | 'primary-color' | 'success' | 'warning' | undefined}
            {...mantine}
        >
            {children}
        </MantineBadge>
    )
}

// Compile-time only — fails the build the moment BadgeProps declares a prop with no real,
// type-compatible home on the real Badge. `variant` is excluded: Forge deliberately types it
// as an open `string` (to accept custom variant names elsewhere in the app), wider than the
// real 'alert' | 'primary-color' | 'success' | 'warning' union — the cast above is the actual
// translation, and it's what gets type-checked. `size` is excluded with no rename: confirmed
// omitted upstream with no replacement — an adapter gap, not an oversight.
type _Wiring = AssertWired<
    BadgeProps,
    typeof MantineBadge,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'className' | 'style' | 'variant' | 'size'
>
const _wiringCheck: _Wiring = true
