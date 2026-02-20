/**
 * Switch Component Adapter
 * 
 * Unified Switch component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'
import { buildComponentCssVarPath, getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  layer?: ComponentLayer
  colorVariant?: string
  sizeVariant?: string
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Switch({
  checked,
  onChange,
  disabled = false,
  layer = 'layer-0',
  colorVariant = 'default',
  sizeVariant = 'default',
  elevation,
  className,
  style,
  mantine,
  material,
  carbon,
}: SwitchProps) {
  const Component = useComponent('Switch')
  
  if (!Component) {
    // Fallback to our custom Switch implementation
    const { mode } = useThemeMode()
    
    // Build UIKit CSS var names using buildComponentCssVarPath (automatically includes mode)
    // Switch structure: components.switch.properties.colors.layer-0.thumb-selected
    const thumbSelectedVar = buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'thumb-selected')
    const thumbUnselectedVar = buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'thumb-unselected')
    const trackSelectedVar = buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'track-selected')
    const trackUnselectedVar = buildComponentCssVarPath('Switch', 'properties', 'colors', layer, 'track-unselected')
    const borderRadiusVar = getComponentLevelCssVar('Switch', 'track-border-radius')
    const trackElevationVar = getComponentCssVar('Switch', 'size', 'track-elevation', undefined)
    
    // Reactively read track elevation from CSS variable
    const [trackElevationFromVar, setTrackElevationFromVar] = useState<string | undefined>(() => {
      if (!trackElevationVar) return undefined
      const value = readCssVar(trackElevationVar)
      return value ? parseElevationValue(value) : undefined
    })
    
    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
      if (!trackElevationVar) return
      
      const handleCssVarUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail
        // Update if this CSS var was updated or if no specific vars were specified
        if (!detail?.cssVars || detail.cssVars.includes(trackElevationVar)) {
          const value = readCssVar(trackElevationVar)
          setTrackElevationFromVar(value ? parseElevationValue(value) : undefined)
        }
      }
      
      window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
      
      // Also watch for direct style changes using MutationObserver
      const observer = new MutationObserver(() => {
        const value = readCssVar(trackElevationVar)
        setTrackElevationFromVar(value ? parseElevationValue(value) : undefined)
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
      })
      
      return () => {
        window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
        observer.disconnect()
      }
    }, [trackElevationVar])
    
    // Determine track elevation to apply - prioritize prop, then UIKit.json
    const trackElevationBoxShadow = getElevationBoxShadow(mode, elevation ?? trackElevationFromVar)
    
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={className}
        style={{
          position: 'relative',
          width: '48px',
          height: '24px',
          borderRadius: `var(${borderRadiusVar})`,
          border: 'none',
          background: checked 
            ? `var(${trackSelectedVar})` 
            : `var(${trackUnselectedVar})`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          padding: '2px',
          outline: 'none',
          ...(trackElevationBoxShadow ? { boxShadow: trackElevationBoxShadow } : {}),
          ...style,
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault()
            onChange(!checked)
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: checked ? 'calc(100% - 20px - 2px)' : '2px',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            borderRadius: `var(${borderRadiusVar})`,
            background: checked 
              ? `var(${thumbSelectedVar})` 
              : `var(${thumbUnselectedVar})`,
            zIndex: 1,
            transition: 'left 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        />
      </button>
    )
  }
  
  return (
    <Suspense fallback={<span />}>
      <Component
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        layer={layer}
        colorVariant={colorVariant}
        sizeVariant={sizeVariant}
        elevation={elevation}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}

