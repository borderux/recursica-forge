/**
 * Tooltip Component Adapter
 * 
 * Unified Tooltip component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import { parseElevationValue, getElevationBoxShadow } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TooltipProps = {
  children?: React.ReactNode
  label?: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  alignment?: 'start' | 'middle' | 'end'
  layer?: ComponentLayer
  elevation?: string
  opened?: boolean
  zIndex?: number
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Tooltip({
  children,
  label,
  position = 'top',
  alignment = 'middle',
  layer = 'layer-0',
  elevation,
  opened,
  zIndex,
  className,
  style,
  mantine,
  material,
  carbon,
}: TooltipProps) {
  const Component = useComponent('Tooltip')
  const { mode } = useThemeMode()

  // Get elevation from CSS vars if not provided as props
  // Elevation is resolved per layer and mode
  const elevationVar = useMemo(() => {
    return buildComponentCssVarPath('Tooltip', 'properties', 'elevation', mode)
  }, [mode])

  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Get text CSS variables for reactive updates (standard structure)
    const textPath = ['properties', 'text']
    const textCssVars = [
      buildComponentCssVarPath('Tooltip', ...textPath, 'font-family', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'font-size', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'font-weight', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'letter-spacing', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'line-height', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'text-decoration', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'text-transform', mode),
      buildComponentCssVarPath('Tooltip', ...textPath, 'font-style', mode),
    ]

    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(elevationVar)
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))

      if (shouldUpdateElevation) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }

      if (shouldUpdateText) {
        setTextVarsUpdate(prev => prev + 1)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    const observer = new MutationObserver(() => {
      const elevationValue = readCssVar(elevationVar)
      setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
      setTextVarsUpdate(prev => prev + 1)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [elevationVar, mode])

  const componentElevation = elevation ?? elevationFromVar ?? 'elevation-4'

  if (!Component) {
    return (
      <div className={className} style={{ display: 'inline-block', position: 'relative', ...style }}>
        {label && opened && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: '#333',
            color: '#fff',
            borderRadius: 4,
            fontSize: 12,
            whiteSpace: 'nowrap',
            marginBottom: 8,
            zIndex: zIndex ?? 300,
            boxShadow: getElevationBoxShadow(mode, componentElevation)
          }}>
            {label}
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component
        label={label}
        position={position}
        alignment={alignment}
        layer={layer}
        elevation={componentElevation}
        opened={opened}
        zIndex={zIndex}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}
