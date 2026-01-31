/**
 * Component Registry
 * 
 * Central registry for component implementations across different UI libraries.
 * Components are lazy-loaded per library to optimize bundle size.
 */

import { lazy, ComponentType } from 'react'
import type { UiKit, ComponentName } from './types'

// Registry maps: kit -> componentName -> Component Loader
const registries: Record<UiKit, Partial<Record<ComponentName, () => Promise<{ default: ComponentType<any> }>>>> = {
  mantine: {},
  material: {},
  carbon: {},
}

// Cache for lazy-loaded components
// Can contain either:
// 1. A lazy component (from getComponent)
// 2. A preloaded component (from preloadComponent - the actual component, not wrapped in lazy)
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
    registries[kit] = {} as Partial<Record<ComponentName, () => Promise<{ default: ComponentType<any> }>>>
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
 * Preloaded components are cached as lazy components that resolve immediately
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
    // Preload the module
    const module = await loader()
    // Create a lazy component that resolves immediately with the preloaded module
    // Use a resolved promise so Suspense recognizes it as ready
    const resolvedPromise = Promise.resolve(module)
    const PreloadedLazyComponent = lazy(() => resolvedPromise)
    lazyComponentCache[cacheKey] = PreloadedLazyComponent
  } catch (error) {
    console.error(`Failed to preload component ${componentName} for ${kit}:`, error)
  }
}

