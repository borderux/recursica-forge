/**
 * Mantine Label Implementation
 * 
 * Mantine-specific Label component that uses CSS variables for theming.
 * Note: Mantine doesn't have a standalone Label component, so we use a native label element.
 */

import React, { useState, useEffect } from 'react'
import type { LabelProps as AdapterLabelProps } from '../../Label'
import { Button } from '../../Button'
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
  editIcon, // Destructure to prevent passing to DOM
  editIconGap,
  mantine,
  ...props
}: AdapterLabelProps) {
  const { mode } = useThemeMode()

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

  // State to force re-renders when CSS vars change (needed for Mantine to pick up CSS var changes)
  const [, setUpdateKey] = useState(0)

  // Get CSS variables for layout-specific sizes
  const requiredIndicatorGapVar = getComponentLevelCssVar('Label', 'required-indicator-gap')
  const optionalTextGapVar = getComponentLevelCssVar('Label', 'label-optional-text-gap')
  const editIconGapVar = getComponentLevelCssVar('Label', 'edit-icon-gap')

  const finalEditIconGap = editIconGap !== undefined
    ? (typeof editIconGap === 'number' ? `${editIconGap}px` : editIconGap)
    : `var(${editIconGapVar})`


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
      const updatedVars = detail?.cssVars || []
      // Update if any text or width CSS var was updated, or if no specific vars were mentioned (global update)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) =>
        allCssVars.includes(cssVar) || cssVar.includes('label') || cssVar.includes('components-label')
      )

      if (shouldUpdate) {
        // Force re-render by updating state
        setUpdateKey(prev => prev + 1)
      }
    }

    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)

    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text and width vars
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
    // Use flexbox to center content vertically (override display: block from default)
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
        display: 'block',
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
        ...layoutStyles,
        ...style,
        ...mantine?.style,
        // Ensure minHeight from layout takes precedence over style props UNLESS a minHeight is explicitly provided
        ...(layout === 'stacked' && stackedMinHeightVar ? {
          minHeight: (style as any)?.minHeight || `var(${stackedMinHeightVar})`
        } : {}),
        ...(layout === 'side-by-side' && minHeightVar ? {
          minHeight: (style as any)?.minHeight || `var(${minHeightVar})`
        } : {}),
      }}
      {...mantine}
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
          <span style={{ display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align, paddingBottom: '0.05em' }}>{children}</span>
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
              overflow: 'visible',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: align,
              paddingBottom: '0.05em',
            }}
          >
            (optional)
          </span>
        </div>
      ) : (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          width: '100%',
          gap: editIcon ? finalEditIconGap : 0
        }}>
          <span style={{ display: 'inline-block', verticalAlign: 'middle', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align, paddingBottom: '0.05em' }}>
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
          {editIcon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <Button variant="text" size="small" icon={editIcon} layer={layer} />
            </span>
          )}
        </span>
      )}
    </label>
  )
}
