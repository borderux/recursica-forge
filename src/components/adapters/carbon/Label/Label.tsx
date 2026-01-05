/**
 * Carbon Label Implementation
 * 
 * Carbon-specific Label component that uses CSS variables for theming.
 * Note: Carbon uses Label component from @carbon/react.
 */

import React, { useState, useEffect } from 'react'
import { Label as CarbonLabel } from '@carbon/react'
import type { LabelProps as AdapterLabelProps } from '../../Label'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { extractTypographyStyleName, getTypographyCssVar } from '../../../utils/typographyUtils'
import './Label.css'

export default function Label({
  children,
  htmlFor,
  variant = 'default',
  size,
  layout = 'stacked',
  align = 'left',
  layer = 'layer-0',
  className,
  style,
  carbon,
  ...props
}: AdapterLabelProps) {
  // Force re-render when CSS vars change (needed for Carbon to pick up CSS var changes)
  const [, setUpdateKey] = useState(0)
  const { mode } = useThemeMode()
  
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Only re-render if label CSS vars were updated, or if no specific vars were mentioned (global update)
      if (updatedVars.length === 0 || updatedVars.some((v: string) => v.includes('label') || v.includes('components-label'))) {
        setUpdateKey(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [])
  
  // Get CSS variables for colors
  // Text color is at component level, not variant-specific
  const textColorVar = buildComponentCssVarPath('Label', 'properties', 'colors', layer, 'text')
  const asteriskColorVar = variant === 'required' 
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
  
  return (
    <CarbonLabel
      htmlFor={htmlFor}
      className={className}
      style={{
        color: `var(${textColorVar})`,
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
      {...carbon}
      {...props}
    >
      {variant === 'optional' ? (
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
          {variant === 'required' && asteriskColorVar && (
            <span
              style={{
                color: `var(${asteriskColorVar})`,
                marginLeft: `var(${requiredIndicatorGapVar})`,
              }}
            >
              *
            </span>
          )}
        </span>
      )}
    </CarbonLabel>
  )
}

