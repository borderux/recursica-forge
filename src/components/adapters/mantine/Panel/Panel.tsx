/**
 * Mantine Panel Adapter
 *
 * @recursica/mantine-adapter's Panel is a Mantine Drawer: it has an `opened` flag and renders
 * display:none while closed, and its footer is a composed `Panel.Footer` child rather than a
 * `footer` prop (Mantine's Drawer has no footer concept at all). This wrapper is the one place
 * that bridges Forge's always-mounted, prop-driven Panel onto that shape.
 *
 * Forge's Panel was an always-rendered edge panel whose visibility came from *mounting* it, so
 * callers that pass no `isOpen` at all (e.g. TypeStylePanel) expect it to simply show up.
 * Defaulting `opened` to true preserves that mount-to-show contract while still letting anyone
 * who does control `isOpen` drive it explicitly.
 *
 * `width` has no upstream equivalent — RecursicaPanelProps omits `size`/`styles`/`classNames`/
 * `style` from Mantine's Drawer props, so panel width is token-only — and is deliberately not
 * forwarded, the same way any other adapter gap is dropped. `className` and `zIndex` aren't
 * forwarded either: both are on the adapter's blocked-styling-keys list, ignored unless the
 * caller opts in with `overStyled: true` — which the `mantine` escape hatch can still do
 * (`mantine={{ overStyled: true, zIndex, style: {...} }}`).
 *
 * `overlay` (Forge's "fixed, full-viewport-height panel" toggle) also has no upstream
 * equivalent: the real Panel is always a Mantine Drawer, which is inherently a fixed-position
 * overlay with a backdrop — there is no non-overlay/always-visible edge-panel mode to switch
 * to, so the flag is silently unread rather than half-honored.
 */

import { Panel as MantinePanel, PanelFooter } from '@recursica/mantine-adapter'
import type { PanelAdapterProps } from '../../common/Panel'
import type { AssertWired } from '../../common/wiringCheck'

export default function Panel({
  children,
  title,
  footer,
  position = 'right',
  isOpen,
  onClose,
  mantine,
}: PanelAdapterProps) {
  return (
    <MantinePanel
      title={title}
      placement={position}
      opened={isOpen ?? true}
      onClose={onClose ?? (() => {})}
      {...mantine}
    >
      {children}
      {footer && <PanelFooter>{footer}</PanelFooter>}
    </MantinePanel>
  )
}

// `footer` is composed into `Panel.Footer` above, not forwarded raw. `isOpen`/`onClose` are
// excluded: each carries a real value transformation (a default fallback), not a straight
// rename, so the literal attributes above are what actually get checked. `width` and
// `overlay` are excluded with no rename: real Panel is always a Mantine Drawer (inherently a
// fixed-position overlay with backdrop), so there's no non-overlay/always-visible mode to
// toggle, and width stays token-only. `layer`/`elevation` never arrive (stripped by
// FORGE_ONLY_PROPS before this wrapper runs). `className`/`zIndex`/`style` aren't forwarded —
// see the header comment.
type _Wiring = AssertWired<
  PanelAdapterProps,
  typeof MantinePanel,
  | 'footer'
  | 'isOpen'
  | 'onClose'
  | 'width'
  | 'overlay'
  | 'layer'
  | 'elevation'
  | 'className'
  | 'zIndex'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon',
  { position: 'placement' }
>
const _wiringCheck: _Wiring = true
