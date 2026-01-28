/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
import { useState, useEffect } from 'react'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getBrandStateCssVar, getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { useCssVar } from '../../../hooks/useCssVar'
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
  mantine,
  ...props
}: AdapterButtonProps) {
  const { mode } = useThemeMode()
  
  // Map unified variant to Mantine variant
  const mantineVariant = variant === 'solid' ? 'filled' : variant === 'outline' ? 'outline' : 'subtle'
  
  // Map unified size to Mantine size
  const mantineSize = size === 'small' ? 'xs' : size === 'default' ? 'md' : 'lg'
  
  // Determine size prefix for CSS variables
  const sizePrefix = size === 'small' ? 'small' : 'default'
  
  const cssVarVariant = variant
  
  // Use UIKit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-background`, layer)
  const buttonHoverVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-background-hover`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-text`, layer)
  // Build border color CSS var path directly to ensure it matches UIKit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'colors', layer, 'border')
  
  // Get the correct CSS variable reference for button color (used for text and border)
  const buttonColorRef = `var(${buttonColorVar})`
  const buttonBorderColorRef = buttonBorderColorVar ? `var(${buttonBorderColorVar})` : buttonColorRef
  
  // For solid and outline buttons, set the border color using the border CSS var
  // Mantine uses --button-bd for border, which has format: calc(0.0625rem * var(--mantine-scale)) solid <color>
  const buttonBorderColor = (variant === 'solid' || variant === 'outline')
    ? buttonBorderColorRef 
    : undefined
  
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
  const borderSizeValue = useCssVar(borderSizeVar, '1px')
  
  // Reactively read background color to trigger re-renders when CSS variables change
  // This ensures --button-bg gets updated when toolbar changes CSS variables
  const bgColorValue = useCssVar(buttonBgVar, '')
  
  // Reactively read height to trigger re-renders when CSS variables change
  // This ensures --button-height gets updated when toolbar changes CSS variables
  useCssVar(heightVar, '')
  
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
  const mantineProps = {
    variant: mantineVariant,
    size: mantineSize,
    disabled,
    onClick,
    type,
    className,
    // Add custom class names for CSS targeting
    classNames: {
      leftSection: 'recursica-button-left-section',
      ...mantine?.classNames,
    },
    // Use Mantine's native leftSection prop - CSS will handle sizing and spacing
    leftSection: icon && !isIconOnly ? icon : undefined,
    // Use Mantine's styles prop to override leftSection margin-inline-end and disabled state
    styles: {
      root: {
        // Ensure button root uses flex layout for all buttons with content
        // Use space-around to center content when button is wider than content
        ...(children || icon ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        } : {}),
        // Override disabled state to keep colors unchanged, only apply opacity
        ...(disabled && {
          backgroundColor: `var(${buttonBgVar}) !important`,
          color: `${buttonColorRef} !important`,
          ...((variant === 'solid' || variant === 'outline') && buttonBorderColor && {
            borderColor: `${buttonBorderColor} !important`,
          }),
          ...(variant === 'text' && {
            border: 'none !important',
          }),
        }),
      },
      leftSection: icon && children ? {
        // CSS file handles marginInlineEnd override
        flexShrink: 0, // Prevent icon from shrinking when content is truncated
      } : undefined,
      label: children ? {
        // CSS file handles truncation styles - only set line-height here for vertical centering
        lineHeight: `var(${heightVar})`, // Match button height for vertical centering
      } : undefined,
      ...mantine?.styles,
    },
    style: {
      // Use CSS variables for theming
      // getComponentCssVar returns CSS variable names, so wrap in var() for standard layers
      // If background is transparent, set it directly to override library defaults
      // Otherwise, use CSS variable reference which will cascade automatically
      ...(bgColorValue === 'transparent' ? {
        backgroundColor: 'transparent',
        '--button-bg': 'transparent'
      } : {
        '--button-bg': `var(${buttonBgVar})`
      }),
      '--button-hover': `var(${buttonHoverVar})`,
      // Set button color without fallback to Mantine colors
      '--button-color': buttonColorRef,
      // Set button border color CSS variable for CSS file override
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColorRef ? {
        '--button-border-color': buttonBorderColorRef,
      } : {}),
      // Set icon-text-gap CSS variable for CSS file override
      '--button-icon-text-gap': icon && children ? `var(${iconGapVar})` : '0px',
      // Set icon size CSS variable for CSS file override
      // Always set it, even for icon-only buttons, so CSS can use it
      '--button-icon-size': icon ? `var(${iconSizeVar})` : '0px',
      // Set content max width CSS variable for CSS file override
      '--button-max-width': `var(${maxWidthVar})`,
      // Use actual CSS border instead of box-shadow
      // Mantine uses --button-bd CSS variable for border
      ...((variant === 'solid' || variant === 'outline') && buttonBorderColor ? {
        '--button-bd': `${borderSizeValue || '1px'} solid ${buttonBorderColor}`,
      } : {}),
      // For text variant, explicitly remove border
      ...(variant === 'text' ? {
        '--button-bd': 'none',
      } : {}),
      '--button-height': `var(${heightVar})`,
      '--button-min-width': `var(${minWidthVar})`,
      '--button-padding': `var(${horizontalPaddingVar})`,
      '--button-padding-x': `var(${horizontalPaddingVar})`,
      '--button-border-radius': `var(${borderRadiusVar})`,
      '--button-font-family': `var(${fontFamilyVar})`,
      '--button-font-size': `var(${fontSizeVar})`,
      '--button-fz': `var(${fontSizeVar})`,
      '--button-font-weight': `var(${fontWeightVar})`,
      '--button-letter-spacing': `var(${letterSpacingVar})`,
      '--button-line-height': `var(${lineHeightVar})`,
      // Directly set color to override Mantine's fallback (var(--button-color, var(--mantine-color-white)))
      color: buttonColorRef,
      fontFamily: `var(${fontFamilyVar})`,
      fontSize: `var(${fontSizeVar})`,
      fontWeight: `var(${fontWeightVar})`,
      fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal',
      letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
      lineHeight: `var(${lineHeightVar})`,
      textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') as any : 'none',
      textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') as any : 'none',
      // For icon-only buttons, ensure flex centering with space-around
      ...(isIconOnly && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }),
      // Use brand disabled opacity when disabled - don't change colors, just apply opacity
      ...(disabled && {
        opacity: `var(${getBrandStateCssVar(mode, 'disabled')})`,
      }),
      minWidth: `var(${minWidthVar})`,
      borderRadius: `var(${borderRadiusVar})`,
      // Apply elevation if set
      // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
      ...(() => {
        const elevationBoxShadow = getElevationBoxShadow(mode, elevation)
        if (elevationBoxShadow) {
          return { boxShadow: elevationBoxShadow }
        }
        return {}
      })(),
      // Don't apply maxWidth to root - it will be applied to label element only
      ...style,
    },
    ...mantine,
    ...props,
  }
  
  // For icon-only buttons, render icon as children - CSS will handle centering
  return <MantineButton {...mantineProps}>{isIconOnly ? icon : children}</MantineButton>
}

