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
registerComponent('material', 'Tabs', () => import('../adapters/material/Tabs'))

// Switch
registerComponent('material', 'Switch', () => import('../adapters/material/Switch'))

// Add more components as they're implemented

