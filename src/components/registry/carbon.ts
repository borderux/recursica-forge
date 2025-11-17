/**
 * Carbon Component Registry
 * 
 * Registers Carbon component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('carbon', 'Button', () => import('../adapters/carbon/Button'))

// Add more components as they're implemented

