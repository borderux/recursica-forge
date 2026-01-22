/**
 * Button Component Adapter
 * 
 * Unified Button component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import { getBrandTypographyCssVar, getBrandStateCssVar, getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { useCssVar } from '../hooks/useCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ButtonProps = {
  children?: React.ReactNode
  variant?: 'solid' | 'outline' | 'text'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  title?: string
} & LibrarySpecificProps

export function Button({
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
}: ButtonProps) {
  const Component = useComponent('Button')
  const { mode } = useThemeMode()
  
  // Get elevation from CSS vars if not provided as props
  // These are set by the toolbar and initialized from UIKit.json
  const elevationVar = getComponentLevelCssVar('Button', 'elevation')
  
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
  
  if (!Component) {
    // Fallback to native button if component not available
    const sizePrefix = size === 'small' ? 'small' : 'default'
    const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
    const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
    
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        title={title}
        style={{
          ...getButtonStyles(variant, size, layer, disabled, componentElevation, mode),
          display: 'flex',
          alignItems: 'center',
          gap: icon ? `var(${iconGapVar})` : 0,
          ...style,
        }}
      >
        {icon && (
          <span style={{
            display: 'inline-flex',
            width: `var(${iconSizeVar})`,
            height: `var(${iconSizeVar})`,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </span>
        )}
        {children}
      </button>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapButtonProps({
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
    <Suspense fallback={<button disabled>Loading...</button>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function getButtonStyles(
  variant: 'solid' | 'outline' | 'text',
  size: 'default' | 'small',
  layer: ComponentLayer,
  disabled: boolean,
  elevation?: string,
  mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // Use UIKit.json button colors for standard layers
  const bgVar = getComponentCssVar('Button', 'colors', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Button', 'colors', `${variant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const borderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'colors', layer, 'border')
  
  const heightVar = getComponentCssVar('Button', 'size', 'height', undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', 'min-width', undefined)
  const paddingVar = getComponentCssVar('Button', 'size', 'horizontal-padding', undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  
  // Get all typography properties from the typography style
  const fontFamilyVar = getBrandTypographyCssVar('button', 'font-family')
  const fontSizeVar = getBrandTypographyCssVar('button', 'font-size')
  const fontWeightVar = getBrandTypographyCssVar('button', 'font-weight')
  const letterSpacingVar = getBrandTypographyCssVar('button', 'font-letter-spacing')
  const lineHeightVar = getBrandTypographyCssVar('button', 'line-height')
  
  // Get border-size CSS variable (variant-specific property)
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', variant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  
  // Size-specific vars - UIKit.json structure: size.default.height, size.small.height
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const sizeHeightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const sizeMinWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const sizePaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  
  // Use CSS variable references directly instead of reading values
  // This allows dynamic updates and proper CSS variable resolution
  const heightVarName = sizeHeightVar || heightVar
  const minWidthVarName = sizeMinWidthVar || minWidthVar
  const paddingVarName = sizePaddingVar || paddingVar
  
  // Apply variant styles - always use CSS variable references directly
  if (variant === 'solid') {
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    // Use actual CSS border instead of box-shadow
    styles.border = `${borderSizeValue || '1px'} solid var(${borderColorVar || textVar})`
  } else if (variant === 'outline') {
    // For outline, use outline-specific CSS variables
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    // Use actual CSS border instead of box-shadow
    styles.border = `${borderSizeValue || '1px'} solid var(${borderColorVar || textVar})`
  } else {
    // text variant
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    styles.border = 'none'
  }
  
  // Apply size styles using CSS variable references directly
  styles.height = heightVarName ? `var(${heightVarName})` : (size === 'small' ? '32px' : '48px')
  styles.minWidth = minWidthVarName ? `var(${minWidthVarName})` : (size === 'small' ? '32px' : '48px')
  styles.paddingLeft = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.paddingRight = paddingVarName ? `var(${paddingVarName})` : '12px'
  styles.borderRadius = borderRadiusVar ? `var(${borderRadiusVar})` : '8px'
  styles.fontFamily = `var(${fontFamilyVar})`
  styles.fontSize = `var(${fontSizeVar})`
  styles.fontWeight = `var(${fontWeightVar})`
  styles.letterSpacing = `var(${letterSpacingVar})`
  styles.lineHeight = `var(${lineHeightVar})`
  
  // Apply disabled styles - use brand disabled opacity, don't change colors
  if (disabled) {
    styles.opacity = `var(${getBrandStateCssVar(mode, 'disabled')})`
    styles.cursor = 'not-allowed'
  } else {
    styles.cursor = 'pointer'
  }
  
  // Apply elevation if set (and not elevation-0)
  // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
  const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
  if (elevationBoxShadow) {
    styles.boxShadow = elevationBoxShadow
  }
  
  return styles
}

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

