/**
 * Modal — common types
 *
 * Single source of truth for the Modal prop vocabulary, shared by the dispatcher
 * (`adapters/Modal.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Modal`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type ModalProps = {
    children?: React.ReactNode
    content?: React.ReactNode // Slot content, can be text or component
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    showHeader?: boolean
    /** Show the header close (×) button. Defaults to true. Set false to force a decision via the footer. */
    showCloseButton?: boolean
    showFooter?: boolean
    scrollable?: boolean
    padding?: boolean
    showSecondaryButton?: boolean
    primaryActionLabel?: string
    onPrimaryAction?: () => void
    secondaryActionLabel?: string
    onSecondaryAction?: () => void
    primaryActionDisabled?: boolean
    secondaryActionDisabled?: boolean
    size?: string | number
    layer?: ComponentLayer
    elevation?: string // e.g., "elevation-0", "elevation-1", etc.
    className?: string
    style?: React.CSSProperties
    withOverlay?: boolean
    centered?: boolean
    position?: { x: number; y: number }
    trapFocus?: boolean
    zIndex?: number
    draggable?: boolean
    onPositionChange?: (position: { x: number; y: number }) => void
} & LibrarySpecificProps
