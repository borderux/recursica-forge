/**
 * Mantine Timeline Adapter
 *
 * @recursica/mantine-adapter's Timeline is a COMPOSITION api: it renders `Timeline.Item`
 * children rather than accepting Forge's data-driven `items` array directly. This wrapper is
 * the one place that bridges the two.
 *
 * Per item: `title` and `bullet` are real, matching fields. `description` maps onto the real
 * `Timeline.Item`'s `children` — its own docs describe that slot as "content displayed below
 * the title", which is exactly Forge's `description`. `timestamp` maps onto
 * `RecursicaTimelineItemProps.timestamp`, which the real component was extended to support
 * natively. `lineVariant` has no home: the real `TimelineItem_2` type explicitly
 * `Omit<TimelineItemProps_2, "radius" | "color" | "lineVariant">`s it out even though upstream
 * Mantine's own `TimelineItem` has an identically-shaped `lineVariant` prop — the adapter
 * strips it structurally, not just behind `RecursicaOverStyled`, so there's no `overStyled`
 * escape hatch that brings it back. Dropped, per-item, rather than half-wired.
 *
 * `active`/`align` are real, matching root fields, passed through unchanged. Forge's root
 * `children` prop is dropped: nothing in the app passes raw JSX children to `Timeline` (every
 * call site drives it through `items`), and now that `items` composes the real `Timeline.Item`
 * children, there's nothing left for a raw `children` override to usefully do.
 *
 * `className`/`style` aren't forwarded: the real Timeline is gated by `RecursicaOverStyled` and
 * ignores both unless the caller opts in with `overStyled: true` — which the `mantine` escape
 * hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { Timeline as MantineTimeline, TimelineItem as MantineTimelineItem } from '@recursica/mantine-adapter'
import type { TimelineProps } from '../../common/Timeline'
import type { AssertWired } from '../../common/wiringCheck'

export default function Timeline({
  active,
  align = 'left',
  items = [],
  mantine,
}: TimelineProps) {
  return (
    <MantineTimeline active={active} align={align} {...mantine}>
      {items.map((item, index) => (
        <MantineTimelineItem key={index} title={item.title} bullet={item.bullet} timestamp={item.timestamp}>
          {item.description}
        </MantineTimelineItem>
      ))}
    </MantineTimeline>
  )
}

// `items` is composed into `Timeline.Item` children above, not forwarded raw. `children` is
// dropped per the comment above (no call site relies on it, and `items` now drives
// composition). `className`/`style` are dropped per the `RecursicaOverStyled` note above.
type _Wiring = AssertWired<
  TimelineProps,
  typeof MantineTimeline,
  'items' | 'children' | 'layer' | 'className' | 'style' | 'mantine' | 'material' | 'carbon'
>
const _wiringCheck: _Wiring = true
