/**
 * RadioButtonItem — common types
 *
 * Single source of truth for the RadioButtonItem prop vocabulary, shared by the dispatcher
 * (`adapters/RadioButtonItem.tsx`) and the per-library wrapper (`adapters/mantine/RadioButtonItem`).
 */

import type { RadioButtonProps } from './RadioButton'
import type { LibrarySpecificProps } from '../../registry/types'

export type RadioButtonItemProps = RadioButtonProps & LibrarySpecificProps
