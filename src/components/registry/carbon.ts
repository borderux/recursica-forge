/**
 * Carbon Component Registry
 * 
 * Registers Carbon component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('carbon', 'Button', () => import('../adapters/carbon/Button/Button'))
registerComponent('carbon', 'Checkbox', () => import('../adapters/carbon/Checkbox/Checkbox'))
registerComponent('carbon', 'RadioButton', () => import('../adapters/carbon/RadioButton/RadioButton'))
registerComponent('carbon', 'RadioButtonItem', () => import('../adapters/carbon/RadioButtonItem/RadioButtonItem'))
registerComponent('carbon', 'RadioButtonGroup', () => import('../adapters/carbon/RadioButtonGroup/RadioButtonGroup'))

// Tabs
registerComponent('carbon', 'Tabs', () => import('../adapters/carbon/Tabs/Tabs'))

// Switch
registerComponent('carbon', 'Switch', () => import('../adapters/carbon/Switch/Switch'))

// Avatar
registerComponent('carbon', 'Avatar', () => import('../adapters/carbon/Avatar/Avatar'))

// Badge
registerComponent('carbon', 'Badge', () => import('../adapters/carbon/Badge/Badge'))

// Toast
registerComponent('carbon', 'Toast', () => import('../adapters/carbon/Toast/Toast'))

// Chip
registerComponent('carbon', 'Chip', () => import('../adapters/carbon/Chip/Chip'))

// Label
registerComponent('carbon', 'Label', () => import('../adapters/carbon/Label/Label'))

// Link
registerComponent('carbon', 'Link', () => import('../adapters/carbon/Link/Link'))


// AssistiveElement
registerComponent('carbon', 'AssistiveElement', () => import('../adapters/carbon/AssistiveElement/AssistiveElement'))

// TextField
registerComponent('carbon', 'TextField', () => import('../adapters/carbon/TextField/TextField'))

// Textarea
registerComponent('carbon', 'Textarea', () => import('../adapters/carbon/Textarea/Textarea'))

// NumberInput
registerComponent('carbon', 'NumberInput', () => import('../adapters/carbon/NumberInput/NumberInput'))

// Breadcrumb
registerComponent('carbon', 'Breadcrumb', () => import('../adapters/carbon/Breadcrumb/Breadcrumb'))

// Accordion
registerComponent('carbon', 'Accordion', () => import('../adapters/carbon/Accordion/Accordion'))

// MenuItem
registerComponent('carbon', 'MenuItem', () => import('../adapters/carbon/MenuItem/MenuItem'))

// Menu
registerComponent('carbon', 'Menu', () => import('../adapters/carbon/Menu/Menu'))

// Slider
registerComponent('carbon', 'Slider', () => import('../adapters/carbon/Slider/Slider'))

// SegmentedControl
registerComponent('carbon', 'SegmentedControl', () => import('../adapters/carbon/SegmentedControl/SegmentedControl'))

// Tooltip
registerComponent('carbon', 'Tooltip', () => import('../adapters/carbon/Tooltip/Tooltip'))

// HoverCard
registerComponent('carbon', 'HoverCard', () => import('../adapters/carbon/HoverCard/HoverCard'))

// Popover
registerComponent('carbon', 'Popover', () => import('../adapters/carbon/Popover/Popover'))

// Card
registerComponent('carbon', 'Card', () => import('../adapters/carbon/Card/Card'))

// Pagination
registerComponent('carbon', 'Pagination', () => import('../adapters/carbon/Pagination/Pagination'))

// DatePicker
registerComponent('carbon', 'DatePicker', () => import('../adapters/carbon/DatePicker/DatePicker'))

// Add more components as they're implemented


