/**
 * SegmentedControl — common types
 *
 * Single source of truth for the SegmentedControl prop vocabulary, shared by the dispatcher
 * (`adapters/SegmentedControl.tsx`) and every per-library wrapper
 * (`adapters/{mantine,material,carbon}/SegmentedControl`).
 */

import type { ComponentLayer, LibrarySpecificProps, ComponentName } from '../../registry/types'

export type SegmentedControlItem = {
  value: string
  label?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  tooltip?: string // Tooltip text to show when label is hidden
}

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SegmentedControlProps = {
  items: SegmentedControlItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  fullWidth?: boolean
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  disabled?: boolean
  showLabel?: boolean // Whether to show labels (default: true)
  componentNameForCssVars?: ComponentName // Component name to use for CSS variables (default: 'SegmentedControl')
  // Optional selection-state variant name for the SegmentedControlItem. Built-in states
  // (selected/unselected) keep the default behavior; any other value is a custom variant whose
  // selected-segment colours resolve generically from variants.selection-states.<name>.
  selectionState?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Identical to `SegmentedControlProps` today — the
 * dispatcher has no shared interaction state to normalize for this component (selection is
 * already controlled/uncontrolled the same way `value`/`defaultValue` always are).
 */
export type SegmentedControlAdapterProps = SegmentedControlProps
