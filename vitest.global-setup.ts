/**
 * Global setup file that runs once before all tests
 * This ensures components are preloaded before any tests run
 */

import { preloadComponent } from './src/components/registry'

const commonComponents: Array<{ kit: 'mantine' | 'material' | 'carbon', name: 'Button' | 'Accordion' | 'Breadcrumb' }> = [
  { kit: 'mantine', name: 'Button' },
  { kit: 'mantine', name: 'Accordion' },
  { kit: 'mantine', name: 'Breadcrumb' },
  { kit: 'material', name: 'Button' },
  { kit: 'material', name: 'Accordion' },
  { kit: 'material', name: 'Breadcrumb' },
  { kit: 'carbon', name: 'Button' },
  { kit: 'carbon', name: 'Accordion' },
  { kit: 'carbon', name: 'Breadcrumb' },
]

export default async function globalSetup() {
  console.log('Preloading components...')
  const results = await Promise.allSettled(
    commonComponents.map(({ kit, name }) => preloadComponent(kit, name))
  )
  
  // Log any failures but don't fail the test suite
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const { kit, name } = commonComponents[index]
      console.warn(`Failed to preload ${kit} ${name}:`, result.reason)
    }
  })
  
  console.log('Component preloading complete')
}
