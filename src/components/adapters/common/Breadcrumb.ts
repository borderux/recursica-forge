/**
 * Breadcrumb — common types
 *
 * Single source of truth for the Breadcrumb prop vocabulary, shared by the dispatcher
 * (`adapters/Breadcrumb.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Breadcrumb`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  /**
   * A keyword — translated into an icon on every kit. Both raw `@mantine/core`'s and raw
   * `@mui/material`'s own `Breadcrumbs` want a rendered glyph (`ReactNode`) here natively, not
   * a keyword; this stays as Forge's own convenience layer. Ignored whenever `separatorNode`
   * is also provided.
   */
  separator?: 'slash' | 'chevron' | 'arrow'
  /** A custom separator element, taking precedence over `separator` when provided. */
  separatorNode?: React.ReactNode
  showHomeIcon?: boolean
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
