/**
 * CheckboxItem — common types
 *
 * Single source of truth for the CheckboxItem prop vocabulary, shared by the dispatcher
 * (`adapters/CheckboxItem.tsx`) and the per-library wrapper (`adapters/mantine/CheckboxItem`).
 */

import type { CheckboxProps } from './Checkbox'
import type { LibrarySpecificProps } from '../../registry/types'

export type CheckboxItemProps = CheckboxProps & LibrarySpecificProps
