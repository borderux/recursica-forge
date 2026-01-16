/**
 * Material UI Component Registry
 * 
 * Registers Material UI component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('material', 'Button', () => import('../adapters/material/Button/Button'))

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

// Breadcrumb
registerComponent('material', 'Breadcrumb', () => import('../adapters/material/Breadcrumb/Breadcrumb'))

// MenuItem
registerComponent('material', 'MenuItem', () => import('../adapters/material/MenuItem/MenuItem'))

// Menu
registerComponent('material', 'Menu', () => import('../adapters/material/Menu/Menu'))

// Slider
registerComponent('material', 'Slider', () => import('../adapters/material/Slider/Slider'))

// Add more components as they're implemented

