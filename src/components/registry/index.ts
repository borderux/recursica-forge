/**
 * Component Registry
 * 
 * Central registry for component implementations across different UI libraries.
 * Components are lazy-loaded per library to optimize bundle size.
 */

import { lazy, ComponentType } from 'react'
import type { UiKit, ComponentName } from './types'

// Registry maps: kit -> componentName -> Component Loader
const registries: Record<UiKit, Record<ComponentName, () => Promise<{ default: ComponentType<any> }>>> = {
  mantine: {},
  material: {},
  carbon: {},
}

// Cache for lazy-loaded components
const lazyComponentCache: Record<string, ComponentType<any>> = {}

/**
 * Registers a component implementation for a specific UI kit
 */
export function registerComponent(
  kit: UiKit,
  componentName: ComponentName,
  loader: () => Promise<{ default: ComponentType<any> }>
) {
  if (!registries[kit]) {
    registries[kit] = {}
  }
  registries[kit][componentName] = loader
}

/**
 * Gets a lazy-loaded component implementation for the current UI kit
 * Returns null if component is not available for that kit
 */
export function getComponent(
  kit: UiKit,
  componentName: ComponentName
): ComponentType<any> | null {
  const cacheKey = `${kit}-${componentName}`
  
  // Check cache first
  if (lazyComponentCache[cacheKey]) {
    return lazyComponentCache[cacheKey]
  }
  
  // Check if component is registered
  const loader = registries[kit]?.[componentName]
  if (!loader) {
    return null
  }
  
  // Create lazy component and cache it
  try {
    const LazyComponent = lazy(loader)
    lazyComponentCache[cacheKey] = LazyComponent
    return LazyComponent
  } catch (error) {
    console.error(`Failed to load component ${componentName} for ${kit}:`, error)
    return null
  }
}

/**
 * Preloads a component for a specific kit
 */
export async function preloadComponent(
  kit: UiKit,
  componentName: ComponentName
): Promise<void> {
  const cacheKey = `${kit}-${componentName}`
  if (lazyComponentCache[cacheKey]) {
    return
  }
  
  const loader = registries[kit]?.[componentName]
  if (!loader) {
    return
  }
  
  try {
    const module = await loader()
    // Cache the default export directly
    lazyComponentCache[cacheKey] = module.default
  } catch (error) {
    console.error(`Failed to preload component ${componentName} for ${kit}:`, error)
  }
}

