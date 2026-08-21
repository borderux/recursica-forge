/**
 * TransferList — common types
 *
 * Single source of truth for the TransferList prop vocabulary, shared by the dispatcher
 * (`adapters/TransferList.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/TransferList`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

export type TransferListItem = {
    value: string
    label: string
    group?: string
}

export type TransferListData = [TransferListItem[], TransferListItem[]]

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TransferListProps = {
    /** Controlled data: [sourceItems, targetItems] */
    data?: TransferListData
    /** Uncontrolled initial data: [sourceItems, targetItems] */
    defaultData?: TransferListData
    /** Called when items are transferred */
    onChange?: (data: TransferListData) => void
    /** Overall label for the component */
    label?: string
    /** Label for the source (left) list */
    sourceLabel?: string
    /** Label for the target (right) list */
    targetLabel?: string
    /** Help text displayed below the component */
    helpText?: string
    /** Error text displayed below the component */
    errorText?: string
    /** Component state — accepts any variant name including custom states */
    state?: string
    /** Layer for theming */
    layer?: ComponentLayer
    /** Enable search fields (default: true) */
    searchable?: boolean
    /** Placeholder text for search fields */
    searchPlaceholder?: string
    /** Label variant for the overall label */
    required?: boolean
    /** Optional indicator */
    optional?: boolean
    /** Layout — accepts any variant name including custom layouts */
    layout?: string
    /** Additional className */
    className?: string
    /** Additional styles */
    style?: React.CSSProperties
} & LibrarySpecificProps
