/**
 * Avatar Component Adapter
 * 
 * Unified Avatar component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useMemo, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { parseElevationValue } from '../utils/brandCssVars'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: React.ReactNode // e.g., initials or icon
  colorVariant?: 'text' | 'text-solid' | 'text-ghost' | 'icon' | 'icon-solid' | 'icon-ghost' | 'image'
  sizeVariant?: 'small' | 'default' | 'large'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  shape?: 'circle' | 'square'
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Avatar({
  src,
  alt,
  fallback,
  colorVariant = 'text-ghost',
  sizeVariant = 'default',
  layer = 'layer-0',
  elevation,
  shape = 'circle',
  className,
  style,
  mantine,
  material,
  carbon,
}: AvatarProps) {
  const Component = useComponent('Avatar')
  const { mode } = useThemeMode()
  
  // Get elevation from CSS vars if not provided as props
  // These are set by the toolbar and initialized from UIKit.json
  const elevationVar = getComponentLevelCssVar('Avatar', 'elevation')
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if this CSS var was updated or if no specific vars were specified
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
  
  // If variant includes "icon" and no fallback is provided, use the "user" icon from Phosphor
  // If variant is "image" and no src is provided, use the placeholder image
  const resolvedFallback = useMemo(() => {
    if (fallback !== undefined) {
      return fallback
    }
    
    // Check if variant is an icon variant (icon, icon-solid, or icon-ghost)
    // For nested variants, check if it starts with "icon" (with or without secondary variant)
    if (colorVariant?.startsWith('icon')) {
      const UserIcon = iconNameToReactComponent('user')
      if (UserIcon) {
        return <UserIcon style={{ width: '100%', height: '100%' }} />
      }
    }
    
    return fallback
  }, [fallback, colorVariant])
  
  // If variant is "image" and no src is provided, use placeholder image
  const resolvedSrc = useMemo(() => {
    if (src) {
      return src
    }
    
    // If variant is "image" and no src provided, use placeholder
    if (colorVariant === 'image') {
      return '/avatar-placeholder.png'
    }
    
    return src
  }, [src, colorVariant])
  
  if (!Component) {
    // Fallback to native implementation if component not available
    const sizeVar = getComponentCssVar('Avatar', 'size', sizeVariant, undefined)
    
    return (
      <div
        className={className}
        style={{
          width: `var(${sizeVar})`,
          height: `var(${sizeVar})`,
          borderRadius: shape === 'circle' ? '50%' : '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...style,
        }}
      >
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={alt || ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          resolvedFallback
        )}
      </div>
    )
  }
  
  return (
    <Suspense fallback={<div style={{ width: 32, height: 32, borderRadius: '50%' }} />}>
      <Component
        src={resolvedSrc}
        alt={alt}
        fallback={resolvedFallback}
        colorVariant={colorVariant}
        sizeVariant={sizeVariant}
        layer={layer}
        elevation={componentElevation}
        shape={shape}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

