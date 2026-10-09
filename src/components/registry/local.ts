/**
 * Local Component Registry
 * 
 * Registers Forge's own Mantine-based implementations (the `local` adapter), used by default
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('local', 'Button', () => import('../adapters/local/Button/Button'))
registerComponent('local', 'Checkbox', () => import('../adapters/local/Checkbox/Checkbox'))
registerComponent('local', 'CheckboxItem', () => import('../adapters/local/CheckboxItem/CheckboxItem'))
registerComponent('local', 'CheckboxGroup', () => import('../adapters/local/CheckboxGroup/CheckboxGroup'))
registerComponent('local', 'RadioButton', () => import('../adapters/local/RadioButton/RadioButton'))
registerComponent('local', 'RadioButtonItem', () => import('../adapters/local/RadioButtonItem/RadioButtonItem'))
registerComponent('local', 'RadioButtonGroup', () => import('../adapters/local/RadioButtonGroup/RadioButtonGroup'))

// Tabs
registerComponent('local', 'Tabs', () => import('../adapters/local/Tabs/Tabs'))

// Switch
registerComponent('local', 'Switch', () => import('../adapters/local/Switch/Switch'))

// Avatar
registerComponent('local', 'Avatar', () => import('../adapters/local/Avatar/Avatar'))

// Badge
registerComponent('local', 'Badge', () => import('../adapters/local/Badge/Badge'))

// Toast
registerComponent('local', 'Toast', () => import('../adapters/local/Toast/Toast'))

// Chip
registerComponent('local', 'Chip', () => import('../adapters/local/Chip/Chip'))

// Label
registerComponent('local', 'Label', () => import('../adapters/local/Label/Label'))

// Link
registerComponent('local', 'Link', () => import('../adapters/local/Link/Link'))


// AssistiveElement
registerComponent('local', 'AssistiveElement', () => import('../adapters/local/AssistiveElement/AssistiveElement'))

// TextField
registerComponent('local', 'TextField', () => import('../adapters/local/TextField/TextField'))

// Textarea
registerComponent('local', 'Textarea', () => import('../adapters/local/Textarea/Textarea'))

// NumberInput
registerComponent('local', 'NumberInput', () => import('../adapters/local/NumberInput/NumberInput'))

// Dropdown
registerComponent('local', 'Dropdown', () => import('../adapters/local/Dropdown/Dropdown'))

// Autocomplete
registerComponent('local', 'Autocomplete', () => import('../adapters/local/Autocomplete/Autocomplete'))

// Breadcrumb
registerComponent('local', 'Breadcrumb', () => import('../adapters/local/Breadcrumb/Breadcrumb'))

// Accordion
registerComponent('local', 'Accordion', () => import('../adapters/local/Accordion/Accordion'))

// MenuItem
registerComponent('local', 'MenuItem', () => import('../adapters/local/MenuItem/MenuItem'))

// Menu
registerComponent('local', 'Menu', () => import('../adapters/local/Menu/Menu'))

// Slider
registerComponent('local', 'Slider', () => import('../adapters/local/Slider/Slider'))

// SegmentedControl
registerComponent('local', 'SegmentedControl', () => import('../adapters/local/SegmentedControl/SegmentedControl'))

// Modal
registerComponent('local', 'Modal', () => import('../adapters/local/Modal/Modal'))

// Tooltip
registerComponent('local', 'Tooltip', () => import('../adapters/local/Tooltip/Tooltip'))

// ReadOnlyField
registerComponent('local', 'ReadOnlyField', () => import('../adapters/local/ReadOnlyField/ReadOnlyField'))

// FileInput
registerComponent('local', 'FileInput', () => import('../adapters/local/FileInput/FileInput'))

// FileUpload
registerComponent('local', 'FileUpload', () => import('../adapters/local/FileUpload/FileUpload'))

// Panel
registerComponent('local', 'Panel', () => import('../adapters/local/Panel/Panel'))

// HoverCard
registerComponent('local', 'HoverCard', () => import('../adapters/local/HoverCard/HoverCard'))

// Popover
registerComponent('local', 'Popover', () => import('../adapters/local/Popover/Popover'))

// Card
registerComponent('local', 'Card', () => import('../adapters/local/Card/Card'))

// Pagination
registerComponent('local', 'Pagination', () => import('../adapters/local/Pagination/Pagination'))

// TimePicker
registerComponent('local', 'TimePicker', () => import('../adapters/local/TimePicker/TimePicker'))

// DatePicker
registerComponent('local', 'DatePicker', () => import('../adapters/local/DatePicker/DatePicker'))

// Loader
registerComponent('local', 'Loader', () => import('../adapters/local/Loader/Loader'))

// Stepper
registerComponent('local', 'Stepper', () => import('../adapters/local/Stepper/Stepper'))
registerComponent('local', 'Timeline', () => import('../adapters/local/Timeline/Timeline'))

// TransferList
registerComponent('local', 'TransferList', () => import('../adapters/local/TransferList/TransferList'))

// Tree
registerComponent('local', 'Tree', () => import('../adapters/local/Tree/Tree'))

// Table
registerComponent('local', 'Table', () => import('../adapters/local/Table/Table'))
registerComponent('local', 'TableCell', () => import('../adapters/local/TableCell/TableCell'))
registerComponent('local', 'TableHeader', () => import('../adapters/local/TableHeader/TableHeader'))
registerComponent('local', 'TableFooter', () => import('../adapters/local/TableFooter/TableFooter'))

// Add more components as they're implemented
