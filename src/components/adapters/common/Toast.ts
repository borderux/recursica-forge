/**
 * Toast — common types
 *
 * Single source of truth for the Toast prop vocabulary, shared by the dispatcher
 * (`adapters/Toast.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Toast`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type ToastProps = {
  children?: React.ReactNode
  /**
   * Coincidentally shares its name with raw `@mui/material`'s `Paper.variant`
   * (`'elevation'|'outlined'`) purely because Material's Toast wraps content in a `Paper` for
   * elevation/shape — the two are unrelated concepts and Forge's value is never passed to
   * `Paper`'s own `variant`. Not a naming conflict to resolve.
   */
  variant?: 'default' | 'success' | 'error'
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  onClose?: () => void
  action?: React.ReactNode
} & LibrarySpecificProps
