/**
 * Link Component Adapter
 * 
 * Unified Link component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { getBrandStateCssVar } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import { useCssVar } from '../hooks/useCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

import { iconNameToReactComponent } from '../../modules/components/iconUtils'

export type LinkProps = {
  children?: React.ReactNode
  href?: string
  target?: string
  rel?: string
  layer?: ComponentLayer
  underline?: 'hover' | 'always' | 'none'
  onClick?: (e: React.MouseEvent) => void
  className?: string
  inlineStyle?: React.CSSProperties
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  title?: string
  showIcon?: boolean
  iconPosition?: 'start' | 'end'
  /** Force a specific visual state for preview (bypasses CSS pseudo-states) */
  forceState?: 'default' | 'hover' | 'visited' | 'visited-hover'
} & LibrarySpecificProps

export function Link({
  children,
  href,
  target,
  rel,
  layer = 'layer-0',
  underline,
  onClick,
  className,
  inlineStyle,
  startIcon,
  endIcon,
  title,
  showIcon,
  iconPosition,
  forceState,
  mantine,
  material,
  carbon,
}: LinkProps) {
  const Component = useComponent('Link')
  const { mode } = useThemeMode()

  // Get theme-agnostic CSS variables for logical icon settings
  const componentKebab = 'link'
  const showIconVar = `--recursica-ui-kit-components-${componentKebab}-properties-show-icon`
  const iconNameVar = `--recursica-ui-kit-components-${componentKebab}-properties-icon-name`
  const iconPositionVar = `--recursica-ui-kit-components-${componentKebab}-properties-icon-position`

  // Read current values from CSS variables
  // We use direct readCssVar for immediate updates after events, 
  // and useCssVar to ensure we have reactive state.
  const iconPositionFromVar = useCssVar(iconPositionVar, 'end')
  const iconNameFromVar = useCssVar(iconNameVar, 'arrow-right')
  const showIconFromVar = useCssVar(showIconVar, 'false')

  // Prioritize direct read to avoid race conditions with hook state updates
  const freshIconPosition = readCssVar(iconPositionVar)
  const freshIconName = readCssVar(iconNameVar)
  const freshShowIcon = readCssVar(showIconVar)

  // Determine effective values with explicit normalization
  const normalizedShowIcon = (freshShowIcon || showIconFromVar || 'false').trim().toLowerCase()
  const effectiveShowIcon = showIcon !== undefined ? showIcon : (normalizedShowIcon === 'true')

  const normalizedPosition = (freshIconPosition || iconPositionFromVar || 'end').trim().toLowerCase()
  const effectiveIconPosition = iconPosition !== undefined ? iconPosition : (normalizedPosition === 'start' ? 'start' : 'end')

  const effectiveIconName = (freshIconName || iconNameFromVar || 'arrow-right').trim()

  // Resolve icon component
  const IconComponent = iconNameToReactComponent(effectiveIconName)

  let renderedStartIcon = startIcon
  let renderedEndIcon = endIcon

  // Only apply toolbar-controlled icon logic when no icons were explicitly passed as props
  const hasExplicitIcons = startIcon !== undefined || endIcon !== undefined

  if (hasExplicitIcons) {
    // Keep the explicitly passed icons as-is
  } else if (effectiveShowIcon === true) {
    // Determine which icon we are working with from toolbar settings
    const toolbarIcon = IconComponent ? <IconComponent /> : null

    if (effectiveIconPosition === 'start') {
      renderedStartIcon = toolbarIcon
      renderedEndIcon = undefined
    } else {
      renderedEndIcon = toolbarIcon
      renderedStartIcon = undefined
    }
  }

  // State to force re-renders when text CSS variables change
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Shared text CSS variables (component level)
    const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
    const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')

    // State-variant text CSS variables (per-state)
    const defaultFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-weight')
    const defaultTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-decoration')
    const defaultTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-transform')
    const defaultFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-style')
    const hoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-weight')
    const hoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-decoration')
    const hoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-transform')
    const hoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-style')

    // State-variant text CSS variables (visited state)
    const visitedFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'font-weight')
    const visitedTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'text-decoration')
    const visitedTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'text-transform')
    const visitedFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'text', 'font-style')
    const visitedTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited', 'properties', 'colors', layer, 'text')

    // State-variant text CSS variables (visited-hover state)
    const visitedHoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-weight')
    const visitedHoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-decoration')
    const visitedHoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'text-transform')
    const visitedHoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'text', 'font-style')
    const visitedHoverTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'colors', layer, 'text')
    const visitedHoverIconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'visited-hover', 'properties', 'colors', layer, 'icon')

    // Calculate dynamic vars - use 'default' state for base color
    const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'text')
    const textHoverVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', layer, 'text')
    const iconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'icon')
    const iconGapVar = buildComponentCssVarPath('Link', 'properties', 'icon-text-gap')

    const textCssVars = [
      fontFamilyVar, fontSizeVar, letterSpacingVar, lineHeightVar,
      defaultFontWeightVar, defaultTextDecorationVar, defaultTextTransformVar, defaultFontStyleVar,
      hoverFontWeightVar, hoverTextDecorationVar, hoverTextTransformVar, hoverFontStyleVar,
      visitedFontWeightVar, visitedTextDecorationVar, visitedTextTransformVar, visitedFontStyleVar, visitedTextColorVar,
      visitedHoverFontWeightVar, visitedHoverTextDecorationVar, visitedHoverTextTransformVar, visitedHoverFontStyleVar, visitedHoverTextColorVar, visitedHoverIconColorVar,
      textVar, textHoverVar, iconColorVar, iconGapVar, showIconVar, iconPositionVar, iconNameVar
    ]

    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if any text CSS var was updated
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
  }, [layer, showIconVar, iconPositionVar, iconNameVar])

  if (!Component) {
    // Fallback to native anchor if component not available
    const iconGapVar = buildComponentCssVarPath('Link', 'properties', 'icon-text-gap')
    const iconColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'icon')

    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={className}
        title={title}
        style={{
          ...getLinkStyles(layer, underline, mode),
          display: 'inline-flex',
          alignItems: 'center',
          gap: renderedStartIcon || renderedEndIcon ? `var(${iconGapVar})` : 0,
          cursor: 'pointer',
          ...inlineStyle,
        }}
      >
        {renderedStartIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', color: `var(${iconColorVar})` }}>
            {renderedStartIcon}
          </span>
        )}
        {children}
        {renderedEndIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', color: `var(${iconColorVar})` }}>
            {renderedEndIcon}
          </span>
        )}
      </a>
    )
  }

  // Map unified props to library-specific props
  const libraryProps = mapLinkProps({
    href,
    target,
    rel,
    layer,
    underline,
    onClick,
    className,
    inlineStyle,
    startIcon: renderedStartIcon,
    endIcon: renderedEndIcon,
    title,
    showIcon,
    iconPosition,
    forceState,
    mantine,
    material,
    carbon,
  })

  return (
    <Suspense fallback={<a href={href}>Loading...</a>}>
      <Component
        key={`${effectiveShowIcon}-${effectiveIconPosition}-${effectiveIconName}-${textVarsUpdate}`}
        {...libraryProps}
      >
        {children}
      </Component>
    </Suspense>
  )
}

function getLinkStyles(
  layer: ComponentLayer,
  underline: 'hover' | 'always' | 'none' | undefined,
  mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
  const styles: React.CSSProperties = {}

  // Use UIKit.json link colors from state variants
  const textVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', layer, 'text')

  // Shared text properties (component level)
  const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
  const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')

  // State-dependent text properties (default state)
  const fontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-weight')
  const textDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-decoration')
  const textTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-transform')
  const fontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-style')

  // Apply styles using CSS variable references directly
  styles.color = `var(${textVar})`
  styles.fontWeight = `var(${fontWeightVar})`
  styles.fontStyle = fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal'

  const textDecorationValue = textDecorationVar ? (readCssVar(textDecorationVar) || 'underline') : 'underline'

  if (underline === 'always') {
    styles.textDecoration = 'underline'
  } else if (underline === 'none') {
    styles.textDecoration = 'none'
  } else {
    // If underline prop is hover or undefined, respect the CSS variable
    styles.textDecoration = (textDecorationValue || 'underline') as any
  }

  // Don't apply emphasis opacity - colors are already defined in variants

  return styles
}

function mapLinkProps(props: LinkProps): any {
  const { mantine, material, carbon, title, inlineStyle, ...rest } = props

  // Base props that work across libraries
  // Map 'inlineStyle' to 'style' for library adapters
  const baseProps: any = {
    ...rest,
    title: title,
    style: inlineStyle,
  }

  return {
    ...baseProps,
    // Mantine-specific
    ...(mantine && { mantine }),
    // Material-specific
    ...(material && { material }),
    // Carbon-specific
    ...(carbon && { carbon }),
  }
}
