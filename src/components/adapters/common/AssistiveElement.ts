/**
 * AssistiveElement — common types
 *
 * Single source of truth for the AssistiveElement prop vocabulary, shared by the dispatcher
 * (`adapters/AssistiveElement.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/AssistiveElement`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type AssistiveElementProps = {
  text: string
  variant?: 'help' | 'error'
  icon?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  id?: string
} & LibrarySpecificProps
