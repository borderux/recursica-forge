/**
 * Carbon Component Registry
 * 
 * Registers Carbon component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('carbon', 'Button', () => import('../adapters/carbon/Button'))

// Tabs
registerComponent('carbon', 'Tabs', () => import('../adapters/carbon/Tabs'))

// Switch
registerComponent('carbon', 'Switch', () => import('../adapters/carbon/Switch'))

// Add more components as they're implemented

