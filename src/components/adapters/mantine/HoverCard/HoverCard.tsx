/**
 * Mantine HoverCard Adapter
 *
 * @recursica/mantine-adapter's HoverCard is a COMPOSITION api: it renders `HoverCard.Target`
 * (the trigger element) and `HoverCard.Dropdown` (the panel shown on hover) as children,
 * rather than accepting Forge's flat `children`/`content` data props directly. This wrapper is
 * the one place that bridges the two.
 *
 * `isOpen` has no real home: the real HoverCard's props explicitly `Omit<PopoverProps, "opened"
 * | "onChange">` — hover-triggered open/close has no programmatic override upstream at all
 * (unlike Popover, which keeps both). Dropped rather than half-wired.
 *
 * `position`/`zIndex` are real, matching fields (`RecursicaHoverCardProps.position`, and
 * Mantine's own `zIndex`) but both sit on the adapter's `BlockedStylingKeys` list, so the real
 * component's exported type strips them out unless the caller opts in with `overStyled: true`.
 * Since these two are legitimate layout props (not cosmetic overrides), this wrapper flips
 * `overStyled` on automatically whenever either is actually provided, rather than dropping them.
 *
 * `className`/`style` stay dropped, same as every other `RecursicaOverStyled`-gated component —
 * the caller can still reach them through the `mantine` escape hatch
 * (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { HoverCard as MantineHoverCard } from '@recursica/mantine-adapter'
import type { HoverCardProps } from '../../common/HoverCard'
import type { AssertWired } from '../../common/wiringCheck'

export default function HoverCard({
  children,
  content,
  withBeak = false,
  position,
  zIndex,
  mantine,
}: HoverCardProps) {
  const target = children !== undefined ? <MantineHoverCard.Target>{children}</MantineHoverCard.Target> : null
  const dropdown = content !== undefined ? <MantineHoverCard.Dropdown>{content}</MantineHoverCard.Dropdown> : null

  return position !== undefined || zIndex !== undefined ? (
    <MantineHoverCard overStyled withBeak={withBeak} position={position} zIndex={zIndex} {...mantine}>
      {target}
      {dropdown}
    </MantineHoverCard>
  ) : (
    <MantineHoverCard withBeak={withBeak} {...mantine}>
      {target}
      {dropdown}
    </MantineHoverCard>
  )
}

// `children`/`content` are composed into `HoverCard.Target`/`HoverCard.Dropdown` above, not
// forwarded raw. `isOpen` is dropped per the comment above (no upstream controlled-open hook).
// `position`/`zIndex` ARE wired above (see the `overStyled` branch) but still need to be
// listed here: both only exist on the `overStyled: true` half of the real component's
// `RecursicaOverStyled` union, and `keyof` over a union only keeps keys common to every
// member, so the static check can't see them on the type as a whole even though the literal
// JSX attributes above are fully type-checked against the real (narrowed) prop shape.
// `className`/`style` are dropped per the comment above.
type _Wiring = AssertWired<
  HoverCardProps,
  typeof MantineHoverCard,
  | 'children'
  | 'content'
  | 'isOpen'
  | 'position'
  | 'zIndex'
  | 'layer'
  | 'elevation'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon'
>
const _wiringCheck: _Wiring = true
