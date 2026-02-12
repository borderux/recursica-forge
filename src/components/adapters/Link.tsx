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
  variant?: 'default' | 'subtle'
  size?: 'default' | 'small'
  layer?: ComponentLayer
  underline?: 'hover' | 'always' | 'none'
  onClick?: (e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  title?: string
  showIcon?: boolean
  iconPosition?: 'start' | 'end'
} & LibrarySpecificProps

export function Link({
  children,
  href,
  target,
  rel,
  variant = 'default',
  size = 'default',
  layer = 'layer-0',
  underline,
  onClick,
  className,
  style,
  startIcon,
  endIcon,
  title,
  showIcon,
  iconPosition = 'end',
  mantine,
  material,
  carbon,
}: LinkProps) {
  const Component = useComponent('Link')
  const { mode } = useThemeMode()

  // Resolve default icon
  const DefaultIconComponent = iconNameToReactComponent('arrow-right')

  let renderedStartIcon = startIcon
  let renderedEndIcon = endIcon

  if (showIcon === true) {
    if (iconPosition === 'start' && !renderedStartIcon) {
      renderedStartIcon = DefaultIconComponent ? <DefaultIconComponent /> : null
    } else if (iconPosition === 'end' && !renderedEndIcon) {
      renderedEndIcon = DefaultIconComponent ? <DefaultIconComponent /> : null
    }
  } else if (showIcon === false) {
    renderedStartIcon = undefined
    renderedEndIcon = undefined
  }

  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    // Get text CSS variables for reactive updates
    const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
    const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
    const fontWeightVar = getComponentTextCssVar('Link', 'text', 'font-weight')
    const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
    const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')
    const textDecorationVar = getComponentTextCssVar('Link', 'text', 'text-decoration')
    const textTransformVar = getComponentTextCssVar('Link', 'text', 'text-transform')
    const fontStyleVar = getComponentTextCssVar('Link', 'text', 'font-style')

    // Calculate dynamic vars
    const textVar = buildComponentCssVarPath('Link', 'properties', 'colors', layer, `default-text`)
    const sizePrefix = size === 'small' ? 'small' : 'default'
    const iconGapVar = getComponentCssVar('Link', 'size', `${sizePrefix}-icon-text-gap`, undefined)

    const textCssVars = [fontFamilyVar, fontSizeVar, fontWeightVar, letterSpacingVar, lineHeightVar, textDecorationVar, textTransformVar, fontStyleVar, textVar, iconGapVar]

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
  }, [layer, size]) // Added missing dependencies

  if (!Component) {
    // Fallback to native anchor if component not available
    const sizePrefix = size === 'small' ? 'small' : 'default'
    const iconGapVar = getComponentCssVar('Link', 'size', `${sizePrefix}-icon-text-gap`, undefined)

    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={className}
        title={title}
        style={{
          ...getLinkStyles(variant, size, layer, underline, mode),
          display: 'inline-flex',
          alignItems: 'center',
          gap: renderedStartIcon || renderedEndIcon ? `var(${iconGapVar})` : 0,
          cursor: 'pointer',
          ...style,
        }}
      >
        {renderedStartIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {renderedStartIcon}
          </span>
        )}
        {children}
        {renderedEndIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
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
    variant,
    size,
    layer,
    underline,
    onClick,
    className,
    style,
    startIcon: renderedStartIcon,
    endIcon: renderedEndIcon,
    title,
    showIcon,
    iconPosition,
    mantine,
    material,
    carbon,
  })

  return (
    <Suspense fallback={<a href={href}>Loading...</a>}>
      <Component {...libraryProps}>{children}</Component>
    </Suspense>
  )
}

function getLinkStyles(
  variant: 'default' | 'subtle',
  size: 'default' | 'small',
  layer: ComponentLayer,
  underline: 'hover' | 'always' | 'none' | undefined,
  mode: 'light' | 'dark' = 'light'
): React.CSSProperties {
  const styles: React.CSSProperties = {}

  // Use UIKit.json link colors - always use default-text
  const textVar = buildComponentCssVarPath('Link', 'properties', 'colors', layer, `default-text`)

  // Get all text properties from component text property group
  const fontFamilyVar = getComponentTextCssVar('Link', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Link', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Link', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Link', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Link', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Link', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Link', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Link', 'text', 'font-style')

  // Get CSS variables for text emphasis opacity
  const highEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-high`
  const lowEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-low`

  // Apply styles using CSS variable references directly
  styles.color = `var(${textVar})`
  styles.fontFamily = `var(${fontFamilyVar})`
  styles.fontSize = `var(${fontSizeVar})`
  styles.fontWeight = `var(${fontWeightVar})`
  styles.fontStyle = fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') as any : 'normal'
  styles.letterSpacing = letterSpacingVar ? `var(${letterSpacingVar})` : undefined
  styles.lineHeight = `var(${lineHeightVar})`

  const textDecorationValue = textDecorationVar ? (readCssVar(textDecorationVar) || 'underline') : 'underline'
  const textTransformValue = textTransformVar ? readCssVar(textTransformVar) : 'none'

  if (underline === 'always') {
    styles.textDecoration = 'underline'
  } else if (underline === 'none') {
    styles.textDecoration = 'none'
  } else {
    // If underline prop is hover or undefined, respect the CSS variable
    styles.textDecoration = (textDecorationValue || 'underline') as any
  }

  styles.textTransform = (textTransformValue || 'none') as any

  // Apply emphasis opacity based on variant
  const emphasisOpacityVar = variant === 'subtle' ? lowEmphasisOpacityVar : highEmphasisOpacityVar
  styles.opacity = `var(${emphasisOpacityVar})`

  return styles
}

function mapLinkProps(props: LinkProps): any {
  const { mantine, material, carbon, title, ...rest } = props

  // Base props that work across libraries
  const baseProps: any = {
    ...rest,
    title: title,
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
