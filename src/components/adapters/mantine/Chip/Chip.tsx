/**
 * Mantine Chip Implementation
 * 
 * Mantine-specific Chip component that uses CSS variables for theming.
 * Note: Mantine doesn't have a native Chip component, so we use Badge as the base.
 */

import React, { useState, useEffect } from 'react'
import { Badge, ActionIcon } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterChipProps) {
  const { mode } = useThemeMode()
  
  // Force re-render when CSS vars change (needed for Mantine to pick up CSS var changes)
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
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : 'md'
  
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
  
  // CSS variables in stylesheets ARE reactive - they update automatically when the variable on documentElement changes
  // The border-size is set via CSS custom property in styles.root, which will update reactively
  
  // Use Button's max-width and height vars (same as Button component)
  // Use Chip's own min-width so toolbar can control it
  // NEW STRUCTURE: properties.min-width, properties.max-width
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const minWidthVar = getComponentLevelCssVar('Chip', 'min-width') || getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const maxWidthVar = getComponentLevelCssVar('Chip', 'max-width') || getComponentCssVar('Button', 'size', 'max-width', undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  
  // Handle delete functionality - use ActionIcon in rightSection
  const CloseIcon = iconNameToReactComponent('x')
  const CheckIcon = iconNameToReactComponent('check')
  const isSelected = variant === 'selected' || variant === 'error-selected'
  const showCheckmark = isSelected && !!CheckIcon
  
  const deleteIcon = deletable && onDelete ? (
    <ActionIcon
      size="xs"
      radius="xl"
      variant="transparent"
      disabled={disabled}
      onClick={disabled ? undefined : (e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete(e)
      }}
      className="recursica-chip-delete"
      style={{
        color: 'inherit',
        width: `var(${closeIconSizeVar}, 16px)`,
        height: `var(${closeIconSizeVar}, 16px)`,
        minWidth: `var(${closeIconSizeVar}, 16px)`,
        minHeight: `var(${closeIconSizeVar}, 16px)`,
        maxWidth: `var(${closeIconSizeVar}, 16px)`,
        maxHeight: `var(${closeIconSizeVar}, 16px)`,
      }}
    >
      {CloseIcon ? <CloseIcon width="100%" height="100%" /> : '×'}
    </ActionIcon>
  ) : undefined
  
  // Build leftSection content - render checkmark for selected variants, with leading icon if provided
  const leftSectionContent = (showCheckmark || icon) ? (
    <span 
      className="recursica-chip-left-section"
      style={{
        width: `var(${iconSizeVar}, 16px)`,
        height: `var(${iconSizeVar}, 16px)`,
        minWidth: `var(${iconSizeVar}, 16px)`,
        minHeight: `var(${iconSizeVar}, 16px)`,
        maxWidth: `var(${iconSizeVar}, 16px)`,
        maxHeight: `var(${iconSizeVar}, 16px)`,
        flexShrink: 0,
        flexGrow: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        boxSizing: 'border-box',
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
      {/* Checkmark icon - uses leading icon size (iconSizeVar) via container sizing
          The container above uses iconSizeVar, and this checkmark fills 100% of that container */}
      {showCheckmark && CheckIcon && (
        <span
          style={{
            position: icon ? 'absolute' : 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: icon ? 1 : undefined,
          }}
        >
          {/* Checkmark uses leading icon size via container - iconSizeVar is the leading icon size CSS variable */}
          <CheckIcon width="100%" height="100%" />
        </span>
      )}
    </span>
  ) : undefined
  
  // Merge library-specific props
  // Note: Mantine Badge doesn't support onClick directly, so use component="button" when onClick is provided
  const mantineProps: any = {
    size: mantineSize,
    disabled,
    'data-disabled': disabled ? true : undefined,
    ...(onClick && !disabled ? { component: 'button' as const, type: 'button' as const } : {}),
    onClick: disabled ? undefined : onClick,
    // Use native leftSection prop for icon - wrap in container with explicit sizing
    // For selected variants, show checkmark icon; if there's also a leading icon, show both with leading icon at disabled opacity
    leftSection: leftSectionContent,
    // Use native rightSection prop for delete button - CSS will handle styling
    rightSection: deleteIcon,
    className,
    classNames: {
      root: 'recursica-chip-root mantine-Badge-root',
      leftSection: 'recursica-chip-left-section',
      rightSection: 'recursica-chip-right-section',
      ...mantine?.classNames,
    },
    styles: {
      root: {
        // Set CSS custom properties in styles.root to ensure they're applied to the root element
        '--chip-border-size': `var(${borderSizeVar})`,
        // Set icon-text-gap CSS variable on root element so it's available for CSS to read
        '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
        // Border will be set directly via DOM manipulation for real-time updates
        borderStyle: 'solid',
        borderColor: chipBorderVar ? `var(${chipBorderVar})` : undefined,
        // Don't set color inline - let CSS handle it via --chip-color CSS custom property
        ...mantine?.styles?.root,
      },
      leftSection: {
        // Use UIKit variable directly with explicit constraints to prevent expansion
        width: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        height: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        minWidth: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        minHeight: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        maxWidth: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        maxHeight: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        flexBasis: icon ? `var(${iconSizeVar}, 16px)` : undefined,
        flexShrink: 0,
        flexGrow: 0,
        overflow: 'hidden',
        display: icon ? 'inline-flex' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        // For error variant (including error-selected), also set icon color directly to ensure it's applied
        ...((variant === 'error' || variant === 'error-selected') && icon ? {
          color: leadingIconColorVar ? `var(${leadingIconColorVar})` : `var(${chipIconColorVar})`,
        } : {}),
        // Don't set margin-inline-end here - let CSS handle it (same approach as Button)
        ...mantine?.styles?.leftSection,
      },
      ...mantine?.styles,
    },
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': `var(${chipBgVar})`,
      // Use UIKit CSS variable directly for reactive updates - CSS will reference this
      '--chip-color': chipColorVar ? `var(${chipColorVar})` : undefined,
      '--chip-icon-color': chipIconColorVar ? `var(${chipIconColorVar})` : undefined,
      // Set icon size CSS variable for CSS file - needed even when no icon if checkmark is present
      '--chip-icon-size': (icon || showCheckmark) ? `var(${iconSizeVar})` : undefined,
      '--chip-border': `var(${chipBorderVar})`,
      '--chip-close-icon-size': deletable && onDelete ? `var(${closeIconSizeVar}, 16px)` : '0px',
      '--chip-leading-icon-color': leadingIconColorVar ? `var(${leadingIconColorVar})` : (chipIconColorVar ? `var(${chipIconColorVar})` : undefined),
      '--chip-close-icon-color': closeIconColorVar ? `var(${closeIconColorVar})` : (chipIconColorVar ? `var(${chipIconColorVar})` : undefined),
      // Set icon-text-gap CSS variable that references UIKit variable directly (same approach as Button)
      // CSS custom properties are reactive - when UIKit variable on documentElement changes, this updates automatically
      '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--chip-padding-x': `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      '--chip-padding-y': `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-properties-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      '--chip-border-size': `var(${borderSizeVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
      // Apply text styles using CSS variables from text style toolbar
      fontFamily: fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: fontWeightVar ? `var(${fontWeightVar})` : undefined,
      letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
      lineHeight: lineHeightVar ? `var(${lineHeightVar})` : undefined,
      textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') : 'none',
      textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') : 'none',
      fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal',
      borderStyle: 'solid',
      // Use Button's min-width and max-width vars (same as Button component)
      // Don't use fixed height - let padding and content determine height naturally
      minWidth: `var(${minWidthVar})`,
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
      // Set disabled opacity dynamically based on mode (Bug 2 fix)
      ...(disabled && {
        opacity: `var(--recursica-brand-${mode}-state-disabled, 0.5)`,
      }),
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        return elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}
      })(),
      ...style,
    },
    ...mantine,
    ...props,
  } as any
  
  // Use native children prop - CSS will handle icon and delete button styling
  // Use variant as key to force Mantine to re-render when variant changes
  return (
    <Badge 
      key={`chip-${variant}-${layer}`} 
      {...mantineProps}
    >
      {children}
    </Badge>
  )
}

