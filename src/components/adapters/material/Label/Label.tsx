/**
 * Material UI Label Implementation
 * 
 * Material UI-specific Label component that uses CSS variables for theming.
 * Note: Material UI uses InputLabel for form labels.
 */

import React, { useState, useEffect } from 'react'
import { InputLabel } from '@mui/material'
import type { LabelProps as AdapterLabelProps } from '../../Label'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
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
  material,
  ...props
}: AdapterLabelProps) {
  // Force re-render when CSS vars change (needed for Material UI to pick up CSS var changes)
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
  
  return (
    <InputLabel
      htmlFor={htmlFor}
      className={className}
      sx={{
        color: `var(${textColorVar})`,
        fontSize: `var(${fontSizeVar})`,
        fontFamily: `var(${fontFamilyVar})`,
        fontWeight: `var(${fontWeightVar})`,
        letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
        lineHeight: `var(${lineHeightVar})`,
        textAlign: align,
        width: widthVar ? `var(${widthVar})` : undefined,
        opacity: `var(${highEmphasisOpacityVar})`,
        ...layoutStyles,
        ...(style as any),
      }}
      {...material}
      {...props}
    >
      {variant === 'optional' ? (
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
    </InputLabel>
  )
}

