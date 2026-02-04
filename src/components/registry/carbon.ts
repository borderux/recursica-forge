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

// AssistiveElement
registerComponent('carbon', 'AssistiveElement', () => import('../adapters/carbon/AssistiveElement/AssistiveElement'))

// TextField
registerComponent('carbon', 'TextField', () => import('../adapters/carbon/TextField/TextField'))

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

// Add more components as they're implemented

