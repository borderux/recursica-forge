/**
 * Label Component Adapter
 * 
 * Unified Label component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type LabelProps = {
  children?: React.ReactNode
  htmlFor?: string
  variant?: 'default' | 'required' | 'optional'
  size?: 'large' | 'small'
  layout?: 'stacked' | 'side-by-side'
  align?: 'left' | 'right'
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  required?: boolean
} & LibrarySpecificProps

export function Label({
  children,
  htmlFor,
  variant = 'default',
  size,
  layout = 'stacked',
  align = 'left',
  layer = 'layer-0',
  className,
  style,
  required = false,
  mantine,
  material,
  carbon,
}: LabelProps) {
  const Component = useComponent('Label')
  const { mode } = useThemeMode()
  
  // Determine variant based on required prop if not explicitly set
  const styleVariant = variant === 'default' && required ? 'required' : variant
  
  // Get CSS variables for colors
  // Text color and asterisk color are at component level, not variant-specific
  const textColorVar = buildComponentCssVarPath('Label', 'properties', 'colors', layer, 'text')
  const asteriskColorVar = styleVariant === 'required' 
    ? buildComponentCssVarPath('Label', 'properties', 'colors', layer, 'asterisk')
    : undefined
  
  // Get CSS variables for text emphasis opacity
  const highEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-high`
  const lowEmphasisOpacityVar = `--recursica-brand-themes-${mode}-text-emphasis-low`
  
  // Get CSS variables for typography
  const fontSizeVar = getComponentLevelCssVar('Label', 'font-size')
  const fontFamilyVar = getComponentLevelCssVar('Label', 'font-family')
  const fontWeightVar = getComponentLevelCssVar('Label', 'font-weight')
  const letterSpacingVar = getComponentLevelCssVar('Label', 'letter-spacing')
  const lineHeightVar = getComponentLevelCssVar('Label', 'line-height')
  
  const optionalFontSizeVar = getComponentLevelCssVar('Label', 'optional-font-size')
  const optionalFontFamilyVar = getComponentLevelCssVar('Label', 'optional-font-family')
  const optionalFontWeightVar = getComponentLevelCssVar('Label', 'optional-font-weight')
  const optionalLetterSpacingVar = getComponentLevelCssVar('Label', 'optional-letter-spacing')
  const optionalLineHeightVar = getComponentLevelCssVar('Label', 'optional-line-height')
  
  // Get CSS variables for layout-specific sizes
  const requiredIndicatorGapVar = getComponentLevelCssVar('Label', 'required-indicator-gap')
  
  // Get CSS variable for size-based width
  let widthVar: string | undefined
  if (size) {
    widthVar = buildComponentCssVarPath('Label', 'variants', 'sizes', size, 'properties', 'width')
  }
  
  // Get CSS variables for layout-specific spacing
  let layoutStyles: Record<string, string> = {}
  
  if (layout === 'stacked') {
    const bottomPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    layoutStyles.paddingBottom = `var(${bottomPaddingVar})`
  } else if (layout === 'side-by-side') {
    const heightVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'height')
    const verticalPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'vertical-padding')
    // Use min-height instead of height so the label can grow with content
    layoutStyles.minHeight = `var(${heightVar})`
    layoutStyles.paddingTop = `var(${verticalPaddingVar})`
    layoutStyles.paddingBottom = `var(${verticalPaddingVar})`
    // Note: gutter is used by parent container's gap property, not applied to label itself
  }
  
  if (!Component) {
    // Fallback to native label element
    return (
      <label
        htmlFor={htmlFor}
        className={className}
        style={{
          color: `var(${textColorVar})`,
          display: 'block',
          fontSize: `var(${fontSizeVar})`,
          fontFamily: `var(${fontFamilyVar})`,
          fontWeight: `var(${fontWeightVar})`,
          letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
          lineHeight: `var(${lineHeightVar})`,
          textAlign: align,
          width: widthVar ? `var(${widthVar})` : undefined,
          opacity: `var(${highEmphasisOpacityVar})`,
          ...layoutStyles,
          ...style,
        }}
      >
        {styleVariant === 'optional' ? (
          <>
            <span style={{ display: 'block' }}>{children}</span>
            <span
              style={{
                display: 'block',
                marginTop: `var(${requiredIndicatorGapVar})`,
                opacity: `var(${lowEmphasisOpacityVar})`,
                fontSize: `var(${optionalFontSizeVar})`,
                fontFamily: `var(${optionalFontFamilyVar})`,
                fontWeight: `var(${optionalFontWeightVar})`,
                letterSpacing: `var(${optionalLetterSpacingVar})`,
                lineHeight: `var(${optionalLineHeightVar})`,
              }}
            >
              (optional)
            </span>
          </>
        ) : (
          <span style={{ display: 'inline' }}>
            {children}
            {styleVariant === 'required' && (
              <span
                style={{
                  color: asteriskColorVar ? `var(${asteriskColorVar})` : undefined,
                  marginLeft: `var(${requiredIndicatorGapVar})`,
                }}
              >
                *
              </span>
            )}
          </span>
        )}
      </label>
    )
  }
  
  return (
    <Suspense fallback={<label style={{ display: 'block' }}>{children}</label>}>
      <Component
        htmlFor={htmlFor}
        variant={styleVariant}
        size={size}
        layout={layout}
        align={align}
        layer={layer}
        className={className}
        style={{
          ...layoutStyles,
          ...style,
        }}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}

