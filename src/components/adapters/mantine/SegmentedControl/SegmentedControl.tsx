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
 * `className`/`style` aren't forwarded either: the adapter styles itself purely from tokens
 * and ignores both unless the caller opts in with `overStyled: true` — which the `mantine`
 * escape hatch can still do (`mantine={{ overStyled: true, style: {...} }}`).
 */

import { SegmentedControl as MantineSegmentedControl } from '@recursica/mantine-adapter'
import type { SegmentedControlAdapterProps } from '../../common/SegmentedControl'
import type { AssertWired } from '../../common/wiringCheck'

export default function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  orientation,
  fullWidth,
  showLabel = true,
  mantine,
}: SegmentedControlAdapterProps) {
  const data = items.map((item) => ({
    value: item.value,
    label: (showLabel === false ? item.icon : (item.label ?? item.icon)) ?? item.value,
    disabled: item.disabled,
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
    />
  )
}

// `items` is reshaped into `data` above, not forwarded raw. `showLabel` never arrives
// (stripped by FORGE_ONLY_PROPS before this wrapper runs) — its icon-only branch above only
// ever sees its own `= true` default for that reason. `disabled` is excluded with no rename:
// the real type explicitly forbids it (`disabled: never`, "SegmentedControl explicitly
// forbids disabled prop") — only per-item `disabled` (via `items`) has a real destination.
// `layer`/`elevation`/`componentNameForCssVars`/`selectionState` never arrive
// (FORGE_ONLY_PROPS). `className`/`style` aren't forwarded — see the header comment.
type _Wiring = AssertWired<
  SegmentedControlAdapterProps,
  typeof MantineSegmentedControl,
  | 'items'
  | 'showLabel'
  | 'disabled'
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
