/**
 * Tree — common types
 *
 * Single source of truth for the Tree prop vocabulary, shared by the dispatcher
 * (`adapters/Tree.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Tree`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TreeProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  data?: any[]
  selected?: string[]
  onSelect?: (selected: string[]) => void
  /** Force the hover appearance on all nodes — used by the toolbar preview when the Hover tab is active. */
  forceHover?: boolean
} & LibrarySpecificProps
