/**
 * Slider — common types
 *
 * Single source of truth for the Slider prop vocabulary, shared by the dispatcher
 * (`adapters/Slider.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Slider`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SliderProps = {
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
  layout?: string  // accepts custom layout variant names
  layer?: ComponentLayer
  label?: React.ReactNode
  showInput?: boolean
  showMinMaxInput?: boolean
  showValueLabel?: boolean
  valueLabel?: string | ((value: number) => string)
  tooltipText?: string | ((value: number) => string)
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
