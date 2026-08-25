/**
 * Mantine SegmentedControl Adapter
 *
 * @recursica/mantine-adapter's SegmentedControl takes Mantine's `data` array, not Forge's
 * `items`. This wrapper is the one place that translates between the two shapes.
 *
 * `showLabel`, `componentNameForCssVars` and `selectionState` have no upstream equivalent —
 * upstream's selected-segment styling is entirely token-driven — so they're simply not
 * forwarded, the same way an adapter gap is dropped for any other component.
 *
 * `disabled` (whole-control) (2026-08, upstreamed — see
 * `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #8): the real type now has a genuine top-level
 * `disabled?: boolean` (previously `disabled: never`) — a direct pass-through, no more
 * synthesizing it via every item's own `disabled`.
 *
 * `item.icon` (2026-08, upstreamed — see ask #7): `data` items now have a real `icon` slot,
 * composed together with `label` by the real component itself (using its own icon-size/gap
 * tokens) rather than Forge having to inline one ReactNode into `label` by hand. Previously
 * that forced an either/or choice — an item with both `icon` and `label` only ever showed the
 * label once `showLabel` was true, silently dropping the icon — unlike Material/Carbon, which
 * have always shown both together. Now consistent across all three kits.
 *
 * `className`/`style` aren't forwarded either: the adapter styles itself purely from tokens
 * and ignores both unless the caller opts in with `overStyled: true` — which the `mantine`
 * escape hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import React from 'react'
import { SegmentedControl as MantineSegmentedControl } from '@recursica/mantine-adapter'
import type { SegmentedControlAdapterProps } from '../../common/SegmentedControl'
import type { AssertWired } from '../../common/wiringCheck'

export default React.forwardRef<any, SegmentedControlAdapterProps>(function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  orientation,
  fullWidth,
  disabled,
  showLabel = true,
  mantine,
}, ref) {
  const data = items.map((item) => {
    const label = showLabel === false ? undefined : (item.label ?? item.value)
    return {
      value: item.value,
      icon: item.icon,
      // Fall back to the raw value as text only when there's neither a label to show nor an
      // icon to show instead — otherwise the segment would render nothing at all.
      label: label ?? (item.icon ? undefined : item.value),
      disabled: item.disabled,
    }
  })

  return (
    <MantineSegmentedControl
      data={data}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      orientation={orientation}
      fullWidth={fullWidth}
      disabled={disabled}
      {...mantine}
      ref={ref}
    />
  )
})

// `items` is reshaped into `data` above, not forwarded raw. `showLabel` never arrives
// (stripped by FORGE_ONLY_PROPS before this wrapper runs) — its icon-only branch above only
// ever sees its own `= true` default for that reason. `disabled` is no longer excluded — it's
// a direct same-name pass-through now (see header). `layer`/`elevation`/
// `componentNameForCssVars`/`selectionState` never arrive (FORGE_ONLY_PROPS). `className`/
// `style` aren't forwarded — see the header comment.
type _Wiring = AssertWired<
  SegmentedControlAdapterProps,
  typeof MantineSegmentedControl,
  | 'items'
  | 'showLabel'
  | 'layer'
  | 'elevation'
  | 'componentNameForCssVars'
  | 'selectionState'
  | 'className'
  | 'style'
  | 'mantine'
  | 'material'
  | 'carbon'
>
const _wiringCheck: _Wiring = true
