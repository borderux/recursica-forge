/**
 * Component Registry Types
 * 
 * Defines the types for the component adapter system that allows
 * rendering components from different UI libraries (Mantine, Material, Carbon).
 */

import { ReactNode, ComponentType } from 'react'
import type { UiKit } from '../../modules/uikit/UiKitContext'

export type { UiKit }

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
  | 'AccordionItem'
  | 'Breadcrumb'
  | 'DatePicker'
  | 'FileInput'
  | 'FileUpload'
  | 'Link'
  | 'Loader'
  | 'Menu'
  | 'MenuItem'
  | 'Modal'
  | 'NumberInput'
  | 'Pagination'
  | 'Panel'
  | 'Popover'
  | 'ReadOnlyField'
  | 'Search'
  | 'SegmentedControl'
  | 'SegmentedControlItem'
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
  | 'Label'
  | 'AssistiveElement'

export type ComponentLayer = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'

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

