/**
 * Button Component Adapter
 * 
 * Unified Button component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import React, { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { parseElevationValue } from '../utils/brandCssVars'
import { readCssVar } from '../../core/css/readCssVar'
import type { ButtonProps } from './common/Button'

// Re-exported so existing `import type { ButtonProps } from '.../adapters/Button'`
// call sites keep working — the types now live in common/Button.ts.
export type { ButtonProps } from './common/Button'

export const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
  const {
    children,
    variant = 'solid',
    size = 'default',
    layer = 'layer-0',
    elevation,
    disabled = false,
    onClick,
    type = 'button',
    className,
    style,
    icon,
    title,
    mantine,
    material,
    carbon,
    ...rest
  } = props
  const Component = useComponent('Button')

  // Get elevation from CSS vars if not provided as props
  // These are set by the toolbar and initialized from recursica_ui-kit.json
  const elevationVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'elevation')
  const disabledElevationVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'disabled-elevation')
  const activeElevationVar = disabled ? disabledElevationVar : elevationVar
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(activeElevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Sync initial state when activeElevationVar changes
    const initialValue = readCssVar(activeElevationVar)
    setElevationFromVar(initialValue ? parseElevationValue(initialValue) : undefined)

    // Get text CSS variables for reactive updates
    const fontFamilyVar = getComponentTextCssVar('Button', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Button', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('Button', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('Button', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Button', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('Button', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('Button', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('Button', 'text', 'font-style')
    
    const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if elevation or any text CSS var was updated
      const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(activeElevationVar)
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdateElevation) {
        const value = readCssVar(activeElevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
      
      if (shouldUpdateText) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      const elevationValue = readCssVar(activeElevationVar)
      setElevationFromVar(elevationValue ? parseElevationValue(elevationValue) : undefined)
      // Force re-render for text vars
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
  }, [activeElevationVar])
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined

  // Map unified props to library-specific props
  const libraryProps = mapButtonProps({
    ...props,
    variant,
    size,
    layer,
    elevation: componentElevation,
    disabled,
    onClick,
    type,
    className,
    style,
    icon,
    mantine,
    material,
    carbon,
  })
  
  return (
    <Suspense fallback={<span />}>
      <Component {...libraryProps} ref={ref}>{children}</Component>
    </Suspense>
  )
})

function mapButtonProps(props: ButtonProps & { elevation?: string }): any {
  const { mantine, material, carbon, title, ...rest } = props
  
  // Base props that work across libraries
  // Include variant, size, layer, and elevation so library adapters can use them
  const baseProps: any = {
    ...rest,
    disabled: props.disabled,
    title: title,
  }
  
  // Library-specific prop mapping
  // This will be handled by the individual library adapters
  // For now, we'll pass through the library-specific props
  
  return {
    ...baseProps,
    // Mantine-specific
    ...(mantine && { mantine }),
    // Material-specific
    ...(material && { material }),
    // Carbon-specific
    ...(carbon && { carbon }),
  }
}

