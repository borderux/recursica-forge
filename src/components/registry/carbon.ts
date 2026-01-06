/**
 * Carbon Component Registry
 * 
 * Registers Carbon component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('carbon', 'Button', () => import('../adapters/carbon/Button/Button'))

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

// Breadcrumb
registerComponent('carbon', 'Breadcrumb', () => import('../adapters/carbon/Breadcrumb/Breadcrumb'))

// MenuItem
registerComponent('carbon', 'MenuItem', () => import('../adapters/carbon/MenuItem/MenuItem'))

// Add more components as they're implemented

