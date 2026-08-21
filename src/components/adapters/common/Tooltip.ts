/**
 * Tooltip — common types
 *
 * Single source of truth for the Tooltip prop vocabulary, shared by the dispatcher
 * (`adapters/Tooltip.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Tooltip`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TooltipProps = {
  children?: React.ReactNode
  label?: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  alignment?: 'start' | 'middle' | 'end'
  layer?: ComponentLayer
  elevation?: string
  opened?: boolean
  zIndex?: number
  withinPortal?: boolean
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
