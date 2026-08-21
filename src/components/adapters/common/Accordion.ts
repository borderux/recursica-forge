/**
 * Accordion — common types
 *
 * Single source of truth for the Accordion prop vocabulary, shared by the dispatcher
 * (`adapters/Accordion.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Accordion`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type AccordionItem = {
  id: string
  title: React.ReactNode
  content: React.ReactNode
  icon?: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }> | null
  open?: boolean
  defaultOpen?: boolean
  divider?: boolean
  disabled?: boolean
}

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type AccordionProps = {
  items: AccordionItem[]
  layer?: ComponentLayer
  allowMultiple?: boolean
  elevation?: string
  onToggle?: (id: string, open: boolean) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

/**
 * What a per-library wrapper receives. Same vocabulary as `AccordionProps`, but with
 * open/close state already normalized by the dispatcher (controlled vs. uncontrolled
 * resolved into one `openItems` list) so no wrapper has to reimplement that logic.
 */
export type AccordionAdapterProps = {
  items: AccordionItem[]
  layer?: ComponentLayer
  allowMultiple: boolean
  elevation?: string
  openItems: string[]
  onOpenItemsChange: (openItems: string[]) => void
  onItemToggle: (id: string, open: boolean) => void
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps
