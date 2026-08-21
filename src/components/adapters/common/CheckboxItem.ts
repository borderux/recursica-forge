/**
 * CheckboxItem — common types
 *
 * Single source of truth for the CheckboxItem prop vocabulary, shared by the dispatcher
 * (`adapters/CheckboxItem.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/CheckboxItem`).
 */

import type { CheckboxProps } from './Checkbox'
import type { LibrarySpecificProps } from '../../registry/types'

export type CheckboxItemProps = CheckboxProps & LibrarySpecificProps
