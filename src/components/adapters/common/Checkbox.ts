/**
 * Checkbox — common types
 *
 * Single source of truth for the Checkbox prop vocabulary, shared by the dispatcher
 * (`adapters/Checkbox.tsx`) and the per-library wrapper (`adapters/mantine/Checkbox`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type CheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
