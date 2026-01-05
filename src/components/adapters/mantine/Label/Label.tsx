/**
 * Mantine Label Implementation
 * 
 * Mantine-specific Label component that uses CSS variables for theming.
 * Note: Mantine doesn't have a standalone Label component, so we use a native label element.
 */

import React, { useState, useEffect } from 'react'
import type { LabelProps as AdapterLabelProps } from '../../Label'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import './Label.css'

export default function Label({
  children,
  htmlFor,
  variant = 'default',
  layout = 'stacked',
  align = 'left',
  layer = 'layer-0',
  className,
  style,
  mantine,
  ...props
}: AdapterLabelProps) {
  // Force re-render when CSS vars change (needed for Mantine to pick up CSS var changes)
  const [, setUpdateKey] = useState(0)
  
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
  const textColorVar = buildComponentCssVarPath('Label', 'variants', 'styles', variant, 'properties', 'colors', layer, 'text')
  const asteriskColorVar = variant === 'required' 
    ? buildComponentCssVarPath('Label', 'variants', 'styles', variant, 'properties', 'colors', layer, 'asterisk')
    : undefined
  const optionalTextOpacityVar = variant === 'optional'
    ? buildComponentCssVarPath('Label', 'variants', 'styles', variant, 'properties', 'colors', layer, 'optional-text-opacity')
    : undefined
  
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
  
  let layoutSizeVars: Record<string, string> = {}
  
  if (layout === 'stacked') {
    const bottomPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    layoutSizeVars['--label-bottom-padding'] = `var(${bottomPaddingVar})`
  } else if (layout === 'side-by-side-large') {
    const columnWidthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side-large', 'properties', 'column-width')
    const heightVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side-large', 'properties', 'height')
    const gutterVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side-large', 'properties', 'gutter')
    layoutSizeVars['--label-column-width'] = `var(${columnWidthVar})`
    layoutSizeVars['--label-height'] = `var(${heightVar})`
    layoutSizeVars['--label-gutter'] = `var(${gutterVar})`
  } else if (layout === 'side-by-side-small') {
    const verticalPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side-small', 'properties', 'vertical-padding')
    layoutSizeVars['--label-vertical-padding'] = `var(${verticalPaddingVar})`
  }
  
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
        letterSpacing: `var(${letterSpacingVar})`,
        lineHeight: `var(${lineHeightVar})`,
        textAlign: align,
        ...layoutSizeVars,
        ...style,
        ...mantine?.style,
      }}
      {...mantine}
      {...props}
    >
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
        {variant === 'optional' && optionalTextOpacityVar && (
          <span
            style={{
              opacity: `var(${optionalTextOpacityVar})`,
              marginLeft: `var(${requiredIndicatorGapVar})`,
              fontSize: `var(${optionalFontSizeVar})`,
              fontFamily: `var(${optionalFontFamilyVar})`,
              fontWeight: `var(${optionalFontWeightVar})`,
              letterSpacing: `var(${optionalLetterSpacingVar})`,
              lineHeight: `var(${optionalLineHeightVar})`,
            }}
          >
            (optional)
          </span>
        )}
      </span>
    </label>
  )
}

