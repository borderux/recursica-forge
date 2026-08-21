/**
 * Mantine Popover Adapter
 *
 * Same structural shape as HoverCard: @recursica/mantine-adapter's Popover is a COMPOSITION
 * api, rendering `Popover.Target` (the trigger) and `Popover.Dropdown` (the panel) as children
 * rather than accepting Forge's flat `children`/`content` props. This wrapper bridges the two.
 *
 * Unlike HoverCard, Popover's real root keeps a genuine controlled-open hook: `isOpen` renames
 * directly onto Mantine's own `opened`, and `onClose` is already an exact-name, exact-shape
 * match (`() => void`) — both wired below as real, not dropped.
 *
 * `position` is a real, matching field too, and — unlike every other `RecursicaOverStyled`-gated
 * component — the adapter re-adds it *outside* the blocked-styling-keys gate specifically for
 * Popover (`RecursicaPopoverProps` doesn't even declare it; it comes back in via a plain
 * `position?: PopoverProps_2["position"]` intersected onto the exported type), so no
 * `overStyled` escape hatch is needed to use it.
 *
 * `zIndex` has no such carve-out — it's still gated by `BlockedStylingKeys` — so this wrapper
 * flips `overStyled` on automatically whenever a `zIndex` is actually provided, the same way
 * HoverCard does. `className`/`style` stay dropped; the `mantine` escape hatch
 * (`mantine={{ overStyled: true, style: {...} }}`) still reaches them.
 */

import { Popover as MantinePopover } from '@recursica/mantine-adapter'
import type { PopoverProps } from '../../common/Popover'
import type { AssertWired } from '../../common/wiringCheck'

export default function Popover({
  children,
  content,
  isOpen,
  onClose,
  withBeak = false,
  position,
  zIndex,
  mantine,
}: PopoverProps) {
  const target = children !== undefined ? <MantinePopover.Target>{children}</MantinePopover.Target> : null
  const dropdown = content !== undefined ? <MantinePopover.Dropdown>{content}</MantinePopover.Dropdown> : null

  return zIndex !== undefined ? (
    <MantinePopover
      overStyled
      opened={isOpen}
      onClose={onClose}
      withBeak={withBeak}
      position={position}
      zIndex={zIndex}
      {...mantine}
    >
      {target}
      {dropdown}
    </MantinePopover>
  ) : (
    <MantinePopover opened={isOpen} onClose={onClose} withBeak={withBeak} position={position} {...mantine}>
      {target}
      {dropdown}
    </MantinePopover>
  )
}

// `children`/`content` are composed into `Popover.Target`/`Popover.Dropdown` above, not
// forwarded raw. `isOpen` renames onto the real `opened` field (see `Rename` below).
// `zIndex` IS wired above (the `overStyled` branch) but still has to be listed here: it only
// exists on the `overStyled: true` half of the real component's `RecursicaOverStyled` union,
// and `keyof` over a union only keeps keys common to every member, so the static check can't
// see it on the type as a whole even though the literal JSX attribute above is fully
// type-checked against the real (narrowed) prop shape. `position` needs no such exemption —
// the adapter re-adds it outside the union entirely, so it's left wired and checked normally.
// `className`/`style` are dropped per the comment above.
type _Wiring = AssertWired<
  PopoverProps,
  typeof MantinePopover,
  | 'children'
  | 'content'
  | 'zIndex'
  | 'layer'
  | 'elevation'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon',
  { isOpen: 'opened' }
>
const _wiringCheck: _Wiring = true
