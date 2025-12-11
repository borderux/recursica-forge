/**
 * Material UI Component Registry
 * 
 * Registers Material UI component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('material', 'Button', () => import('../adapters/material/Button'))

// Tabs
registerComponent('material', 'Tabs', () => import('../adapters/material/Tabs'))

// Add more components as they're implemented

