/**
 * RadioButtonItem — common types
 *
 * Single source of truth for the RadioButtonItem prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButtonItem.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/RadioButtonItem`).
 */

import type { RadioButtonProps } from './RadioButton'
import type { LibrarySpecificProps } from '../../registry/types'

export type RadioButtonItemProps = RadioButtonProps & LibrarySpecificProps
