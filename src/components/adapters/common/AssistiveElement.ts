/**
 * AssistiveElement — common types
 *
 * Single source of truth for the AssistiveElement prop vocabulary, shared by the dispatcher
 * (`adapters/AssistiveElement.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/AssistiveElement`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type AssistiveElementProps = {
  text: string
  /**
   * The real `@recursica/mantine-adapter` calls its equivalent `assistiveVariant` — kept as-is
   * intentionally rather than asking upstream to rename it: every field component's props
   * flow through this same way, and Forge's own Material implementation already just calls it
   * `variant` directly, so there's no cross-kit naming collision motivating a change here.
   */
  variant?: 'help' | 'error'
  icon?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  id?: string
} & LibrarySpecificProps
