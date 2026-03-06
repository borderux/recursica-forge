/**
 * Menu Component Adapter
 * 
 * Unified Menu component that renders the appropriate library implementation
 * based on the current UI kit selection. Contains MenuItem components.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type MenuProps = {
  children?: React.ReactNode
  layer?: ComponentLayer
  elevation?: string
  maxHeight?: number
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Menu({
  children,
  layer = 'layer-0',
  elevation,
  maxHeight,
  className,
  style,
  mantine,
  material,
  carbon,
}: MenuProps) {
  const Component = useComponent('Menu')

  // Get elevation from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('Menu', 'elevation')
  const maxHeightVar = getComponentLevelCssVar('Menu', 'max-height')

  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  // Reactively read max-height from CSS variable
  const [maxHeightFromVar, setMaxHeightFromVar] = useState<number | undefined>(() => {
    const value = readCssVar(maxHeightVar)
    return value ? parseInt(value, 10) : undefined
  })

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
      if (!detail?.cssVars || detail.cssVars.includes(maxHeightVar)) {
        const value = readCssVar(maxHeightVar)
        setMaxHeightFromVar(value ? parseInt(value, 10) : undefined)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
      const mhValue = readCssVar(maxHeightVar)
      setMaxHeightFromVar(mhValue ? parseInt(mhValue, 10) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar, maxHeightVar])

  const componentElevation = elevation ?? elevationFromVar ?? undefined
  const componentMaxHeight = maxHeight ?? maxHeightFromVar ?? 600

  if (!Component) {
    // Fallback to simple div if component not available
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  const libraryProps = {
    layer,
    elevation: componentElevation,
    maxHeight: componentMaxHeight,
    className,
    style,
    mantine,
    material,
    carbon,
  }

  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

