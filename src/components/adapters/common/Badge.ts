/**
 * Badge — common types
 *
 * Single source of truth for the Badge prop vocabulary, shared by the dispatcher
 * (`adapters/Badge.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Badge`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type BadgeProps = {
  children?: React.ReactNode
  /**
   * Forge's own semantic vocabulary (e.g. `'alert'`, `'success'`), not raw Mantine's
   * `'filled'|'light'|...` variant scale — intentional. The design system doesn't use the
   * underlying kit's own variant mechanism for Badge at all; every value is styled directly
   * from Forge's own CSS variables.
   */
  variant?: string
  size?: 'small' | 'large'
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
