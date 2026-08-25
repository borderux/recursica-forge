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
  /**
   * Whole-control disable. Real and native on raw `@mantine/core`'s and raw `@mui/material`'s
   * own components, and wired straight through on the Material and Carbon kits. Was
   * synthesized on the Mantine kit (via every item's own `disabled`) because the real
   * `@recursica/mantine-adapter`'s `SegmentedControl` explicitly forbade this prop
   * (`disabled: never`); upstreamed 2026-08 (see `docs/MANTINE_ADAPTER_UPSTREAM_REQUESTS.md`
   * #8) — the real type now has a genuine top-level `disabled?: boolean`, so the Mantine
   * wrapper passes it straight through like Material/Carbon do. (Previously removed 2026-08 on
   * the assumption SegmentedControls should never be disabled as a whole; restored once a real
   * product need for it came up.)
   */
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
