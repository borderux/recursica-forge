/**
 * Label Component Adapter
 * 
 * Unified Label component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import React, { Suspense } from 'react'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useComponent } from '../hooks/useComponent'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { LabelProps } from './common/Label'

// Re-exported so existing `import type { LabelProps } from '.../adapters/Label'`
// call sites keep working — the types now live in common/Label.ts.
export type { LabelProps } from './common/Label'

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
  onEditIconClick,
  editIconTitle,
  mantine,
  material,
  carbon,
}: LabelProps) {
  const Component = useComponent('Label')
  const { mode } = useThemeMode()

  // Get CSS variable for size-based width based on layout and size variants (moved up to use in listener)
  // Width is nested: variants.layouts.{layout}.variants.sizes.{size}.properties.width
  let widthVar: string | undefined
  const effectiveSize = size || 'default'
  widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layout, 'variants', 'sizes', effectiveSize, 'properties', 'width')
  const labelWidthVar = getComponentLevelCssVar('Label', 'label-width')
  const effectiveWidthVar = widthVar || labelWidthVar

  // Determine variant based on required prop if not explicitly set
  const styleVariant = variant === 'default' && required ? 'required' : variant

  // Handle boolean editIcon
  const EditIconComp = editIcon === true ? iconNameToReactComponent('pencil') || iconNameToReactComponent('edit') : null
  const finalEditIcon = editIcon === true
    ? (EditIconComp ? <EditIconComp style={{ width: '16px', height: '16px' }} /> : null)
    : editIcon as React.ReactNode



  // Get CSS variables for layout-specific spacing
  // Get CSS variables for layout-specific spacing
  let layoutStyles: Record<string, string> = {}

  if (layout === 'side-by-side') {
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
  } else {
    // 'stacked' and any custom layout variant are treated as stacked-like: read the layout's own
    // bottom-padding generically so a user-created layout variant reflects its edited value.
    const bottomPaddingVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layout, 'properties', 'bottom-padding')
    layoutStyles.paddingBottom = `var(${bottomPaddingVar})`
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
        onEditIconClick={onEditIconClick}
        editIconTitle={editIconTitle}
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

