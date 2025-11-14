/**
 * Component Registry Types
 * 
 * Defines the types for the component adapter system that allows
 * rendering components from different UI libraries (Mantine, Material, Carbon).
 */

import { ReactNode, ComponentType } from 'react'
import type { UiKit } from '../../modules/uikit/UiKitContext'

export type ComponentName = 
  | 'Button'
  | 'Card'
  | 'TextField'
  | 'Checkbox'
  | 'Radio'
  | 'Select'
  | 'Textarea'
  | 'Switch'
  | 'Chip'
  | 'Badge'
  | 'Avatar'
  | 'Accordion'
  | 'Breadcrumb'
  | 'DatePicker'
  | 'FileInput'
  | 'FileUpload'
  | 'Link'
  | 'Loader'
  | 'Menu'
  | 'Modal'
  | 'NumberInput'
  | 'Pagination'
  | 'Panel'
  | 'Popover'
  | 'ReadOnlyField'
  | 'Search'
  | 'SegmentedControl'
  | 'Slider'
  | 'Stepper'
  | 'Tabs'
  | 'TimePicker'
  | 'Timeline'
  | 'Toast'
  | 'Tooltip'
  | 'TransferList'
  | 'Divider'
  | 'List'
  | 'HoverCard'

export type ComponentLayer = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3' | 'layer-alternative-high-contrast' | 'layer-alternative-primary-color' | 'layer-alternative-alert' | 'layer-alternative-warning' | 'layer-alternative-success'

export interface ComponentRegistry {
  [componentName: string]: ComponentType<any>
}

export interface UiKitPlugin {
  name: UiKit
  components: ComponentRegistry
  ThemeProvider: ComponentType<{ children: ReactNode }>
}

export interface LibrarySpecificProps {
  mantine?: Record<string, any>
  material?: Record<string, any>
  carbon?: Record<string, any>
}

