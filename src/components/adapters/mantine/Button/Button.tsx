/**
 * Mantine Button Implementation
 * 
 * Mantine-specific Button component that uses CSS variables for theming.
 */

import { Button as MantineButton } from '@mantine/core'
import { useState, useEffect, useMemo, Children, isValidElement, cloneElement } from 'react'
import type { ButtonProps as AdapterButtonProps } from '../../Button'
import { getComponentCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
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

  // Use the actual size value as the CSS var prefix.
  // Known sizes ('default', 'small') map to their respective CSS vars;
  // custom size variants (e.g. 'xlarge', 'compact') use their own CSS var path directly.
  const sizePrefix = size


  const cssVarVariant = variant

  // Use recursica_ui-kit.json button colors for standard layers
  const buttonBgVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-background`, layer)
  const buttonColorVar = getComponentCssVar('Button', 'colors', `${cssVarVariant}-text`, layer)

  // Get hover color and opacity from the size variant (moved from component level)
  const hoverColorVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'hover-color')
  const hoverOpacityVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'hover-opacity')
  // Build border color CSS var path directly to ensure it matches recursica_ui-kit.json structure
  const buttonBorderColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'colors', layer, 'border-color')
  const iconColorVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'colors', layer, 'icon-color')

  // Get the correct CSS variable reference for button color (used for text and border)
  const buttonColorRef = `var(${buttonColorVar})`
  // For outline buttons, NEVER use text color as fallback - always use border-color property
  // For solid buttons, fallback to text color is acceptable
  const buttonBorderColorRef = buttonBorderColorVar
    ? `var(${buttonBorderColorVar})`
    : (variant === 'outline' ? undefined : buttonColorRef)

  // For solid and outline buttons, set the border color using the border CSS var
  // Mantine uses --button-bd for border, which has format: calc(0.0625rem * var(--mantine-scale)) solid <color>
  // For outline buttons, ALWAYS use border-color property (never text color fallback)
  // For solid buttons, use border-color if available, otherwise fallback to text color
  // Resolve the border color value for outline buttons to ensure it's always valid
  const buttonBorderColor = variant === 'outline' && buttonBorderColorVar
    ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`)
    : variant === 'solid'
      ? buttonBorderColorRef
      : undefined

  // Get icon size and gap CSS variables — use full path matching JSON structure
  const iconSizeVar = buildComponentCssVarPath('Button', 'variants', 'sizes', sizePrefix, 'properties', 'icon')
  const iconGapVar = buildComponentCssVarPath('Button', 'variants', 'sizes', sizePrefix, 'properties', 'icon-text-gap')
  // Detect icon-only button (icon exists but no children) — needed early for padding var
  const isIconOnly = icon && !children
  // Use content-variant-specific horizontal-padding: label vs icon-only have separate tokens
  const contentVariant = isIconOnly ? 'icon-only' : 'label'
  const horizontalPaddingVar = buildComponentCssVarPath('Button', 'variants', 'content', contentVariant, 'sizes', sizePrefix, 'properties', 'horizontal-padding')
  const heightVar = getComponentCssVar('Button', 'size', `${sizePrefix}-height`, undefined)
  const minWidthVar = getComponentCssVar('Button', 'size', `${sizePrefix}-min-width`, undefined)
  const borderRadiusVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'border-radius')
  const maxWidthVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'max-label-width')

  // Get all text properties from size-variant text property group
  const fontFamilyVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'font-family')
  const fontSizeVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'font-size')
  const fontWeightVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'font-weight')
  const letterSpacingVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'letter-spacing')
  const lineHeightVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'line-height')
  const textDecorationVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'text-decoration')
  const textTransformVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'text-transform')
  const fontStyleVar = buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'text', 'font-style')

  // Get border-size CSS variable (variant-specific property)
  const borderSizeVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'border-size')
  // Reactively read border-size to trigger re-renders when it changes
  const borderSizeValueRaw = useCssVar(borderSizeVar, '1px')

  // Get elevation CSS variable (variant-specific property)
  const elevationVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'elevation')
  // Reactively read elevation to trigger re-renders when it changes
  const elevationValueRaw = useCssVar(elevationVar, 'elevation-0')
  // Use prop override if provided, otherwise use CSS var value
  const resolvedElevation = elevation || elevationValueRaw || 'elevation-0'

  // Get hover-elevation CSS variable (variant-specific property)
  const hoverElevationVar = buildComponentCssVarPath('Button', 'variants', 'styles', cssVarVariant, 'properties', 'hover-elevation')
  const hoverElevationValueRaw = useCssVar(hoverElevationVar, 'elevation-0')
  const resolvedHoverElevation = hoverElevationValueRaw || 'elevation-0'
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
      const updatedVars = detail?.cssVars || []
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
      rightSection: 'recursica-button-right-section',
      ...mantine?.classNames,
    },
    // Use Mantine's native leftSection prop - CSS will handle sizing and spacing
    leftSection: icon && !isIconOnly ? icon : undefined,
    // Support trailing icon via rightSection prop
    rightSection: mantine?.rightSection,
    // Use Mantine's styles prop to override leftSection margin-inline-end and disabled state
    styles: {
      root: {
        // Ensure button root uses flex layout for all buttons with content
        // Center the content group within the button when min-width > content
        ...(children || icon ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } : {}),
        // CRITICAL: Set border color for solid and outline variants to override Mantine's CSS-in-JS
        // Note: CSS file will also set border with !important, but this helps ensure it's applied
        // For outline buttons, ALWAYS set border using border-color property (never text color)
        // Resolve the border color value to ensure it's always valid
        ...(variant === 'outline' && buttonBorderColorVar ? {
          borderColor: readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`,
          border: `${borderSizeValue || '1px'} solid ${readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`}`,
        } : {}),
        // For solid buttons, set border if buttonBorderColor is available
        ...(variant === 'solid' && buttonBorderColor ? {
          borderColor: buttonBorderColor,
          border: `${borderSizeValue || '1px'} solid ${buttonBorderColor}`,
        } : {}),
        // For text variant, use CSS variable-driven border (border-color null = invisible)
        ...(variant === 'text' && {
          borderColor: buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : undefined,
          border: `${borderSizeValue || '1px'} solid ${buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : 'transparent'}`,
        }),
        // Override disabled state to keep colors unchanged, only apply opacity
        // Note: CSS file handles disabled state with !important
        ...(disabled && {
          backgroundColor: `var(${buttonBgVar})`,
          color: buttonColorRef,
          ...((variant === 'solid' || variant === 'outline') && buttonBorderColor && {
            borderColor: buttonBorderColor,
            border: `${borderSizeValue || '1px'} solid ${buttonBorderColor}`,
          }),
          ...(variant === 'text' && {
            borderColor: buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : undefined,
            border: `${borderSizeValue || '1px'} solid ${buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : 'transparent'}`,
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
    style: (() => {
      return {
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
        '--button-hover-opacity': `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
        '--button-hover-color': `var(${hoverColorVar}, #000000)`, // Hover color
        '--button-hover-box-shadow': getElevationBoxShadow(mode, resolvedHoverElevation) || 'none', // Hover elevation
        // Set button color without fallback to Mantine colors
        '--button-color': buttonColorRef,
        // Set button border color CSS variable for CSS file override
        // For outline buttons, ALWAYS set --button-border-color (never fallback to text color)
        // Resolve the value to ensure it's always valid, but prefer var() reference for reactivity
        ...(variant === 'outline' && buttonBorderColorVar ? {
          '--button-border-color': readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`,
        } : {}),
        ...(variant === 'solid' && buttonBorderColorRef ? {
          '--button-border-color': buttonBorderColorRef,
        } : {}),
        // Set icon-text-gap CSS variable for CSS file override
        // Set gap when there's a leading icon or trailing icon (rightSection)
        // Always use var() reference for reactivity - CSS will handle fallback if variable doesn't exist
        '--button-icon-text-gap': (icon && children) || (mantine?.rightSection && children)
          ? `var(${iconGapVar})`
          : '0px',
        // Set icon size CSS variable for CSS file override
        // Always set it when there's a leading icon, trailing icon (rightSection), or icon-only button
        // Always use var() reference for reactivity - CSS will handle fallback if variable doesn't exist
        '--button-icon-size': icon || mantine?.rightSection
          ? `var(${iconSizeVar})`
          : '0px',
        // Set icon color CSS variable for CSS file override
        '--button-icon-color': `var(${iconColorVar})`,
        // Set content max width CSS variable for CSS file override
        '--button-max-width': `var(${maxWidthVar})`,
        // Use actual CSS border instead of box-shadow
        // Mantine uses --button-bd CSS variable for border
        // Note: Border color is set via styles.root to override Mantine's CSS-in-JS
        // For outline buttons, resolve the border color to ensure it's always valid
        ...((variant === 'solid' || variant === 'outline') && buttonBorderColor ? {
          '--button-bd': `${borderSizeValue || '1px'} solid ${variant === 'outline' && buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : buttonBorderColor}`,
        } : {}),
        // For text variant, use border from CSS variables (null border-color = transparent)
        ...(variant === 'text' ? {
          '--button-bd': `${borderSizeValue || '1px'} solid ${buttonBorderColorVar ? (readCssVarResolved(buttonBorderColorVar) || `var(${buttonBorderColorVar})`) : 'transparent'}`,
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
        fontStyle: fontStyleVar ? `var(${fontStyleVar})` as any : 'normal',
        letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
        lineHeight: `var(${lineHeightVar})`,
        textDecoration: textDecorationVar ? `var(${textDecorationVar})` as any : 'none',
        textTransform: textTransformVar ? `var(${textTransformVar})` as any : 'none',
        // For icon-only buttons, ensure flex centering
        ...(isIconOnly && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }),
        // Use component-level disabled-opacity token when disabled - don't change colors, just apply opacity
        ...(disabled && {
          opacity: `var(${buildComponentCssVarPath('Button', 'variants', 'sizes', size, 'properties', 'disabled-opacity')})`,
        }),
        minWidth: `var(${minWidthVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        // Apply elevation if set (variant-specific from CSS var, or prop override)
        // Note: borders are now actual CSS borders, not box-shadow, so only apply elevation shadow
        ...(() => {
          const elevationBoxShadow = getElevationBoxShadow(mode, resolvedElevation)
          if (elevationBoxShadow) {
            return { boxShadow: elevationBoxShadow }
          }
          return {}
        })(),
        // Don't apply maxWidth to root - it will be applied to label element only
        ...style,
      }
    })(),
    ...mantine,
    ...props,
  }

  // Filter out trailing icon from children when rightSection is present to prevent duplicates
  const filteredChildren = useMemo(() => {
    if (isIconOnly) {
      return icon
    }

    // If rightSection is present, filter out elements with recursica-button-trailing-icon class
    if (mantine?.rightSection && children) {
      if (typeof children === 'string') {
        // If children is a string, check if it contains the trailing icon element
        // In this case, children is just "Button", so return as-is
        return children
      }

      // Filter out any child elements with the trailing icon class
      const filterTrailingIcon = (node: any): any => {
        if (!node) return null

        // If it's a React element with the trailing icon class, remove it
        if (isValidElement(node)) {
          const props = node.props as { className?: string; children?: React.ReactNode }
          if (props?.className === 'recursica-button-trailing-icon') {
            return null
          }
          // Recursively filter children
          if (props?.children) {
            const mapped = Children.map(props.children as React.ReactNode, filterTrailingIcon)
            const filtered = mapped ? mapped.filter((item): item is React.ReactElement => item !== null && item !== undefined) : []
            return cloneElement(node, {}, ...filtered)
          }
        }

        return node
      }

      const mapped = children ? Children.map(children as React.ReactNode, filterTrailingIcon) : null
      const filtered = mapped ? mapped.filter((item): item is React.ReactElement => item !== null && item !== undefined) : []
      return filtered.length > 0 ? filtered : (children ?? null)
    }

    return children
  }, [children, mantine?.rightSection, isIconOnly, icon])

  // For icon-only buttons, render icon as children - CSS will handle centering
  return <MantineButton {...mantineProps}>{filteredChildren}</MantineButton>
}

