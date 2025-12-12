/**
 * Mantine Component Registry
 * 
 * Registers Mantine component implementations
 */

import { registerComponent } from './index'
import type { ComponentName } from './types'

// Button
registerComponent('mantine', 'Button', () => import('../adapters/mantine/Button/Button'))

// Tabs
registerComponent('mantine', 'Tabs', () => import('../adapters/mantine/Tabs/Tabs'))

// Switch
registerComponent('mantine', 'Switch', () => import('../adapters/mantine/Switch/Switch'))

// Chip
registerComponent('mantine', 'Chip', () => import('../adapters/mantine/Chip/Chip'))

// Add more components as they're implemented
// registerComponent('mantine', 'Card', () => import('../../adapters/mantine/Card'))
// registerComponent('mantine', 'TextField', () => import('../../adapters/mantine/TextField'))

