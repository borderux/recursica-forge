/**
 * Chip Component Adapter
 * 
 * Unified Chip component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildVariantColorCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ChipProps = {
  children?: React.ReactNode
  variant?: 'unselected' | 'selected' | 'error' | 'error-selected'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
  alternativeLayer?: string | null // e.g., "high-contrast", "none", null
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  deletable?: boolean
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
} & LibrarySpecificProps

export function Chip({
  children,
  variant = 'unselected',
  size = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
  disabled = false,
  onClick,
  onDelete,
  deletable = false,
  className,
  style,
  icon,
  mantine,
  material,
  carbon,
}: ChipProps) {
  const Component = useComponent('Chip')
  const { mode } = useThemeMode()
  
  // Get elevation and alternative-layer from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('Chip', 'elevation')
  const alternativeLayerVar = getComponentLevelCssVar('Chip', 'alternative-layer')
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update elevation if it was changed
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver (only for elevation)
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
  const componentAlternativeLayer = alternativeLayer !== undefined 
    ? alternativeLayer 
    : (readCssVar(alternativeLayerVar) === 'none' ? null : readCssVar(alternativeLayerVar)) ?? null
  
  if (!Component) {
    // Fallback to native element if component not available
    // Chip size properties are nested by layer, not by size variant
    // Icon is a component-level property (not layer-specific)
    // NEW STRUCTURE: properties.icon-size
    const iconSizeVar = getComponentLevelCssVar('Chip', 'icon-size')
    // icon-text-gap is at component level (not under size) in UIKit.json
    // NEW STRUCTURE: properties.icon-text-gap
    const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
    
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={className}
        style={{
          ...getChipStyles(variant, size, layer, disabled, componentElevation, componentAlternativeLayer, mode),
          display: 'inline-flex',
          alignItems: 'center',
          gap: icon && children ? `var(${iconGapVar})` : 0,
          cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
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
        {deletable && onDelete && (
          <button
            disabled={disabled}
            onClick={disabled ? undefined : (e) => {
              e.stopPropagation()
              onDelete(e)
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: 0,
              marginLeft: '4px',
              opacity: disabled ? `var(--recursica-brand-${mode}-state-disabled, 0.5)` : undefined,
            }}
          >
            ×
          </button>
        )}
      </div>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapChipProps({
    variant,
    size,
    layer,
    elevation: componentElevation,
    alternativeLayer: componentAlternativeLayer,
    disabled,
    onClick,
    onDelete,
    deletable,
    className,
    style,
    icon,
    mantine,
    material,
    carbon,
  })
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function getChipStyles(
  variant: 'unselected' | 'selected' | 'error' | 'error-selected',
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
  
  // Get color CSS variables
  let bgVar: string
  let textVar: string
  let borderVar: string
  
  if (hasComponentAlternativeLayer) {
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    bgVar = `${layerBase}-surface`
    textVar = `${layerBase}-element-interactive-on-tone`
    borderVar = `${layerBase}-border-color`
  } else if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    bgVar = `${layerBase}-surface`
    textVar = `${layerBase}-element-interactive-on-tone`
    borderVar = `${layerBase}-border-color`
  } else {
    // Use UIKit.json chip colors for standard layers
    // Use explicit path building instead of parsing variant names from strings
    bgVar = buildVariantColorCssVar('Chip', variant, 'background', layer)
    borderVar = buildVariantColorCssVar('Chip', variant, 'border', layer)
    
    // For error variant (including error-selected), use component-level error color CSS variables
    if (variant === 'error' || variant === 'error-selected') {
      textVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
    } else {
      textVar = buildVariantColorCssVar('Chip', variant, 'text', layer)
    }
  }
  
  // Get size CSS variables - Chip size properties are component-level (not layer-specific)
  // NEW STRUCTURE: properties.{property}
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon, min-width, max-width
  const horizontalPaddingVar = getComponentLevelCssVar('Chip', 'horizontal-padding')
  const verticalPaddingVar = getComponentLevelCssVar('Chip', 'vertical-padding')
  const borderSizeVar = getComponentLevelCssVar('Chip', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Chip', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('Chip', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Chip', 'max-width')
  
  // Get text styling CSS variables - text-size or font-size is at component level (not under size)
  // Try text-size first (new), fallback to font-size (legacy)
  const fontSizeVar = getComponentLevelCssVar('Chip', 'text-size') || getComponentLevelCssVar('Chip', 'font-size')
  
  // Apply color styles
  styles.backgroundColor = `var(${bgVar})`
  styles.color = `var(${textVar})`
  styles.border = `var(${borderSizeVar}, 1px) solid var(${borderVar})`
  
  // Apply text styles - Chip uses caption typography
  styles.fontSize = fontSizeVar ? `var(${fontSizeVar})` : undefined
  // Set CSS variable for font-weight so it can be overridden by inline styles
  ;(styles as any)['--chip-font-weight'] = 'var(--recursica-brand-typography-caption-font-weight)'
  styles.fontWeight = 'var(--chip-font-weight, var(--recursica-brand-typography-caption-font-weight))'
  styles.textTransform = 'none' // Ensure text is not uppercase
  
  // Apply size styles - height and width are derived from content and padding
  // Add fallbacks to ensure padding is always applied even if UIKit variables aren't set
  styles.paddingLeft = `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`
  styles.paddingRight = `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`
  styles.paddingTop = `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`
  styles.paddingBottom = `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`
  styles.borderRadius = `var(${borderRadiusVar})`
  styles.minWidth = minWidthVar ? `var(${minWidthVar})` : undefined
  styles.maxWidth = maxWidthVar ? `var(${maxWidthVar})` : undefined
  
  // Apply disabled styles
  if (disabled) {
    styles.opacity = `var(--recursica-brand-${mode}-state-disabled)`
    styles.cursor = 'not-allowed'
  }
  
  // Apply elevation if set (and not elevation-0)
  if (elevation && elevation !== 'elevation-0') {
    styles.boxShadow = getElevationBoxShadow(mode, elevation) || undefined
  }
  
  return styles
}

function mapChipProps(props: ChipProps & { elevation?: string; alternativeLayer?: string | null }): any {
  const { mantine, material, carbon, ...rest } = props
  
  const baseProps: any = {
    ...rest,
    disabled: props.disabled,
  }
  
  return {
    ...baseProps,
    ...(mantine && { mantine }),
    ...(material && { material }),
    ...(carbon && { carbon }),
  }
}

