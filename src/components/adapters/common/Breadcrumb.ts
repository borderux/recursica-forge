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
  separator?: 'slash' | 'chevron' | 'arrow'
  showHomeIcon?: boolean
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
