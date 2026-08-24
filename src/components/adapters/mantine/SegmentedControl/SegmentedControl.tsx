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
 * `disabled` (whole-control) has no real destination either — the real type explicitly
 * forbids it (`disabled: never`) — but unlike the props above, this one is synthesized rather
 * than dropped: every item is marked `disabled` (OR'd with its own `disabled`) so the whole
 * control ends up visually and functionally disabled via the one mechanism upstream does
 * support (per-item `disabled`, through `data`).
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
  const data = items.map((item) => ({
    value: item.value,
    label: (showLabel === false ? item.icon : (item.label ?? item.icon)) ?? item.value,
    disabled: disabled || item.disabled,
  }))

  return (
    <MantineSegmentedControl
      data={data}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      orientation={orientation}
      fullWidth={fullWidth}
      {...mantine}
      ref={ref}
    />
  )
})

// `items` is reshaped into `data` above, not forwarded raw. `showLabel` never arrives
// (stripped by FORGE_ONLY_PROPS before this wrapper runs) — its icon-only branch above only
// ever sees its own `= true` default for that reason. Whole-control `disabled` is excluded
// with no rename: it's synthesized into every item's `disabled` above (see header comment),
// not forwarded as a literal attribute, so checking its untranslated shape here would be a
// false positive — the real type still forbids it directly (`disabled: never`).
// `layer`/`elevation`/`componentNameForCssVars`/`selectionState` never arrive
// (FORGE_ONLY_PROPS). `className`/`style` aren't forwarded — see the header comment.
type _Wiring = AssertWired<
  SegmentedControlAdapterProps,
  typeof MantineSegmentedControl,
  | 'items'
  | 'disabled'
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
