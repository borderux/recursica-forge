/**
 * Mantine Component Registry
 * 
 * Registers Mantine component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('mantine', 'Button', () => import('../adapters/mantine/Button/Button'))
registerComponent('mantine', 'Checkbox', () => import('../adapters/mantine/Checkbox/Checkbox'))

// Tabs
registerComponent('mantine', 'Tabs', () => import('../adapters/mantine/Tabs/Tabs'))

// Switch
registerComponent('mantine', 'Switch', () => import('../adapters/mantine/Switch/Switch'))

// Avatar
registerComponent('mantine', 'Avatar', () => import('../adapters/mantine/Avatar/Avatar'))

// Badge
registerComponent('mantine', 'Badge', () => import('../adapters/mantine/Badge/Badge'))

// Toast
registerComponent('mantine', 'Toast', () => import('../adapters/mantine/Toast/Toast'))

// Chip
registerComponent('mantine', 'Chip', () => import('../adapters/mantine/Chip/Chip'))

// Label
registerComponent('mantine', 'Label', () => import('../adapters/mantine/Label/Label'))

// AssistiveElement
registerComponent('mantine', 'AssistiveElement', () => import('../adapters/mantine/AssistiveElement/AssistiveElement'))

// TextField
registerComponent('mantine', 'TextField', () => import('../adapters/mantine/TextField/TextField'))

// Dropdown
registerComponent('mantine', 'Dropdown', () => import('../adapters/mantine/Dropdown/Dropdown'))

// Breadcrumb
registerComponent('mantine', 'Breadcrumb', () => import('../adapters/mantine/Breadcrumb/Breadcrumb'))

// Accordion
registerComponent('mantine', 'Accordion', () => import('../adapters/mantine/Accordion/Accordion'))

// MenuItem
registerComponent('mantine', 'MenuItem', () => import('../adapters/mantine/MenuItem/MenuItem'))

// Menu
registerComponent('mantine', 'Menu', () => import('../adapters/mantine/Menu/Menu'))

// Slider
registerComponent('mantine', 'Slider', () => import('../adapters/mantine/Slider/Slider'))

// SegmentedControl
registerComponent('mantine', 'SegmentedControl', () => import('../adapters/mantine/SegmentedControl/SegmentedControl'))

// Add more components as they're implemented
// registerComponent('mantine', 'Card', () => import('../../adapters/mantine/Card'))
// registerComponent('mantine', 'TextField', () => import('../../adapters/mantine/TextField'))

