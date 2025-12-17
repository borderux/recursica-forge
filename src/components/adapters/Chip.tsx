/**
 * Chip Component Adapter
 * 
 * Unified Chip component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ChipProps = {
  children?: React.ReactNode
  variant?: 'unselected' | 'selected'
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
  
  const componentElevation = elevation ?? readCssVar(elevationVar) ?? undefined
  const componentAlternativeLayer = alternativeLayer !== undefined 
    ? alternativeLayer 
    : (readCssVar(alternativeLayerVar) === 'none' ? null : readCssVar(alternativeLayerVar)) ?? null
  
  if (!Component) {
    // Fallback to native element if component not available
    // Chip size properties are nested by layer, not by size variant
    const iconSizeVar = getComponentCssVar('Chip', 'size', 'icon', layer)
    const iconGapVar = getComponentCssVar('Chip', 'size', 'icon-text-gap', layer)
    
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={className}
        style={{
          ...getChipStyles(variant, size, layer, disabled, componentElevation, componentAlternativeLayer, mode),
          display: 'inline-flex',
          alignItems: 'center',
          gap: icon ? `var(${iconGapVar})` : 0,
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
            onClick={(e) => {
              e.stopPropagation()
              onDelete(e)
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginLeft: '4px',
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
  variant: 'unselected' | 'selected',
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
    bgVar = getComponentCssVar('Chip', 'color', `${variant}-background`, layer)
    textVar = getComponentCssVar('Chip', 'color', `${variant}-text`, layer)
    borderVar = getComponentCssVar('Chip', 'color', `${variant}-border`, layer)
  }
  
  // Get size CSS variables - Chip size properties are nested by layer, not by size variant
  // UIKit.json structure: chip.size.layer-0.border-radius, chip.size.layer-0.horizontal-padding, etc.
  // Properties that exist: border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon, max-width
  // Properties that don't exist: height, min-width (use fallbacks)
  const paddingVar = getComponentCssVar('Chip', 'size', 'horizontal-padding', layer)
  const borderRadiusVar = getComponentCssVar('Chip', 'size', 'border-radius', layer)
  const verticalPaddingVar = getComponentCssVar('Chip', 'size', 'vertical-padding', layer)
  
  // Apply color styles
  styles.backgroundColor = `var(${bgVar})`
  styles.color = `var(${textVar})`
  styles.border = `1px solid var(${borderVar})`
  
  // Apply size styles
  // Height and min-width don't exist in UIKit.json, so use fallbacks
  // Height can be calculated from vertical-padding if available, otherwise use fallback
  styles.height = size === 'small' ? '24px' : '32px'
  styles.minWidth = size === 'small' ? '24px' : '32px'
  styles.paddingLeft = `var(${paddingVar}, 12px)`
  styles.paddingRight = `var(${paddingVar}, 12px)`
  styles.borderRadius = `var(${borderRadiusVar}, 16px)`
  
  // Apply disabled styles
  if (disabled) {
    styles.opacity = `var(--recursica-brand-${mode}-state-disabled)`
    styles.cursor = 'not-allowed'
  }
  
  // Apply elevation if set (and not elevation-0)
  if (elevation && elevation !== 'elevation-0') {
    const elevationMatch = elevation.match(/elevation-(\d+)/)
    if (elevationMatch) {
      const elevationLevel = elevationMatch[1]
      styles.boxShadow = `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
    }
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

