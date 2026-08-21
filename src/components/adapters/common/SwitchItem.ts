/**
 * SwitchItem — common types
 *
 * Single source of truth for the SwitchItem prop vocabulary, shared by the dispatcher
 * (`adapters/SwitchItem.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/SwitchItem`).
 */

import type { SwitchProps } from './Switch'
import type { LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type SwitchItemProps = SwitchProps & {
    label?: React.ReactNode
} & LibrarySpecificProps
