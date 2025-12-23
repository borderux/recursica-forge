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
  console.log('🔵 Chip component RENDERING', { variant, size, layer, hasIcon: !!icon })
  const { mode } = useThemeMode()
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : 'md'
  
  // Check if component has alternative-layer prop set
  const hasComponentAlternativeLayer = alternativeLayer && alternativeLayer !== 'none'
  const isAlternativeLayer = layer.startsWith('layer-alternative-') || hasComponentAlternativeLayer
  
  let chipBgVar: string
  let chipColorVar: string
  let chipBorderVar: string
  
  if (hasComponentAlternativeLayer) {
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${alternativeLayer}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipBorderVar = `var(${layerBase}-border-color)`
  } else if (isAlternativeLayer) {
    const altKey = layer.replace('layer-alternative-', '')
    const layerBase = `--recursica-brand-${mode}-layer-layer-alternative-${altKey}-property`
    chipBgVar = `var(${layerBase}-surface)`
    chipColorVar = `var(${layerBase}-element-interactive-on-tone)`
    chipBorderVar = `var(${layerBase}-border-color)`
  } else {
    // Use UIKit.json chip colors for standard layers
    chipBgVar = getComponentCssVar('Chip', 'color', `${variant}-background`, layer)
    chipColorVar = getComponentCssVar('Chip', 'color', `${variant}-text`, layer)
    chipBorderVar = getComponentCssVar('Chip', 'color', `${variant}-border`, layer)
  }
  
  // Get size CSS variables - Chip size properties are nested by layer, not by size variant
  // UIKit.json structure: chip.size.layer-0.border-radius, chip.size.layer-0.horizontal-padding, etc.
  // Properties that exist: border-size, border-radius, horizontal-padding, vertical-padding, icon-text-gap
  // Icon is a component-level property (not layer-specific)
  const iconSizeVar = getComponentLevelCssVar('Chip', 'icon')
  // icon-text-gap is at component level (not under size) in UIKit.json
  // getComponentCssVar treats it as component-level, which matches toolbar's parseComponentStructure
  const iconGapVar = getComponentLevelCssVar('Chip', 'icon-text-gap')
  
  // Debug icon size variable
  if (icon) {
    console.log('🔵 Chip icon vars:', { iconSizeVar, iconGapVar, icon })
  }
  const horizontalPaddingVar = getComponentCssVar('Chip', 'size', 'horizontal-padding', layer)
  const verticalPaddingVar = getComponentCssVar('Chip', 'size', 'vertical-padding', layer)
  const borderSizeVar = getComponentCssVar('Chip', 'size', 'border-size', layer)
  const borderRadiusVar = getComponentCssVar('Chip', 'size', 'border-radius', layer)
  
  // Get text styling CSS variables - font-size is at component level (not under size)
  const fontSizeVar = getComponentLevelCssVar('Chip', 'font-size')
  
  // CSS variables in stylesheets ARE reactive - they update automatically when the variable on documentElement changes
  // However, we also set it directly on elements as a fallback and to ensure immediate updates
  React.useEffect(() => {
    if (!borderSizeVar) return
    
    let lastBorderWidth = ''
    const updateAllChipBorders = () => {
      try {
        const root = document.documentElement
        // Read CSS variable value from root
        const borderWidth = root.style.getPropertyValue(borderSizeVar).trim() || 
                           getComputedStyle(root).getPropertyValue(borderSizeVar).trim() || 
                           '1px'
        
        // Only update if value changed
        if (borderWidth === lastBorderWidth) return
        lastBorderWidth = borderWidth
        
        // Find ALL chip elements using multiple selectors
        const allChips = new Set<HTMLElement>()
        const selectors = [
          '.recursica-chip-root',
          '.mantine-Badge-root',
          '[class*="Badge-root"]',
          '[class*="chip-root"]',
          // Also try to find by text content as fallback
          ...(children && typeof children === 'string' ? [`*:has-text("${children}")`] : [])
        ]
        
        selectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => {
              allChips.add(el as HTMLElement)
            })
          } catch (e) {
            // Silently handle selector errors
          }
        })
        
        // If no chips found, try finding elements that look like chips
        if (allChips.size === 0) {
          // Find all elements with inline-flex display (common for chips/badges)
          document.querySelectorAll('*').forEach(el => {
            const computed = getComputedStyle(el)
            if (computed.display === 'inline-flex' && 
                computed.alignItems === 'center' &&
                el.textContent && 
                el.textContent.trim().length > 0 &&
                el.textContent.trim().length < 50) {
              allChips.add(el as HTMLElement)
            }
          })
        }
        
        // Update each chip element - set CSS variable AND border directly
        allChips.forEach((element) => {
          try {
            // Set the CSS variable on the element itself
            element.style.setProperty(borderSizeVar, borderWidth)
            // ALSO set border directly as fallback - inline styles have highest specificity
            element.style.borderWidth = borderWidth
            element.style.borderStyle = 'solid'
          } catch (e) {
            // Silently handle update errors
          }
        })
      } catch (e) {
        // Silently handle errors
      }
    }
    
    // Initial update
    updateAllChipBorders()
    const initialTimeout = setTimeout(updateAllChipBorders, 50)
    
    // Watch for CSS variable changes on documentElement
    const observer = new MutationObserver(() => {
      updateAllChipBorders()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    // Listen for custom event
    const handleVarChange = (event?: CustomEvent) => {
      if (!event?.detail?.cssVarName || event.detail.cssVarName === borderSizeVar) {
        updateAllChipBorders()
      }
    }
    window.addEventListener('cssvarchange', handleVarChange as EventListener)
    
    // Polling fallback - every 100ms
    const pollInterval = setInterval(updateAllChipBorders, 100)
    
    return () => {
      clearTimeout(initialTimeout)
      observer.disconnect()
      window.removeEventListener('cssvarchange', handleVarChange as EventListener)
      clearInterval(pollInterval)
    }
  }, [borderSizeVar])
  
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
      console.log('🔵 Chip: Passing icon to leftSection:', icon)
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
        // Don't set margin-inline-end here - let CSS handle it (same approach as Button)
        ...mantine?.styles?.leftSection,
      },
      ...mantine?.styles,
    },
    style: {
      // Set CSS custom properties for CSS file
      '--chip-bg': isAlternativeLayer ? chipBgVar : `var(${chipBgVar})`,
      '--chip-color': isAlternativeLayer ? chipColorVar : `var(${chipColorVar})`,
      '--chip-border': isAlternativeLayer ? chipBorderVar : `var(${chipBorderVar})`,
      // Set icon size CSS variable - use UIKit variable directly with fallback
      '--chip-icon-size': icon ? `var(${iconSizeVar}, 16px)` : '0px',
      // Set icon-text-gap CSS variable that references UIKit variable directly (same approach as Button)
      // CSS custom properties are reactive - when UIKit variable on documentElement changes, this updates automatically
      '--chip-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--chip-padding-x': `var(${horizontalPaddingVar})`,
      '--chip-padding-y': `var(${verticalPaddingVar})`,
      '--chip-border-size': `var(${borderSizeVar})`,
      '--chip-border-radius': `var(${borderRadiusVar})`,
      '--chip-font-size': fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
      fontWeight: 'var(--recursica-brand-typography-button-font-weight)',
      textTransform: 'none',
      borderStyle: 'solid',
      // Use Button's min-width, max-width, and height vars (same as Button component)
      minWidth: `var(${minWidthVar})`,
      height: `var(${heightVar})`,
      '--chip-min-width': `var(${minWidthVar})`,
      '--chip-max-width': `var(${maxWidthVar})`,
      '--chip-height': `var(${heightVar})`,
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

