/**
 * Switch — common types
 *
 * Single source of truth for the Switch prop vocabulary, shared by the dispatcher
 * (`adapters/Switch.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Switch`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: ComponentLayer
  colorVariant?: string
  sizeVariant?: string
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
