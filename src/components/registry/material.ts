/**
 * Material UI Component Registry
 * 
 * Registers Material UI component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('material', 'Button', () => import('../adapters/material/Button/Button'))
registerComponent('material', 'Checkbox', () => import('../adapters/material/Checkbox/Checkbox'))

// Tabs
registerComponent('material', 'Tabs', () => import('../adapters/material/Tabs/Tabs'))

// Switch
registerComponent('material', 'Switch', () => import('../adapters/material/Switch/Switch'))

// Avatar
registerComponent('material', 'Avatar', () => import('../adapters/material/Avatar/Avatar'))

// Badge
registerComponent('material', 'Badge', () => import('../adapters/material/Badge/Badge'))

// Toast
registerComponent('material', 'Toast', () => import('../adapters/material/Toast/Toast'))

// Chip
registerComponent('material', 'Chip', () => import('../adapters/material/Chip/Chip'))

// Label
registerComponent('material', 'Label', () => import('../adapters/material/Label/Label'))

// Link
registerComponent('material', 'Link', () => import('../adapters/material/Link/Link'))


// AssistiveElement
registerComponent('material', 'AssistiveElement', () => import('../adapters/material/AssistiveElement/AssistiveElement'))

// TextField
registerComponent('material', 'TextField', () => import('../adapters/material/TextField/TextField'))

// Breadcrumb
registerComponent('material', 'Breadcrumb', () => import('../adapters/material/Breadcrumb/Breadcrumb'))

// Accordion
registerComponent('material', 'Accordion', () => import('../adapters/material/Accordion/Accordion'))

// MenuItem
registerComponent('material', 'MenuItem', () => import('../adapters/material/MenuItem/MenuItem'))

// Menu
registerComponent('material', 'Menu', () => import('../adapters/material/Menu/Menu'))

// Slider
registerComponent('material', 'Slider', () => import('../adapters/material/Slider/Slider'))

// SegmentedControl
registerComponent('material', 'SegmentedControl', () => import('../adapters/material/SegmentedControl/SegmentedControl'))

// Tooltip
registerComponent('material', 'Tooltip', () => import('../adapters/material/Tooltip/Tooltip'))

// Add more components as they're implemented

