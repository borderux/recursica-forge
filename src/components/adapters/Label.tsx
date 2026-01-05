/**
 * Label Component Adapter
 * 
 * Unified Label component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type LabelProps = {
  children?: React.ReactNode
  htmlFor?: string
  variant?: 'default' | 'required' | 'optional'
  layout?: 'stacked' | 'side-by-side-large' | 'side-by-side-small'
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
  
  // Determine variant based on required prop if not explicitly set
  const styleVariant = variant === 'default' && required ? 'required' : variant
  
  // Get CSS variables for colors using buildComponentCssVarPath
  const textColorVar = buildComponentCssVarPath('Label', 'variants', 'styles', styleVariant, 'properties', 'colors', layer, 'text')
  const asteriskColorVar = styleVariant === 'required' 
    ? buildComponentCssVarPath('Label', 'variants', 'styles', styleVariant, 'properties', 'colors', layer, 'asterisk')
    : undefined
  const optionalTextOpacityVar = styleVariant === 'optional'
    ? buildComponentCssVarPath('Label', 'variants', 'styles', styleVariant, 'properties', 'colors', layer, 'optional-text-opacity')
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
          letterSpacing: `var(${letterSpacingVar})`,
          lineHeight: `var(${lineHeightVar})`,
          textAlign: align,
          ...layoutSizeVars,
          ...style,
        }}
      >
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
          {styleVariant === 'optional' && optionalTextOpacityVar && (
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
  
  return (
    <Suspense fallback={<label style={{ display: 'block' }}>{children}</label>}>
      <Component
        htmlFor={htmlFor}
        variant={styleVariant}
        layout={layout}
        align={align}
        layer={layer}
        className={className}
        style={{
          ...layoutSizeVars,
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

