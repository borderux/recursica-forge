/**
 * Mantine Badge Implementation
 * 
 * Mantine-specific Badge component that uses CSS variables for theming.
 */

import { useState, useEffect } from 'react'
import { Badge as MantineBadge } from '@mantine/core'
import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { getElevationBoxShadow, parseElevationValue } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { useCssVar } from '../../../hooks/useCssVar'
import './Badge.css'

export default function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
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

  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(elevationVar)) {
        const value = readCssVar(elevationVar)
        setElevationFromVar(value ? parseElevationValue(value) : undefined)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    const observer = new MutationObserver(() => {
      const value = readCssVar(elevationVar)
      setElevationFromVar(value ? parseElevationValue(value) : undefined)
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

  // Reactively read background and text colors to trigger re-renders when CSS variables are initialized
  // This ensures the badge renders correctly on first load
  useCssVar(bgVar, '')
  useCssVar(textVar, '')

  // Determine elevation to apply - prioritize prop, then CSS variable
  const componentElevation = elevation ?? elevationFromVar
  const elevationBoxShadow = getElevationBoxShadow(mode, componentElevation)

  return (
    <MantineBadge
      className={`mantine-badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and text styles
        // The CSS file will use these to style the badge
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
        // Set height to auto to override Mantine Badge's default height
        height: 'auto',
        // Apply elevation box-shadow if set
        ...(elevationBoxShadow ? { boxShadow: elevationBoxShadow } : {}),
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {children}
    </MantineBadge>
  )
}

