/**
 * Label Component Adapter
 * 
 * Unified Label component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useComponent } from '../hooks/useComponent'
import { Button } from './Button'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type LabelProps = {
  children?: React.ReactNode
  htmlFor?: string
  variant?: 'default' | 'required' | 'optional'
  size?: 'default' | 'small'
  layout?: 'stacked' | 'side-by-side'
  align?: 'left' | 'right'
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
  required?: boolean
  id?: string
  editIcon?: React.ReactNode | boolean
  editIconGap?: string | number
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
  editIcon,
  editIconGap,
  mantine,
  material,
  carbon,
}: LabelProps) {
  const Component = useComponent('Label')
  const { mode } = useThemeMode()

  // Get text CSS variables for reactive updates
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

  // Get CSS variable for size-based width based on layout and size variants (moved up to use in listener)
  // Width is nested: variants.layouts.{layout}.variants.sizes.{size}.properties.width
  let widthVar: string | undefined
  const effectiveSize = size || 'default'
  widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layout, 'variants', 'sizes', effectiveSize, 'properties', 'width')
  const labelWidthVar = getComponentLevelCssVar('Label', 'label-width')
  const effectiveWidthVar = widthVar || labelWidthVar

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
    const allCssVars = [...textCssVars, ...widthCssVars]

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
    effectiveWidthVar, widthVar, labelWidthVar, effectiveSize, layout
  ])

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

  // Get CSS variables for layout-specific sizes
  const requiredIndicatorGapVar = getComponentLevelCssVar('Label', 'required-indicator-gap')
  const optionalTextGapVar = getComponentLevelCssVar('Label', 'label-optional-text-gap')
  const editIconGapVar = getComponentLevelCssVar('Label', 'edit-icon-gap')
  const finalEditIconGap = editIconGap !== undefined
    ? (typeof editIconGap === 'number' ? `${editIconGap}px` : editIconGap)
    : `var(${editIconGapVar})`


  // Handle boolean editIcon
  const EditIconComp = editIcon === true ? iconNameToReactComponent('pencil') || iconNameToReactComponent('edit') : null
  const finalEditIcon = editIcon === true
    ? (EditIconComp ? <EditIconComp style={{ width: '16px', height: '16px' }} /> : null)
    : editIcon as React.ReactNode



  // Get CSS variables for layout-specific spacing
  // Get CSS variables for layout-specific spacing
  let layoutStyles: Record<string, string> = {}

  if (layout === 'stacked') {
    const bottomPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    layoutStyles.paddingBottom = `var(${bottomPaddingVar})`
  } else if (layout === 'side-by-side') {
    const minHeightVar = buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'min-height')
    // Use min-height so the label can grow with content
    layoutStyles.minHeight = `var(${minHeightVar})`
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

  if (!Component) {
    // Fallback to native label element
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
          overflow: 'hidden',
          ...layoutStyles,
          ...style,
        }}
      >
        {styleVariant === 'optional' ? (
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
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            width: '100%',
            gap: finalEditIcon ? finalEditIconGap : 0
          }}>
            <span style={{ display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: align }}>
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
            {finalEditIcon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                <Button variant="text" size="small" icon={finalEditIcon} layer={layer} />
              </span>
            )}
          </span>
        )}
      </label>
    )
  }

  return (
    <Suspense fallback={<span />}>
      <Component
        htmlFor={htmlFor}
        variant={styleVariant}
        size={size}
        layout={layout}
        align={align}
        layer={layer}
        className={className}
        editIcon={finalEditIcon}
        editIconGap={editIconGap}
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

