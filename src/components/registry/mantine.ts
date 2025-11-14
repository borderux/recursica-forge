/**
 * Mantine Component Registry
 * 
 * Registers Mantine component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('mantine', 'Button', () => import('../adapters/mantine/Button'))

// Add more components as they're implemented
// registerComponent('mantine', 'Card', () => import('../../adapters/mantine/Card'))
// registerComponent('mantine', 'TextField', () => import('../../adapters/mantine/TextField'))

