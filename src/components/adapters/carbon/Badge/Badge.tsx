/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

import { useState, useEffect } from 'react'
import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './Badge.css'

export default function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  elevation,
  className,
  style,
  carbon,
  ...props
}: AdapterBadgeProps) {
  const { mode } = useThemeMode()

  // Get CSS variables
  const bgVar = getComponentCssVar('Badge', 'colors', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Badge', 'colors', `${variant}-text`, layer)
  const borderColorVar = getComponentCssVar('Badge', 'colors', `${variant}-border-color`, layer)

  // Get text CSS variables
  const fontFamilyVar = getComponentTextCssVar('Badge', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Badge', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Badge', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Badge', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Badge', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Badge', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Badge', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Badge', 'text', 'font-style')

  // Get level CSS variables (border-radius, border-size, padding)
  const borderRadiusVar = getComponentLevelCssVar('Badge', 'border-radius')
  const borderSizeVar = getComponentLevelCssVar('Badge', 'border-size')
  const paddingVerticalVar = getComponentLevelCssVar('Badge', 'padding-vertical')
  const paddingHorizontalVar = getComponentLevelCssVar('Badge', 'padding-horizontal')

  // Reactively read elevation from CSS variable
  const elevationVar = getComponentLevelCssVar('Badge', 'elevation')
  const [elevationFromVar, setElevationFromVar] = useState<string | undefined>(() => {
    const value = readCssVar(elevationVar)
    return value ? parseElevationValue(value) : undefined
  })

  // Force re-render when CSS vars change
  const [, setUpdateKey] = useState(0)

  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
      setUpdateKey(prev => prev + 1)
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
      setUpdateKey(prev => prev + 1)
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

  // Determine elevation to apply - prioritize prop, then CSS variable
  const componentElevation = elevation ?? elevationFromVar
  const elevationBoxShadow = getElevationBoxShadow(mode, componentElevation)

  return (
    <span
      className={`cds--badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and text styles
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        '--badge-font-family': `var(${fontFamilyVar})`,
        '--badge-font-size': `var(${fontSizeVar})`,
        '--badge-font-weight': `var(${fontWeightVar})`,
        '--badge-letter-spacing': `var(${letterSpacingVar})`,
        '--badge-line-height': `var(${lineHeightVar})`,
        '--badge-text-decoration': `var(${textDecorationVar})`,
        '--badge-text-transform': `var(${textTransformVar})`,
        '--badge-font-style': `var(${fontStyleVar})`,
        '--badge-border-radius': `var(${borderRadiusVar})`,
        '--badge-border-size': `var(${borderSizeVar})`,
        '--badge-border-color': `var(${borderColorVar})`,
        '--badge-padding-vertical': `var(${paddingVerticalVar})`,
        '--badge-padding-horizontal': `var(${paddingHorizontalVar})`,

        // Direct CSS property application to prevent styling loss during navigation
        backgroundColor: `var(${bgVar})`,
        color: `var(${textVar})`,
        fontFamily: `var(${fontFamilyVar})`,
        fontSize: `var(${fontSizeVar})`,
        fontWeight: `var(${fontWeightVar})`,
        letterSpacing: `var(${letterSpacingVar})`,
        lineHeight: `var(${lineHeightVar})`,
        textDecoration: `var(${textDecorationVar})`,
        textTransform: `var(${textTransformVar})`,
        fontStyle: `var(${fontStyleVar})`,
        padding: `var(${paddingVerticalVar}) var(${paddingHorizontalVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        borderWidth: `var(${borderSizeVar})`,
        borderStyle: 'solid',
        borderColor: `var(${borderColorVar})`,

        // Set height to auto to ensure min-height controls the height
        height: 'auto',
        minHeight: '20px',
        // Only set non-CSS-variable styles here (like display)
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Apply elevation box-shadow if set
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...carbon}
      {...props}
    >
      {children}
    </span>
  )
}

