/**
 * Mantine Card Adapter
 *
 * @recursica/mantine-adapter's Card is a COMPOSITION api — `title` and `footer` have no matching
 * props on the real component at all. Instead it renders `Card.Header`/`Card.Footer` (and
 * `Card.Section`) children around the card's body content. This wrapper is the one place that
 * bridges Forge's flat `title`/`footer` props onto that shape.
 *
 * `withDividers` has no real equivalent: the real `Card.Header`/`Card.Footer` sub-components
 * only accept `children` (`RecursicaCardSectionProps`) — there is no global divider toggle.
 * Only the raw `Card.Section` (which this wrapper doesn't use for title/footer) exposes a
 * per-section `withBorder`, so per-section dividers would need per-section control this wrapper
 * has no Forge-level prop for. Dropped rather than half-wired.
 *
 * `cardLayer`/`elevationBoxShadow` are internal to the `Card` dispatcher (`adapters/Card.tsx`),
 * which computes them from the brand layer system purely to feed the box-shadow CSS variables —
 * there's no upstream prop to receive them (`boxShadow` is itself one of the adapter's blocked
 * styling keys), so they're intentionally left unforwarded here, same as before.
 *
 * `className`/`style` aren't forwarded either: the real Card is gated by `RecursicaOverStyled`
 * and ignores both unless the caller opts in with `overStyled: true` — which the `mantine`
 * escape hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { Card as MantineCard } from '@recursica/mantine-adapter'
import type { CardProps } from '../../common/Card'
import type { AssertWired } from '../../common/wiringCheck'

export default function Card({
  children,
  title,
  footer,
  withBorder = true,
  mantine,
}: CardProps) {
  return (
    <MantineCard withBorder={withBorder} {...mantine}>
      {title !== undefined && <MantineCard.Header>{title}</MantineCard.Header>}
      {children}
      {footer !== undefined && <MantineCard.Footer>{footer}</MantineCard.Footer>}
    </MantineCard>
  )
}

// `title`/`footer` are composed into `Card.Header`/`Card.Footer` above, not forwarded raw.
// `cardLayer`/`elevationBoxShadow`/`withDividers` are dropped per the comments above.
// `className`/`style` are dropped per the `RecursicaOverStyled` note above.
type _Wiring = AssertWired<
  CardProps,
  typeof MantineCard,
  | 'title'
  | 'footer'
  | 'layer'
  | 'cardLayer'
  | 'elevationBoxShadow'
  | 'withDividers'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon'
>
const _wiringCheck: _Wiring = true
