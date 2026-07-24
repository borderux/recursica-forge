/**
 * Mantine Tabs Implementation
 *
 * Mantine-specific Tabs component that uses CSS variables for theming.
 * Uses CSS mask on list::before to create a gap under the selected tab (so we don't need
 * opaque bg to cover the track line when selected background is null).
 */

import { useRef } from 'react'
import { Tabs as MantineTabs } from '@mantine/core'
import type { TabsProps as AdapterTabsProps } from '../../Tabs'
import { buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useCssVar } from '../../../hooks/useCssVar'
import './Tabs.css'

export default function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  tabContentAlignment = 'left',
  children,
  className,
  style,
  layer = 'layer-0',
  mantine,
  ...props
}: AdapterTabsProps & { layer?: string }) {


  // Determine the variant style (default to 'default' if not specified)
  const variantStyle = variant || 'default'

  // Per-tab appearance now lives on the TabsItem sub-component: the active/inactive state
  // is a selection-state variant nested under the style (variants/styles/<style>/variants/
  // selection-states/<active|inactive>/properties/{colors,border-size,text}).
  const itemColor = (state: 'active' | 'inactive', prop: string) =>
    buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'variants', 'selection-states', state, 'properties', 'colors', layer, prop)
  const itemProp = (state: 'active' | 'inactive', prop: string) =>
    buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'variants', 'selection-states', state, 'properties', prop)
  const itemText = (state: 'active' | 'inactive', prop: string) =>
    buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'variants', 'selection-states', state, 'properties', 'text', prop)

  // Get active state colors
  const activeBackgroundVar = itemColor('active', 'background-color')
  const activeBorderColorVar = itemColor('active', 'border-color')
  const activeTextColorVar = itemColor('active', 'text-color')
  const activeIconColorVar = itemColor('active', 'icon-color')
  const activeBorderSizeVar = itemProp('active', 'border-size')

  // Read computed active background color to check if it's transparent
  const activeBgColor = useCssVar(activeBackgroundVar || '')
  const isBgTransparent = !activeBgColor || activeBgColor === 'transparent' || activeBgColor === 'rgba(0, 0, 0, 0)'
  const activeBorderTrackColor = isBgTransparent
    ? `var(--recursica_tabs_surface_color)`
    : `var(--recursica_tabs_active_background)`

  // Get inactive state colors
  const inactiveBackgroundVar = itemColor('inactive', 'background-color')
  const inactiveBorderColorVar = itemColor('inactive', 'border-color')
  const inactiveTextColorVar = itemColor('inactive', 'text-color')
  const inactiveIconColorVar = itemColor('inactive', 'icon-color')
  const inactiveBorderSizeVar = itemProp('inactive', 'border-size')

  // Per-style tab corner radius now lives on TabsItem
  const borderRadiusVar = buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'properties', 'border-radius')

  // Get active text properties (per-style, per-state text on TabsItem)
  const activeFontFamilyVar = itemText('active', 'font-family')
  const activeFontSizeVar = itemText('active', 'font-size')
  const activeFontWeightVar = itemText('active', 'font-weight')
  const activeLetterSpacingVar = itemText('active', 'letter-spacing')
  const activeLineHeightVar = itemText('active', 'line-height')
  const activeTextDecorationVar = itemText('active', 'text-decoration')
  const activeTextTransformVar = itemText('active', 'text-transform')
  const activeFontStyleVar = itemText('active', 'font-style')

  // Get inactive text properties
  const inactiveFontFamilyVar = itemText('inactive', 'font-family')
  const inactiveFontSizeVar = itemText('inactive', 'font-size')
  const inactiveFontWeightVar = itemText('inactive', 'font-weight')
  const inactiveLetterSpacingVar = itemText('inactive', 'letter-spacing')
  const inactiveLineHeightVar = itemText('inactive', 'line-height')
  const inactiveTextDecorationVar = itemText('inactive', 'text-decoration')
  const inactiveTextTransformVar = itemText('inactive', 'text-transform')
  const inactiveFontStyleVar = itemText('inactive', 'font-style')

  // Per-tab sizing (padding, icon size, element gap, min/max width) lives on the TabsItem
  // sub-component, per style — a single tab's box is a TabsItem concern, not a group concern.
  const itemSize = (prop: string) =>
    buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'properties', prop)
  const horizontalPaddingVar = itemSize('horizontal-padding')
  const verticalPaddingVar = itemSize('vertical-padding')
  const elementGapVar = itemSize('element-gap')
  const iconSizeVar = itemSize('icon-size')
  const minWidthVar = itemSize('min-width')
  const maxWidthVar = itemSize('max-width')

  // Group-layout properties stay on Tabs, per style × orientation.
  const spaceBetweenTabsVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'variants', 'orientation', orientation, 'properties', 'space-between-tabs')
  const gapBetweenTabsAndContentVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'variants', 'orientation', orientation, 'properties', 'tabs-content-gap')
  // Content alignment is a per-tab concern (TabsItem), varying by style and orientation.
  const tabContentAlignmentVar = buildComponentCssVarPath('TabsItem', 'variants', 'styles', variantStyle, 'variants', 'orientation', orientation, 'properties', 'tab-content-alignment')

  // Get hover color and opacity from style-variant-specific UIKit tokens
  const hoverColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'hover-color')
  const hoverOpacityVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'hover-opacity')

  const rootRef = useRef<HTMLDivElement>(null)


  // Note: Track gap visual effect removed - CSS variables should not be calculated at runtime
  // The outline variant track line will be continuous without gaps

  const mantineProps = {
    ref: rootRef,
    value,
    defaultValue,
    onChange,
    orientation,
    variant: variant === 'pills' ? 'pills' : variant === 'outline' ? 'outline' : 'default',
    className: `recursica-tabs ${className || ''}`.trim(),
    'data-content-align': tabContentAlignment,
    'data-recursica-layer': layer.replace('layer-', ''),
    style: {
      // Set all CSS variables for the Tabs component
      // Active state
      '--recursica_tabs_active_background': activeBackgroundVar ? `var(${activeBackgroundVar}, var(--recursica_tabs_surface_color, white))` : undefined,
      '--recursica_tabs_active_border_track_color': activeBorderTrackColor,
      '--recursica_tabs_active_border-color': activeBorderColorVar ? `var(${activeBorderColorVar})` : undefined,
      '--recursica_tabs_active_text-color': activeTextColorVar ? `var(${activeTextColorVar})` : undefined,
      '--recursica_tabs_active_icon_color': activeIconColorVar ? `var(${activeIconColorVar})` : undefined,
      '--recursica_tabs_active_border-size': activeBorderSizeVar ? `var(${activeBorderSizeVar})` : undefined,
      // Inactive state
      '--recursica_tabs_inactive_background': inactiveBackgroundVar ? `var(${inactiveBackgroundVar})` : undefined,
      '--recursica_tabs_inactive_border-color': inactiveBorderColorVar ? `var(${inactiveBorderColorVar})` : undefined,
      '--recursica_tabs_inactive_text-color': inactiveTextColorVar ? `var(${inactiveTextColorVar})` : undefined,
      '--recursica_tabs_inactive_icon_color': inactiveIconColorVar ? `var(${inactiveIconColorVar})` : undefined,
      '--recursica_tabs_inactive_border-size': inactiveBorderSizeVar ? `var(${inactiveBorderSizeVar})` : undefined,
      // Variant-specific
      '--recursica_tabs_border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
      // Active text typography
      '--recursica_tabs_active_font_family': activeFontFamilyVar ? `var(${activeFontFamilyVar})` : undefined,
      '--recursica_tabs_active_font_size': activeFontSizeVar ? `var(${activeFontSizeVar})` : undefined,
      '--recursica_tabs_active_font_weight': activeFontWeightVar ? `var(${activeFontWeightVar})` : undefined,
      '--recursica_tabs_active_letter-spacing': activeLetterSpacingVar ? `var(${activeLetterSpacingVar})` : undefined,
      '--recursica_tabs_active_line-height': activeLineHeightVar ? `var(${activeLineHeightVar})` : undefined,
      '--recursica_tabs_active_text_decoration': activeTextDecorationVar ? `var(${activeTextDecorationVar})` : undefined,
      '--recursica_tabs_active_text_transform': activeTextTransformVar ? `var(${activeTextTransformVar})` : undefined,
      '--recursica_tabs_active_font_style': activeFontStyleVar ? `var(${activeFontStyleVar})` : undefined,
      // Inactive text typography
      '--recursica_tabs_inactive_font_family': inactiveFontFamilyVar ? `var(${inactiveFontFamilyVar})` : undefined,
      '--recursica_tabs_inactive_font_size': inactiveFontSizeVar ? `var(${inactiveFontSizeVar})` : undefined,
      '--recursica_tabs_inactive_font_weight': inactiveFontWeightVar ? `var(${inactiveFontWeightVar})` : undefined,
      '--recursica_tabs_inactive_letter-spacing': inactiveLetterSpacingVar ? `var(${inactiveLetterSpacingVar})` : undefined,
      '--recursica_tabs_inactive_line-height': inactiveLineHeightVar ? `var(${inactiveLineHeightVar})` : undefined,
      '--recursica_tabs_inactive_text_decoration': inactiveTextDecorationVar ? `var(${inactiveTextDecorationVar})` : undefined,
      '--recursica_tabs_inactive_text_transform': inactiveTextTransformVar ? `var(${inactiveTextTransformVar})` : undefined,
      '--recursica_tabs_inactive_font_style': inactiveFontStyleVar ? `var(${inactiveFontStyleVar})` : undefined,
      // Spacing
      '--recursica_tabs_horizontal_padding': horizontalPaddingVar ? `var(${horizontalPaddingVar})` : undefined,
      '--recursica_tabs_vertical_padding': verticalPaddingVar ? `var(${verticalPaddingVar})` : undefined,
      '--recursica_tabs_element_gap': elementGapVar ? `var(${elementGapVar})` : undefined,
      '--recursica_tabs_space_between_tabs': spaceBetweenTabsVar ? `var(${spaceBetweenTabsVar})` : undefined,
      '--recursica_tabs_content_gap': gapBetweenTabsAndContentVar ? `var(${gapBetweenTabsAndContentVar})` : undefined,
      gap: gapBetweenTabsAndContentVar ? `var(${gapBetweenTabsAndContentVar})` : undefined,
      // Icon
      '--recursica_tabs_icon_size': iconSizeVar ? `var(${iconSizeVar})` : undefined,
      // Tab sizing
      '--recursica_tabs_min_width': minWidthVar ? `var(${minWidthVar})` : undefined,
      '--recursica_tabs_max_width': maxWidthVar ? `var(${maxWidthVar})` : undefined,
      // Tab content alignment (orientation-specific: horizontal and vertical can differ)
      '--recursica_tabs_content_align': tabContentAlignmentVar ? `var(${tabContentAlignmentVar}, ${tabContentAlignment})` : tabContentAlignment,
      // Hover state (inactive tabs only)
      '--recursica_tabs_hover_opacity': `var(${hoverOpacityVar})`,
      '--recursica_tabs_hover_color': `var(${hoverColorVar})`,
      '--recursica_tabs_surface_color': `var(--recursica_brand_${layer.replace('-', '_')}_properties_surface, white)`,
      ...style,
      ...mantine?.style,
    },
    ...mantine,
    ...props,
  }

  return (
    <MantineTabs {...mantineProps}>
      {children}
    </MantineTabs>
  )
}

