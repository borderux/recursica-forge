/**
 * Carbon Label Implementation
 * 
 * Carbon-specific Label component that uses CSS variables for theming.
 * Note: Carbon uses Label component from @carbon/react.
 */

import React, { useState, useEffect } from 'react'
import type { LabelProps as AdapterLabelProps } from '../../Label'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
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
  
  // Get text properties from component text property groups
  const labelFontSizeVar = getComponentTextCssVar('Label', 'label-text', 'font-size')
  const labelFontFamilyVar = getComponentTextCssVar('Label', 'label-text', 'font-family')
  const labelFontWeightVar = getComponentTextCssVar('Label', 'label-text', 'font-weight')
  const labelLetterSpacingVar = getComponentTextCssVar('Label', 'label-text', 'letter-spacing')
  const labelLineHeightVar = getComponentTextCssVar('Label', 'label-text', 'line-height')
  const labelTextDecorationVar = getComponentTextCssVar('Label', 'label-text', 'text-decoration')
  const labelTextTransformVar = getComponentTextCssVar('Label', 'label-text', 'text-transform')
  const labelFontStyleVar = getComponentTextCssVar('Label', 'label-text', 'font-style')
  
  const optionalFontSizeVar = getComponentTextCssVar('Label', 'optional-text', 'font-size')
  const optionalFontFamilyVar = getComponentTextCssVar('Label', 'optional-text', 'font-family')
  const optionalFontWeightVar = getComponentTextCssVar('Label', 'optional-text', 'font-weight')
  const optionalLetterSpacingVar = getComponentTextCssVar('Label', 'optional-text', 'letter-spacing')
  const optionalLineHeightVar = getComponentTextCssVar('Label', 'optional-text', 'line-height')
  const optionalTextDecorationVar = getComponentTextCssVar('Label', 'optional-text', 'text-decoration')
  const optionalTextTransformVar = getComponentTextCssVar('Label', 'optional-text', 'text-transform')
  const optionalFontStyleVar = getComponentTextCssVar('Label', 'optional-text', 'font-style')
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // Get CSS variables for layout-specific sizes
  const requiredIndicatorGapVar = getComponentLevelCssVar('Label', 'required-indicator-gap')
  const optionalTextGapVar = getComponentLevelCssVar('Label', 'label-optional-text-gap')
  
  // Get CSS variable for size-based width based on layout and size variants
  // Width is nested: variants.layouts.{layout}.variants.sizes.{size}.properties.width
  let widthVar: string | undefined
  
  // Use provided size or default to 'default' if not provided
  const effectiveSize = size || 'default'
  
  // Get width from nested variant structure
  widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layout, 'variants', 'sizes', effectiveSize, 'properties', 'width')
  
  // Also check for general label-width property at component level as fallback
  const labelWidthVar = getComponentLevelCssVar('Label', 'label-width')
  const effectiveWidthVar = widthVar || labelWidthVar
  
  // Get CSS variables for layout-specific spacing (must be declared before useEffect)
  const bottomPaddingVar = layout === 'stacked' 
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    : undefined
  const stackedMinHeightVar = layout === 'stacked'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'min-height')
    : undefined
  const minHeightVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'min-height')
    : undefined
  const verticalPaddingVar = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'vertical-padding')
    : undefined
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      labelFontSizeVar, labelFontFamilyVar, labelFontWeightVar, labelLetterSpacingVar, 
      labelLineHeightVar, labelTextDecorationVar, labelTextTransformVar, labelFontStyleVar,
      optionalFontSizeVar, optionalFontFamilyVar, optionalFontWeightVar, optionalLetterSpacingVar,
      optionalLineHeightVar, optionalTextDecorationVar, optionalTextTransformVar, optionalFontStyleVar
    ]
    
    // Include width CSS vars in the update check
    const widthCssVars = effectiveWidthVar ? [effectiveWidthVar, widthVar, labelWidthVar].filter(Boolean) : []
    // Include layout-specific CSS vars (bottom-padding, min-height, vertical-padding)
    const layoutCssVars = [bottomPaddingVar, stackedMinHeightVar, minHeightVar, verticalPaddingVar].filter(Boolean) as string[]
    const allCssVars = [...textCssVars, ...widthCssVars, ...layoutCssVars]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if any text or width CSS var was updated
      const shouldUpdate = !detail?.cssVars || detail.cssVars.some((cssVar: string) => 
        allCssVars.includes(cssVar) || cssVar.includes('label') || cssVar.includes('components-label')
      )
      
      if (shouldUpdate) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text and width vars
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
  }, [
    labelFontSizeVar, labelFontFamilyVar, labelFontWeightVar, labelLetterSpacingVar,
    labelLineHeightVar, labelTextDecorationVar, labelTextTransformVar, labelFontStyleVar,
    optionalFontSizeVar, optionalFontFamilyVar, optionalFontWeightVar, optionalLetterSpacingVar,
    optionalLineHeightVar, optionalTextDecorationVar, optionalTextTransformVar, optionalFontStyleVar,
    effectiveWidthVar, widthVar, labelWidthVar, effectiveSize, layout,
    bottomPaddingVar, stackedMinHeightVar, minHeightVar, verticalPaddingVar
  ])
  
  // Build layout styles using the CSS variables declared above
  let layoutStyles: Record<string, string> = {}
  
  if (layout === 'stacked') {
    layoutStyles.paddingBottom = `var(${bottomPaddingVar})`
    layoutStyles.minHeight = `var(${stackedMinHeightVar})`
  } else if (layout === 'side-by-side') {
    // Use min-height so the label can grow with content
    layoutStyles.minHeight = `var(${minHeightVar})`
    layoutStyles.paddingTop = `var(${verticalPaddingVar})`
    layoutStyles.paddingBottom = `var(${verticalPaddingVar})`
    // Use flexbox to center content vertically
    layoutStyles.display = 'flex'
    layoutStyles.alignItems = 'center'
    // For right alignment in side-by-side, use justifyContent instead of textAlign
    if (align === 'right') {
      layoutStyles.justifyContent = 'flex-end'
    }
    // Note: gutter is used by parent container's gap property, not applied to label itself
  }
  
  // Apply width/minWidth to layoutStyles
  if (effectiveWidthVar) {
    if (layout === 'side-by-side') {
      // In side-by-side, use minWidth to respect min-width but allow growth
      layoutStyles.minWidth = `var(${effectiveWidthVar})`
    } else {
      // In stacked, use width
      layoutStyles.width = `var(${effectiveWidthVar})`
    }
  }
  
  return (
    <label
      htmlFor={htmlFor}
      className={className}
      style={{
        color: `var(${textColorVar})`,
        fontSize: `var(${labelFontSizeVar})`,
        fontFamily: `var(${labelFontFamilyVar})`,
        fontWeight: `var(${labelFontWeightVar})`,
        fontStyle: labelFontStyleVar ? (readCssVar(labelFontStyleVar) || 'normal') as any : 'normal',
        letterSpacing: labelLetterSpacingVar ? `var(${labelLetterSpacingVar})` : undefined,
        lineHeight: `var(${labelLineHeightVar})`,
        textDecoration: (readCssVar(labelTextDecorationVar) || 'none') as any,
        textTransform: (readCssVar(labelTextTransformVar) || 'none') as any,
        textAlign: align,
        opacity: `var(${highEmphasisOpacityVar})`,
        overflow: 'hidden',
        ...layoutStyles,
        ...style,
        // Ensure minHeight from layout takes precedence over style prop (apply after style spread)
        ...(layout === 'stacked' && stackedMinHeightVar ? { 
          minHeight: `var(${stackedMinHeightVar})`
        } : {}),
        ...(layout === 'side-by-side' && minHeightVar ? { 
          minHeight: `var(${minHeightVar})`
        } : {}),
      }}
      {...carbon}
      {...props}
    >
      {variant === 'optional' ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: layout === 'side-by-side' 
            ? (align === 'right' ? 'flex-end' : 'flex-start')
            : (align === 'right' ? 'flex-end' : 'stretch'),
          gap: optionalTextGapVar ? `var(${optionalTextGapVar})` : undefined,
        }}>
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align }}>{children}</span>
          <span
            style={{
              display: 'block',
              opacity: `var(${lowEmphasisOpacityVar})`,
              fontSize: `var(${optionalFontSizeVar})`,
              fontFamily: `var(${optionalFontFamilyVar})`,
              fontWeight: `var(${optionalFontWeightVar})`,
              fontStyle: optionalFontStyleVar ? (readCssVar(optionalFontStyleVar) || 'normal') as any : 'normal',
              letterSpacing: optionalLetterSpacingVar ? `var(${optionalLetterSpacingVar})` : undefined,
              lineHeight: `var(${optionalLineHeightVar})`,
              textDecoration: (readCssVar(optionalTextDecorationVar) || 'none') as any,
              textTransform: (readCssVar(optionalTextTransformVar) || 'none') as any,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: align,
            }}
          >
            (optional)
          </span>
        </div>
      ) : (
        <span style={{ display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align }}>
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
    </label>
  )
}

