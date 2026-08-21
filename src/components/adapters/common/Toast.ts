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
  variant?: 'default' | 'success' | 'error'
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  onClose?: () => void
  action?: React.ReactNode
} & LibrarySpecificProps
