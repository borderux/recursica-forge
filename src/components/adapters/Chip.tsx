/**
 * Chip Component Adapter
 * 
 * Unified Chip component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type ChipProps = {
  children?: React.ReactNode
  variant?: 'unselected' | 'selected' | 'error' | 'error-selected'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  elevation?: string // e.g., "elevation-0", "elevation-1", etc.
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
  
  // Get elevation from CSS vars if not provided as props
  const elevationVar = getComponentLevelCssVar('Chip', 'elevation')
  
  // Reactively read elevation from CSS variable
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Get text CSS variables for reactive updates
    const fontFamilyVar = getComponentTextCssVar('Chip', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Chip', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('Chip', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('Chip', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Chip', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('Chip', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('Chip', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('Chip', 'text', 'font-style')
    
    const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update elevation if it was changed
      const shouldUpdateElevation = !detail?.cssVars || detail.cssVars.includes(elevationVar)
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdateElevation) {
        const value = readCssVar(elevationVar)
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
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
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
  }, [elevationVar])
  
  const componentElevation = elevation ?? elevationFromVar ?? undefined
  
  if (!Component) {
    // Fallback to native element if component not available
    // Chip size properties are nested by layer, not by size variant
    // Icon is a component-level property (not layer-specific)
    // NEW STRUCTURE: properties.icon-size
    const iconSizeVar = getComponentLevelCssVar('Chip', 'icon-size')
    const closeIconSizeVar = getComponentLevelCssVar('Chip', 'close-icon-size')
    // icon-text-gap is at component level (not under size) in UIKit.json
    // NEW STRUCTURE: properties.icon-text-gap
    const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
    
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={className}
        style={{
          ...getChipStyles(variant, size, layer, disabled, componentElevation, mode),
          display: 'inline-flex',
          alignItems: 'center',
          gap: icon && children ? `var(${iconGapVar})` : 0,
          cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
          ...style,
        }}
      >
        {(() => {
          const CheckIcon = iconNameToReactComponent('check')
          const isSelected = variant === 'selected' || variant === 'error-selected'
          const showCheckmark = isSelected && !!CheckIcon
          
          if (!icon && !showCheckmark) return null
          
          return (
            <span style={{
              display: 'inline-flex',
              width: `var(${iconSizeVar})`,
              height: `var(${iconSizeVar})`,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}>
              {/* Leading icon with disabled opacity if checkmark is present */}
              {icon && (
                <span
                  style={{
                    position: showCheckmark ? 'absolute' : 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: showCheckmark ? `var(--recursica-brand-${mode}-state-disabled, 0.5)` : 1,
                  }}
                >
                  {icon}
                </span>
              )}
              {/* Checkmark icon on top */}
              {showCheckmark && (
                <span
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <CheckIcon width="100%" height="100%" />
                </span>
              )}
            </span>
          )
        })()}
        {children}
        {deletable && onDelete && (() => {
          const CloseIcon = iconNameToReactComponent('x')
          return (
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
                width: `var(${closeIconSizeVar}, 16px)`,
                height: `var(${closeIconSizeVar}, 16px)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {CloseIcon ? <CloseIcon width="100%" height="100%" /> : '×'}
            </button>
          )
        })()}
      </div>
    )
  }
  
  // Map unified props to library-specific props
  const libraryProps = mapChipProps({
    variant,
    size,
    layer,
    elevation: componentElevation,
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
  mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // Get color CSS variables
  // Use UIKit.json chip colors for standard layers
  // Use explicit path building instead of parsing variant names from strings
  const bgVar = buildVariantColorCssVar('Chip', variant, 'background', layer)
  const borderVar = buildVariantColorCssVar('Chip', variant, 'border', layer)
  
  // For error variant (including error-selected), use component-level error color CSS variables
  let textVar: string
  if (variant === 'error' || variant === 'error-selected') {
    textVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
  } else {
    textVar = buildVariantColorCssVar('Chip', variant, 'text', layer)
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
  
  // Get text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const fontFamilyVar = getComponentTextCssVar('Chip', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Chip', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Chip', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Chip', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Chip', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Chip', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Chip', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Chip', 'text', 'font-style')
  
  // Apply color styles
  styles.backgroundColor = `var(${bgVar})`
  styles.color = `var(${textVar})`
  styles.border = `var(${borderSizeVar}, 1px) solid var(${borderVar})`
  
  // Apply text styles using CSS variables from text style toolbar
  styles.fontFamily = fontFamilyVar ? `var(${fontFamilyVar})` : undefined
  styles.fontSize = fontSizeVar ? `var(${fontSizeVar})` : undefined
  styles.fontWeight = fontWeightVar ? `var(${fontWeightVar})` : undefined
  styles.letterSpacing = letterSpacingVar ? `var(${letterSpacingVar})` : undefined
  styles.lineHeight = lineHeightVar ? `var(${lineHeightVar})` : undefined
  styles.textDecoration = textDecorationVar ? (readCssVar(textDecorationVar) || 'none') : 'none'
  styles.textTransform = textTransformVar ? (readCssVar(textTransformVar) || 'none') as React.CSSProperties['textTransform'] : 'none'
  styles.fontStyle = fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal'
  
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

function mapChipProps(props: ChipProps & { elevation?: string }): any {
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

