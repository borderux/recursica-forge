/**
 * Material UI Button Implementation
 * 
 * Material UI-specific Button component that uses CSS variables for theming.
 */

import { Button as MaterialButton } from '@mui/material'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { useState, useEffect } from 'react'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { useCssVar } from '../../../hooks/useCssVar'
import { getBrandStateCssVar, getElevationBoxShadow } from '../../../utils/brandCssVars'
import './Button.css'

export default function Button({
  children,
  variant = 'solid',
  size = 'default',
  layer = 'layer-0',
  elevation,
  disabled,
  onClick,
  type,
  className,
  style,
  icon,
  material,
  ...props
}: AdapterButtonProps) {
  const { mode } = useThemeMode()
  
  // Map unified variant to Material variant
  const materialVariant = variant === 'solid' ? 'contained' : variant === 'outline' ? 'outlined' : 'text'
  
  // Map unified size to Material size
  const materialSize = size === 'small' ? 'small' : 'medium'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  const cssVarVariant = variant
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'colors', layer, 'border')
  
  // Get hover opacity and overlay color from brand theme (not user-configurable)
  const hoverOpacityVar = getBrandStateCssVar(mode, 'hover')
  const overlayColorVar = getBrandStateCssVar(mode, 'overlay.color')
  
  // Get hover opacity and overlay color from brand theme (not user-configurable)
  const hoverOpacityVar = getBrandStateCssVar(mode, 'hover')
  const overlayColorVar = getBrandStateCssVar(mode, 'overlay.color')
  
  // Get icon size and gap CSS variables
  const iconSizeVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon`, undefined)
  const iconGapVar = getComponentCssVar('Button', 'size', `${sizePrefix}-icon-text-gap`, undefined)
  const horizontalPaddingVar = getComponentCssVar('Button', 'size', `${sizePrefix}-horizontal-padding`, undefined)
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const maxWidthVar = getComponentCssVar('Button', 'size', 'max-width', undefined)
  
  // Get all text properties from component text property group
  const fontFamilyVar = getComponentTextCssVar('Button', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Button', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Button', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Button', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Button', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Button', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Button', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Button', 'text', 'font-style')
  
  // Get border-size CSS variable (variant-specific property)
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  const borderSizeValueRaw = useCssVar(borderSizeVar, '1px')
  // Resolve the border-size value to get actual pixel value (handles var() references)
  const [borderSizeValue, setBorderSizeValue] = useState(() => {
    const resolved = readCssVarResolved(borderSizeVar, 10, '1px')
    if (resolved) {
      const match = resolved.match(/^(-?\d+(?:\.\d+)?)px$/i)
      if (match) return `${match[1]}px`
      return resolved
    }
    return borderSizeValueRaw || '1px'
  })
  
  useEffect(() => {
    const updateBorderSize = () => {
      const resolved = readCssVarResolved(borderSizeVar, 10, '1px')
      if (resolved) {
        const match = resolved.match(/^(-?\d+(?:\.\d+)?)px$/i)
        if (match) {
          setBorderSizeValue(`${match[1]}px`)
          return
        }
        setBorderSizeValue(resolved)
        return
      }
      setBorderSizeValue(borderSizeValueRaw || '1px')
    }
    
    updateBorderSize()
    
    // Listen for CSS variable updates
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(borderSizeVar)) {
        updateBorderSize()
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes
    const observer = new MutationObserver(() => {
      updateBorderSize()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [borderSizeVar, borderSizeValueRaw])
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdateText) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
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
  }, [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar])
  
  // Detect icon-only button (icon exists but no children)
  const isIconOnly = icon && !children
  
  // Merge library-specific props
  const materialProps = {
    variant: materialVariant as 'contained' | 'outlined' | 'text',
    size: materialSize as 'small' | 'medium' | 'large',
    disabled,
    onClick,
    type,
    className,
    // Use Material's native startIcon prop - CSS will handle sizing and spacing
    startIcon: icon && !isIconOnly ? icon : undefined,
    sx: {
      // Use CSS variables for theming
      // Read the actual background color value - if it's transparent, set it directly to override library defaults
      ...(() => {
        const bgColorValue = readCssVar(buttonBgVar)
        return {
          backgroundColor: bgColorValue === 'transparent' ? 'transparent' : `var(${buttonBgVar})`,
          '--button-bg': bgColorValue === 'transparent' ? 'transparent' : `var(${buttonBgVar})`
        }
      })(),
      color: `var(${buttonColorVar})`,
      // Set button border color CSS variable for CSS file override
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColorVar ? {
        '--button-border-color': `var(${buttonBorderColorVar})`,
      } : {}),
      '--button-hover-opacity': `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
      '--button-overlay-color': `var(${overlayColorVar}, #000000)`, // Overlay color
      // Use actual CSS border instead of box-shadow
      ...(variant === 'solid' || variant === 'outline' ? {
        border: `${borderSizeValue || '1px'} solid var(${buttonBorderColorVar || buttonColorVar})`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        border: 'none',
      } : {}),
      fontFamily: `var(${fontFamilyVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${fontWeightVar})`,
      fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal',
      letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
      lineHeight: `var(${lineHeightVar})`,
      textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') as any : 'none',
      textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') as any : 'none',
      height: `var(${heightVar})`,
      minWidth: `var(${minWidthVar})`,
      paddingLeft: `var(${horizontalPaddingVar})`,
      paddingRight: `var(${horizontalPaddingVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Ensure flex layout for truncation to work with icons
      display: 'flex',
      alignItems: 'center',
      // For icon-only buttons, ensure flex centering
      ...(isIconOnly && {
        justifyContent: 'center',
      }),
      // Set CSS custom properties for CSS file overrides
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      '--button-max-width': `var(${maxWidthVar})`,
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      // Override Material UI's default disabled styles to keep colors unchanged
      ...(disabled && {
        opacity: `var(${getBrandStateCssVar(mode, 'disabled')})`,
        backgroundColor: `var(${buttonBgVar}) !important`,
        color: `var(${buttonColorVar}) !important`,
        ...((variant === 'solid' || variant === 'outline') && {
          border: `${borderSizeValue || '1px'} solid var(${buttonBorderColorVar || buttonColorVar}) !important`,
        }),
        ...(variant === 'text' && {
          border: 'none !important',
        }),
      }),
      // Apply elevation if set
      // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        if (elevationBoxShadow) {
          return { boxShadow: elevationBoxShadow }
        }
        return {}
      })(),
      ...style,
      ...material?.sx,
    },
    ...material,
    ...props,
  }
  
  // Use native children prop - CSS will handle truncation
  return <MaterialButton {...materialProps}>{isIconOnly ? icon : children}</MaterialButton>
}

