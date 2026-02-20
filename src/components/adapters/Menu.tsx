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
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Menu({
  children,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
  material,
  carbon,
}: MenuProps) {
  const Component = useComponent('Menu')
  
  // Get elevation from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('Menu', 'elevation')
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar])
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  
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

