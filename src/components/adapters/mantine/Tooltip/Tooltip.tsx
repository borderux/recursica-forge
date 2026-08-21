/**
 * Mantine Tooltip Adapter
 *
 * Not actually a 1:1 pass-through, despite how it looked before this file had a body.
 *
 * REAL BUGS FIXED HERE, both stemming from the same collision: `position` and `zIndex` are
 * both on the adapter's blocked-styling-keys list (the real Tooltip type is
 * `RecursicaOverStyled`-wrapped, and that list blocks the generic CSS `position`/`zIndex`
 * style properties) — but Mantine's Tooltip also happens to use the *name* `position` for its
 * floating-placement prop (`FloatingPosition`, e.g. `"top-start"`), a completely different,
 * non-cosmetic concept that collides on the name alone. Confirmed in the compiled adapter:
 * Tooltip's own implementation special-cases `position` (destructured out before the
 * blocked-key filter runs, so it always works regardless of `overStyled`) — but the *type*
 * doesn't know that special case exists, so the exported type still requires
 * `overStyled: true` to accept `position` at all. `zIndex` gets no such special-case at
 * runtime either, so it really was being silently stripped every time (Tooltip positioning
 * without `overStyled` still visually "worked" only because Mantine defaults `position` to
 * `"top"`, matching Forge's own default, hiding the gap). This wrapper renders with
 * `overStyled: true` unconditionally to make both work for real, plus `className`/`style` as
 * a bonus fix for the same underlying gap — none of the three has any effect when the caller
 * doesn't provide a value, and setting `overStyled` doesn't disable the component's own
 * default token-driven styling (verified in the compiled adapter: default classNames are
 * merged in unconditionally).
 *
 * `position` + `alignment` are reshaped together into the real compound `position` string
 * (`FloatingPosition = FloatingSide | \`${FloatingSide}-${'start'|'end'}\`\`, confirmed against
 * @mantine/core's own Floating types): `alignment: 'middle'` maps to the plain side, `'start'`/
 * `'end'` map to `"<side>-start"`/`"<side>-end"`. A real fix rather than dropping `alignment`.
 */

import { Tooltip as MantineTooltip } from '@recursica/mantine-adapter'
import type { TooltipProps } from '../../common/Tooltip'
import type { AssertWired } from '../../common/wiringCheck'

function toFloatingPosition(
    position: NonNullable<TooltipProps['position']>,
    alignment: NonNullable<TooltipProps['alignment']>
): `${typeof position}` | `${typeof position}-start` | `${typeof position}-end` {
    if (alignment === 'start') return `${position}-start`
    if (alignment === 'end') return `${position}-end`
    return position
}

export default function Tooltip({
    children,
    label,
    position = 'top',
    alignment = 'middle',
    opened,
    zIndex,
    withinPortal,
    className,
    style,
    mantine,
}: TooltipProps) {
    return (
        <MantineTooltip
            overStyled
            label={label}
            position={toFloatingPosition(position, alignment)}
            opened={opened}
            zIndex={zIndex}
            withinPortal={withinPortal}
            className={className}
            style={style}
            {...mantine}
        >
            {children}
        </MantineTooltip>
    )
}

// Compile-time only — fails the build the moment TooltipProps declares a prop with no real,
// type-compatible home on the real Tooltip.
//
// `position`/`alignment` are excluded: reshaped together into the real compound `position`
// string above, so checking either name individually against the untranslated shape would be
// a false positive. `zIndex`/`className`/`style` are excluded: real, functioning props (see
// header comment) that only compile because this wrapper renders with `overStyled: true` —
// `RecursicaOverStyled`'s discriminated-union type means `keyof` on the real component's props
// can't see any blocked-styling key at all (present in one union branch, absent in the other),
// so this generic check would flag them as having "no real field under this name" even though
// the literal JSX attributes above already type-check them correctly.
type _Wiring = AssertWired<
    TooltipProps,
    typeof MantineTooltip,
    'layer' | 'elevation' | 'mantine' | 'material' | 'carbon' | 'position' | 'alignment' | 'zIndex' | 'className' | 'style'
>
const _wiringCheck: _Wiring = true
