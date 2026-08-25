/**
 * Slider — common types
 *
 * Single source of truth for the Slider prop vocabulary, shared by the dispatcher
 * (`adapters/Slider.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Slider`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SliderProps = {
  /**
   * The `[number, number]` range-tuple case is NOT equally supported across kits — a genuine,
   * permanent capability ceiling, not a temporary gap:
   *   - Material: fully real — MUI's own `<Slider>` natively supports a two-thumb draggable
   *     track when given an array `value`.
   *   - Carbon: only half-real — the wrapper's optional numeric inputs (`showInput`) correctly
   *     read/write `value[0]`/`value[1]`, but the draggable track itself only ever renders a
   *     single thumb bound to `value[0]`; there is no second handle, so the upper bound can't
   *     be set by dragging at all. `@carbon/react`'s `<Slider>` does have a real two-handle
   *     mode (`unstable_valueUpper`/`onChange({ value, valueUpper })`), it's just not wired up
   *     — a known, currently-unaddressed gap in this wrapper, not a Carbon limitation.
   *   - Mantine: not supported at all — the real `@recursica/mantine-adapter` `Slider` only
   *     wraps Mantine's single-thumb `Slider`, never `RangeSlider`. An upstream ask was
   *     declined (2026-08, permanent — see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #10); a
   *     tuple `value` is dropped to `undefined` on this kit rather than crashing.
   */
  value: number | [number, number]
  onChange: (value: number | [number, number]) => void
  onChangeCommitted?: (value: number | [number, number]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  state?: 'default' | 'focus' | 'error' | 'disabled'
  errorText?: React.ReactNode
  type?: 'continuous' | 'discrete'
  /**
   * Narrowed (2026-08) to document the two values the real adapter actually
   * recognizes ('stacked'/'side-by-side' — anything else silently falls back to
   * 'stacked'), while still allowing custom strings through for other CSS-variable
   * lookup uses elsewhere in the app.
   */
  layout?: 'stacked' | 'side-by-side' | (string & {})
  layer?: ComponentLayer
  label?: React.ReactNode
  showInput?: boolean
  showMinMaxInput?: boolean
  /**
   * Keeps `valueLabel`'s formatted value permanently visible, rather than only during drag/
   * hover. Maps directly onto each real library's own native mechanism for this on Material
   * (`valueLabelDisplay: 'on'`) and is hand-implemented on Carbon (its wrapper renders
   * `valueLabel` only when this is true — Carbon has no native drag-time tooltip at all, so
   * `false` there means "never shown," not "hover-only").
   *
   * Mantine is the odd one out, and permanently so (2026-08, see
   * `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md` #9): this prop is a **no-op** on that kit. The
   * real adapter's own `Slider` unconditionally renders `valueLabel`'s formatted value next to
   * the track whenever `showInput` is false, regardless of this flag — so the formatted value
   * is effectively always visible there either way, and there is no way to make it hover-only.
   * (It briefly mapped onto Mantine's own `labelAlwaysOn` — that wiring was removed once it
   * started producing an exact visible duplicate: the same formatted text as both a floating
   * drag-tooltip pill and the always-present static text, simultaneously.)
   */
  showValueLabel?: boolean
  /**
   * Formats the numeric value for display — e.g. mapping a discrete position (0–4) onto a
   * scale like XS/S/M/L/XL. Both raw `@mantine/core` (`label`) and raw `@mui/material`
   * (`valueLabelFormat`) already have this exact concept natively, in the same shape
   * (`ReactNode | ((value: number) => ReactNode)`), used for both the drag-time floating
   * tooltip and (via `showValueLabel`) a permanently visible label — one formatter, two
   * visibility modes. There is deliberately no separate "tooltip text" prop: it was the same
   * formatter under a different name, forcing every real caller to pass the identical value
   * to both.
   */
  valueLabel?: string | ((value: number) => string)
  minLabel?: React.ReactNode
  maxLabel?: React.ReactNode
  showMinMaxLabels?: boolean
  minIcon?: React.ReactNode
  maxIcon?: React.ReactNode
  iconSize?: number | string
  readOnly?: boolean
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
