/**
 * Mantine Chip Implementation
 * 
 * Mantine-specific Chip component that uses CSS variables for theming.
 * Note: Mantine doesn't have a native Chip component, so we use Badge as the base.
 */

import React from 'react'
import { Badge, ActionIcon } from '@mantine/core'
import type { ChipProps as AdapterChipProps } from '../../Chip'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Chip.css'

export default function Chip({
  children,
  variant = 'unselected',
  size = 'default',
  layer = 'layer-0',
  elevation,
  alternativeLayer,
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
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : 'md'
  
  // Check if component has alternative-layer prop set
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let chipBgVar: string
  let chipColorVar: string
  let chipIconColorVar: string
  let chipBorderVar: string
  
  if (hasComponentAlternativeLayer) {
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipIconColorVar = chipColorVar
    chipBorderVar = `var(${layerBase}-border-color)`
  } else if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipIconColorVar = chipColorVar
    chipBorderVar = `var(${layerBase}-border-color)`
  } else {
    // Use UIKit.json chip colors for standard layers
    chipBgVar = getComponentCssVar('Chip', 'color', `${variant}-background`, layer)
    chipBorderVar = getComponentCssVar('Chip', 'color', `${variant}-border`, layer)
    
    // For error variant (including error-selected), use component-level error color CSS variables
    if (variant === 'error' || variant === 'error-selected') {
      chipColorVar = getComponentLevelCssVar('Chip', 'color.error.text-color')
      chipIconColorVar = getComponentLevelCssVar('Chip', 'color.error.icon-color')
    } else {
      chipColorVar = getComponentCssVar('Chip', 'color', `${variant}-text`, layer)
      // Get icon-color if available, otherwise use text color
      const iconColorVar = getComponentCssVar('Chip', 'color', `${variant}-icon-color`, layer)
      chipIconColorVar = iconColorVar || chipColorVar
    }
  }
  
  // Get size CSS variables - Chip size properties are nested by layer, not by size variant
  // UIKit.json structure: chip.size.layer-0.border-radius, chip.size.layer-0.horizontal-padding, etc.
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap
  // Icon is a component-level property (not layer-specific)
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon')
  // icon-text-gap is at component level (not under size) in UIKit.json
  // getComponentCssVar treats it as component-level, which matches toolbar's parseComponentStructure
  const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
  
  const horizontalPaddingVar = getComponentCssVar('Chip', 'size', 'horizontal-padding', layer)
  const verticalPaddingVar = getComponentCssVar('Chip', 'size', 'vertical-padding', layer)
  const borderSizeVar = getComponentCssVar('Chip', 'size', 'border-size', layer)
  const borderRadiusVar = getComponentCssVar('Chip', 'size', 'border-radius', layer)
  
  // Get text styling CSS variables - font-size is at component level (not under size)
  const fontSizeVar = getComponentLevelCssVar('Chip', 'font-size')
  
  // CSS variables in stylesheets ARE reactive - they update automatically when the variable on documentElement changes
  // The border-size is set via CSS custom property in styles.root, which will update reactively
  
  // Use Button's max-width and height vars (same as Button component)
  // Use Chip's own min-width so toolbar can control it
  const sizePrefix = size === 'small' ? 'small' : 'default'
  const minWidthVar = getComponentCssVar('Chip', 'size', 'min-width', undefined) || getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  
  // Handle delete functionality - use ActionIcon in rightSection
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
      }}
    >
      ×
    </ActionIcon>
  ) : undefined
  
  // Merge library-specific props
  const mantineProps = {
    size: mantineSize,
    disabled,
    'data-disabled': disabled ? true : undefined,
    onClick: disabled ? undefined : onClick,
    // Use native leftSection prop for icon - wrap in container with explicit sizing
    // Ensure icon is always passed when provided
    leftSection: icon ? (() => {
      // Wrap icon in a span with explicit size constraints and class for CSS targeting
      return (
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
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}>
          {icon}
        </span>
      )
    })() : undefined,
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
        // For error variant (including error-selected), also set color directly to ensure it's applied
        ...((variant === 'error' || variant === 'error-selected') ? {
          color: `var(${chipColorVar})`,
        } : {}),
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
          color: `var(${chipIconColorVar})`,
        } : {}),
        // Don't set margin-inline-end here - let CSS handle it (same approach as Button)
        ...mantine?.styles?.leftSection,
      },
      ...mantine?.styles,
    },
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': isAlternativeLayer ? chipBgVar : `var(${chipBgVar})`,
      // For error variant (including error-selected), use chip error color CSS variable directly
      '--chip-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipColorVar})` : (isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`),
      '--chip-icon-color': (variant === 'error' || variant === 'error-selected') ? `var(${chipIconColorVar})` : (isAlternativeLayer ? chipIconColorVar : `var(${chipIconColorVar})`),
      '--chip-border': isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      // Set icon size CSS variable - use UIKit variable directly with fallback
      '--chip-icon-size': icon ? `var(${iconSizeVar}, 16px)` : '0px',
      // Set icon-text-gap CSS variable that references UIKit variable directly (same approach as Button)
      // CSS custom properties are reactive - when UIKit variable on documentElement changes, this updates automatically
      '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--chip-padding-x': `var(${horizontalPaddingVar}, var(--recursica-ui-kit-components-chip-horizontal-padding, var(--recursica-brand-dimensions-general-default, 8px)))`,
      '--chip-padding-y': `var(${verticalPaddingVar}, var(--recursica-ui-kit-components-chip-vertical-padding, var(--recursica-brand-dimensions-general-sm, 4px)))`,
      '--chip-border-size': `var(${borderSizeVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
      '--chip-font-size': fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      textTransform: 'none',
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
      ...(elevation && elevation !== 'elevation-0' ? (() => {
        const elevationMatch = elevation.match(/elevation-(\d+)/)
        if (elevationMatch) {
          const elevationLevel = elevationMatch[1]
          return {
            boxShadow: `var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-${mode}-elevations-elevation-${elevationLevel}-shadow-color, rgba(0, 0, 0, 0))`
          }
        }
        return {}
      })() : {}),
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  // Use native children prop - CSS will handle icon and delete button styling
  return <Badge {...mantineProps}>{children}</Badge>
}

