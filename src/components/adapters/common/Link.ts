/**
 * Link — common types
 *
 * Single source of truth for the Link prop vocabulary, shared by the dispatcher
 * (`adapters/Link.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Link`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type LinkProps = {
  children?: React.ReactNode
  href?: string
  target?: string
  rel?: string
  layer?: ComponentLayer
  /**
   * Real and working on Material and Carbon (both hand-rolled, both drive real CSS
   * text-decoration from this). Deliberately kept in the shared type even though it's a no-op
   * on the Mantine kit — the real `@recursica/mantine-adapter` structurally blocks it
   * (Link styling is meant to be consistent, not overridable per-instance), and any future
   * adapter-package-based kit is expected to behave the same way. Not a bug to fix; this is
   * the accepted asymmetry between hand-rolled kits and adapter-wrapped ones.
   */
  underline?: 'hover' | 'always' | 'none'
  onClick?: (e: React.MouseEvent) => void
  className?: string
  inlineStyle?: React.CSSProperties
  /** Style prop used by library adapters (mapped from inlineStyle by mapLinkProps) */
  style?: React.CSSProperties
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  title?: string
  showIcon?: boolean
  iconPosition?: 'start' | 'end'
  /** Library-specific variant */
  variant?: string
  /** Library-specific size */
  size?: string
  /** Force a specific visual state for preview (bypasses CSS pseudo-states) */
  forceState?: string  // accepts custom state variant names
} & LibrarySpecificProps
