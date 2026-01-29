/**
 * Material UI Chip Implementation
 * 
 * Material UI-specific Chip component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Chip as MaterialChip } from '@mui/material'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { buildVariantColorCssVar, getComponentLevelCssVar, getComponentCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './Chip.css'

export default function Chip({
  children,
  variant = 'unselected',
  size = 'default',
  layer = 'layer-0',
  elevation,
  disabled,
  onClick,
  onDelete,
  deletable = false,
  className,
  style,
  icon,
  material,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Force re-render when CSS vars change (needed for Material UI to pick up CSS var changes)
  const [, setUpdateKey] = useState(0)
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
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
    
    // Get color CSS variables for reactive updates
    const chipColorVarForListener = buildVariantColorCssVar('Chip', variant, 'text', layer)
    const chipIconColorVarForListener = variant === 'error' || variant === 'error-selected' 
      ? getComponentLevelCssVar('Chip', 'colors.error.icon-color')
      : chipColorVarForListener
    
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Re-render if chip CSS vars were updated, or if text CSS vars were updated, or if color vars were updated
      const shouldUpdate = updatedVars.length === 0 || 
        updatedVars.some((v: string) => v.includes('chip') || v.includes('components-chip')) ||
        updatedVars.some((cssVar: string) => textCssVars.includes(cssVar)) ||
        updatedVars.includes(chipColorVarForListener) ||
        updatedVars.includes(chipIconColorVarForListener)
      
      if (shouldUpdate) {
        setUpdateKey(prev => prev + 1)
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      setUpdateKey(prev => prev + 1)
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      observer.disconnect()
    }
  }, [variant, layer])
  
  // Map unified size to Material size
  const materialSize = size === 'small' ? 'small' : 'medium'
  
  // Use UIKit.json chip colors for standard layers
  // Use explicit path building instead of parsing variant names from strings
  const chipBgVar = buildVariantColorCssVar('Chip', variant, 'background', layer)
  const chipBorderVar = buildVariantColorCssVar('Chip', variant, 'border', layer)
  
  // For error variant (including error-selected), use component-level error color CSS variables
  let chipColorVar: string
  let chipIconColorVar: string
  if (variant === 'error' || variant === 'error-selected') {
    chipColorVar = getComponentLevelCssVar('Chip', 'colors.error.text-color')
    chipIconColorVar = getComponentLevelCssVar('Chip', 'colors.error.icon-color')
  } else {
    chipColorVar = buildVariantColorCssVar('Chip', variant, 'text', layer)
    // Non-error variants don't have icon colors defined, so use text color for icons
    chipIconColorVar = chipColorVar
  }
  
  // Get size CSS variables - Chip size properties are component-level (not layer-specific)
  // NEW STRUCTURE: properties.{property}
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap, icon
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon-size')
  const closeIconSizeVar = getComponentLevelCssVar('Chip', 'close-icon-size')
  const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
  // Get icon color CSS variables - fallback to chipIconColorVar if not set
  const leadingIconColorVar = getComponentLevelCssVar('Chip', 'leading-icon-color')
  const closeIconColorVar = getComponentLevelCssVar('Chip', 'close-icon-color')
  const horizontalPaddingVar = getComponentLevelCssVar('Chip', 'horizontal-padding')
  const verticalPaddingVar = getComponentLevelCssVar('Chip', 'vertical-padding')
  const borderSizeVar = getComponentLevelCssVar('Chip', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Chip', 'border-radius')
  
  // Get text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const fontFamilyVar = getComponentTextCssVar('Chip', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Chip', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Chip', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Chip', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Chip', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Chip', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Chip', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Chip', 'text', 'font-style')
  
  // Use Button's max-width and height vars (same as Button component)
  // Use Chip's own min-width so toolbar can control it
  // NEW STRUCTURE: properties.min-width, properties.max-width
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const minWidthVar = getComponentLevelCssVar('Chip', 'min-width') || getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const maxWidthVar = getComponentLevelCssVar('Chip', 'max-width') || getComponentCssVar('Button', 'size', 'max-width', undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  
  // Destructure adapter-specific props to avoid passing them to the component
  const { mantine, carbon, ...restProps } = props
  
  // Get close icon component
  const CloseIcon = iconNameToReactComponent('x')
  const CheckIcon = iconNameToReactComponent('check')
  const isSelected = variant === 'selected' || variant === 'error-selected'
  const showCheckmark = isSelected && !!CheckIcon
  const closeIconElement = CloseIcon ? <CloseIcon width="100%" height="100%" /> : undefined
  
  // Render icon with checkmark overlay for selected variants
  const renderIcon = () => {
    if (!icon && !showCheckmark) return undefined
    
    return (
      <span
        style={{
          width: `var(${iconSizeVar}, 16px)`,
          height: `var(${iconSizeVar}, 16px)`,
          minWidth: `var(${iconSizeVar}, 16px)`,
          minHeight: `var(${iconSizeVar}, 16px)`,
          maxWidth: `var(${iconSizeVar}, 16px)`,
          maxHeight: `var(${iconSizeVar}, 16px)`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
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
  }
  
  // Merge library-specific props
  const materialProps = {
    size: materialSize,
    disabled,
    clickable: !!onClick && !disabled,
    onClick: disabled ? undefined : onClick,
    onDelete: deletable && onDelete ? onDelete : undefined,
    // Use rendered icon with checkmark overlay for selected variants
    icon: renderIcon(),
    // Use icon component for delete icon instead of default Material UI delete icon
    deleteIcon: deletable && onDelete && closeIconElement ? (
      <span style={{
        width: `var(${closeIconSizeVar}, 16px)`,
        height: `var(${closeIconSizeVar}, 16px)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {closeIconElement}
      </span>
    ) : undefined,
    className,
    sx: {
      backgroundColor: 'var(--chip-bg)',
      color: (variant === 'error' || variant === 'error-selected') ? `var(${chipColorVar})` : 'var(--chip-color)',
      borderColor: `var(${chipBorderVar})`,
      borderWidth: `var(${borderSizeVar})`,
      paddingLeft: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingRight: `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      paddingTop: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      paddingBottom: `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      borderRadius: `var(${borderRadiusVar})`,
      // Apply text styles using CSS variables from text style toolbar
      fontFamily: fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: fontWeightVar ? `var(${fontWeightVar})` : undefined,
      letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
      lineHeight: lineHeightVar ? `var(${lineHeightVar})` : undefined,
      textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') : 'none',
      textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') : 'none',
      fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal',
      // Set CSS custom properties for CSS file
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Don't set --chip-icon-text-gap here - let CSS use UIKit variable directly for real-time updates
      // Use Button's min-width and max-width vars (same as Button component)
      // Don't use fixed height - let padding and content determine height naturally
      minWidth: `var(${minWidthVar})`,
      maxWidth: `var(${maxWidthVar})`,
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        return elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}
      })(),
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled)`,
      }),
      ...material?.sx,
    },
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': `var(${chipBgVar})`,
      // Use UIKit CSS variable directly for reactive updates - CSS will reference this
      '--chip-color': chipColorVar ? `var(${chipColorVar})` : undefined,
      '--chip-icon-color': chipIconColorVar ? `var(${chipIconColorVar})` : undefined,
      '--chip-border': `var(${chipBorderVar})`,
      '--chip-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--chip-close-icon-size': deletable && onDelete ? `var(${closeIconSizeVar})` : '0px',
      '--chip-leading-icon-color': leadingIconColorVar ? `var(${leadingIconColorVar})` : (chipIconColorVar ? `var(${chipIconColorVar})` : undefined),
      '--chip-close-icon-color': closeIconColorVar ? `var(${closeIconColorVar})` : (chipIconColorVar ? `var(${chipIconColorVar})` : undefined),
      // Don't set --chip-icon-text-gap here - let CSS use UIKit variable directly for real-time updates
      '--chip-border-size': `var(${borderSizeVar})`,
      // Use Button's min-width and max-width vars (same as Button component)
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
      ...style,
    },
    ...material,
    ...restProps,
  }
  
  // Use variant as key to force Material UI to re-render when variant changes
  return <MaterialChip key={`chip-${variant}-${layer}`} {...(materialProps as any)} label={children} />
}

