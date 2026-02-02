/**
 * Global setup file that runs once before all tests
 * This ensures components and providers are preloaded before any tests run
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
  console.log('Preloading providers and components...')
  
  // Preload provider modules first (needed by UnifiedThemeProvider)
  // This ensures providers are available when components render
  // Cache modules globally so providers can access them synchronously
  try {
    const mantineModule = await import('@mantine/core')
    ;(globalThis as any).__MANTINE_MODULE__ = mantineModule
  } catch (err) {
    console.warn('Failed to preload @mantine/core:', err)
  }
  
  try {
    const [muiStyles, muiMaterial] = await Promise.all([
      import('@mui/material/styles'),
      import('@mui/material'),
    ])
    ;(globalThis as any).__MATERIAL_MODULE__ = { ...muiStyles, ...muiMaterial }
  } catch (err) {
    console.warn('Failed to preload @mui/material:', err)
  }
  
  try {
    const carbonModule = await import('@carbon/react')
    ;(globalThis as any).__CARBON_MODULE__ = carbonModule
  } catch (err) {
    console.warn('Failed to preload @carbon/react:', err)
  }
  
  console.log('Provider modules preloaded')
  
  // Preload components
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
