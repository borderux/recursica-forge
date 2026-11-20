/**
 * Menu — common types
 *
 * Single source of truth for the Menu prop vocabulary, shared by the dispatcher
 * (`adapters/Menu.tsx`) and the per-library wrapper (`adapters/mantine/Menu`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type MenuProps = {
  children?: React.ReactNode
  layer?: ComponentLayer
  elevation?: string
  maxHeight?: number
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
