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
import { readCssVar } from '../../core/css/readCssVar'
import { extractTypographyStyleName, getTypographyCssVar } from '../utils/typographyUtils'
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
  
  // Get typography style from component property and use typography CSS variables directly
  const labelFontVar = getComponentLevelCssVar('Label', 'label-font')
  const optionalFontVar = getComponentLevelCssVar('Label', 'optional-font')
  
  // Read the typography property values to extract style names
  const labelFontValue = readCssVar(labelFontVar)
  const optionalFontValue = readCssVar(optionalFontVar)
  
  // Extract typography style names (e.g., 'body-small', 'caption')
  const labelFontStyle = extractTypographyStyleName(labelFontValue) || 'body-small'
  const optionalFontStyle = extractTypographyStyleName(optionalFontValue) || 'caption'
  
  // Get typography CSS variables directly from typography tokens
  const fontSizeVar = getTypographyCssVar(labelFontStyle, 'font-size')
  const fontFamilyVar = getTypographyCssVar(labelFontStyle, 'font-family')
  const fontWeightVar = getTypographyCssVar(labelFontStyle, 'font-weight')
  const letterSpacingVar = getTypographyCssVar(labelFontStyle, 'font-letter-spacing')
  const lineHeightVar = getTypographyCssVar(labelFontStyle, 'line-height')
  
  const optionalFontSizeVar = getTypographyCssVar(optionalFontStyle, 'font-size')
  const optionalFontFamilyVar = getTypographyCssVar(optionalFontStyle, 'font-family')
  const optionalFontWeightVar = getTypographyCssVar(optionalFontStyle, 'font-weight')
  const optionalLetterSpacingVar = getTypographyCssVar(optionalFontStyle, 'font-letter-spacing')
  const optionalLineHeightVar = getTypographyCssVar(optionalFontStyle, 'line-height')
  
  // Get CSS variables for layout-specific sizes
  const requiredIndicatorGapVar = getComponentLevelCssVar('Label', 'required-indicator-gap')
  
  // Get CSS variable for size-based width based on layout and size variants
  // Width is nested: variants.layouts.{layout}.variants.sizes.{size}.properties.width
  let widthVar: string | undefined
  
  if (size) {
    // Get width from nested variant structure
    widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layout, 'variants', 'sizes', size, 'properties', 'width')
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
  
  // Apply width to layoutStyles for both layouts if size is provided
  if (widthVar) {
    layoutStyles.width = `var(${widthVar})`
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
          opacity: `var(${highEmphasisOpacityVar})`,
          overflow: 'hidden',
          ...layoutStyles,
          ...style,
        }}
      >
        {styleVariant === 'optional' ? (
          <>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              (optional)
            </span>
          </>
        ) : (
          <span style={{ display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

