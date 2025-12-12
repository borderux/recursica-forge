/**
 * Button Component Adapter
 * 
 * Unified Button component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ButtonProps = {
  children?: React.ReactNode
  variant?: 'solid' | 'outline' | 'text'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  alternativeLayer?: string | null // e.g., "high-contrast", "none", null
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
} & LibrarySpecificProps

export function Button({
  children,
  variant = 'solid',
  size = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
  disabled = false,
  onClick,
  type = 'button',
  className,
  style,
  icon,
  mantine,
  material,
  carbon,
}: ButtonProps) {
  const Component = useComponent('Button')
  const { mode } = useThemeMode()
  
  // Get elevation and alternative-layer from CSS vars if not provided as props
  // These are set by the toolbar and initialized from UIKit.json
  const elevationVar = getComponentLevelCssVar('Button', 'elevation')
  const alternativeLayerVar = getComponentLevelCssVar('Button', 'alternative-layer')
  
  const componentElevation = elevation ?? readCssVar(elevationVar) ?? undefined
  const componentAlternativeLayer = alternativeLayer !== undefined 
    ? alternativeLayer 
    : (readCssVar(alternativeLayerVar) === 'none' ? null : readCssVar(alternativeLayerVar)) ?? null
  
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
        style={{
          ...getButtonStyles(variant, size, layer, disabled, componentElevation, componentAlternativeLayer, mode),
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
    alternativeLayer: componentAlternativeLayer,
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
  alternativeLayer?: string | null,
  mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // If alternativeLayer is set (not null and not "none"), override all surface/color props
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  // For alternative layers, use the layer's own colors directly since UIKit.json only defines layer-0 through layer-3
  // For standard layers, use UIKit.json button colors
  let bgVar: string
  let textVar: string
  
  if (hasComponentAlternativeLayer) {
    // Component has alternative-layer prop set - use that alt layer's properties
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    
    // Use alternative layer's interactive color and surface
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    if (variant === 'solid') {
      bgVar = `${layerBase}-element-interactive-tone`
      textVar = `${layerBase}-element-interactive-on-tone`
    } else {
      // outline and text variants use interactive-tone for text color
      bgVar = `${layerBase}-surface`
      textVar = `${layerBase}-element-interactive-tone`
    }
  } else if (isAlternativeLayer) {
    // Extract alternative key (e.g., "high-contrast" from "layer-alternative-high-contrast")
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    
    // Use alternative layer's interactive color and surface
    // For outline and text variants, use interactive-tone (not on-tone) to match UIKit.json pattern
    if (variant === 'solid') {
      bgVar = `${layerBase}-element-interactive-tone`
      textVar = `${layerBase}-element-interactive-on-tone`
    } else {
      // outline and text variants use interactive-tone for text color
      bgVar = `${layerBase}-surface`
      textVar = `${layerBase}-element-interactive-tone`
    }
  } else {
    // Use UIKit.json button colors for standard layers
    bgVar = getComponentCssVar('Button', 'color', `${variant}-background`, layer)
    textVar = getComponentCssVar('Button', 'color', `${variant}-text`, layer)
  }
  
  const heightVar = getComponentCssVar('Button', 'size', 'height', undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', 'min-width', undefined)
  const paddingVar = getComponentCssVar('Button', 'size', 'horizontal-padding', undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const fontSizeVar = getComponentCssVar('Button', 'size', 'font-size', undefined)
  
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
    styles.border = 'none'
  } else if (variant === 'outline') {
    // For outline, use outline-specific CSS variables
    styles.backgroundColor = `var(${bgVar})`
    styles.color = `var(${textVar})`
    // For outline, use text color as border color (which is the outline-text CSS var)
    styles.border = `1px solid var(${textVar})`
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
  styles.fontSize = fontSizeVar ? `var(${fontSizeVar})` : undefined
  styles.fontWeight = 'var(--recursica-brand-typography-button-font-weight)'
  
  // Apply disabled styles - use brand disabled opacity, don't change colors
  if (disabled) {
    styles.opacity = `var(--recursica-brand-${mode}-state-disabled)`
    styles.cursor = 'not-allowed'
  } else {
    styles.cursor = 'pointer'
  }
  
  // Apply elevation - prioritize alt layer elevation if alt-layer is set, otherwise use component elevation
  let elevationToApply: string | undefined = elevation
  
  if (hasComponentAlternativeLayer) {
    // Read elevation from alt layer's property
    const altLayerElevationVar = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property-elevation`
    const altLayerElevation = readCssVar(altLayerElevationVar)
    if (altLayerElevation) {
      // Parse elevation value - could be a brand reference like "{brand.themes.light.elevations.elevation-4}"
      const match = altLayerElevation.match(/elevations\.(elevation-\d+)/)
      if (match) {
        elevationToApply = match[1]
      } else if (/^elevation-\d+$/.test(altLayerElevation)) {
        elevationToApply = altLayerElevation
      }
    }
    // If alt layer doesn't have elevation, fall back to component-level elevation
    if (!elevationToApply) {
      elevationToApply = elevation
    }
  }
  
  // Apply elevation if set (and not elevation-0)
  if (elevationToApply && elevationToApply !== 'elevation-0') {
    const elevationMatch = elevationToApply.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      // Build box-shadow from elevation CSS variables
      // Format: x-axis y-axis blur spread shadow-color
      styles.boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
  }
  
  return styles
}

function mapButtonProps(props: ButtonProps & { elevation?: string; alternativeLayer?: string | null }): any {
  const { mantine, material, carbon, ...rest } = props
  
  // Base props that work across libraries
  // Include variant, size, layer, elevation, and alternativeLayer so library adapters can use them
  const baseProps: any = {
    ...rest,
    disabled: props.disabled,
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

