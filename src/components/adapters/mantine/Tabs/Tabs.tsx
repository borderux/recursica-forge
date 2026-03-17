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
import { getComponentCssVar, getComponentTextCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
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

  // Get active state colors
  const activeBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'background')
  const activeBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'border-color')
  const activeTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'text-color')
  const activeIconColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'colors', layer, 'icon-color')
  const activeBorderSizeVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'active', 'border-size')

  // Get inactive state colors
  const inactiveBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'background')
  const inactiveBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'border-color')
  const inactiveTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'text-color')
  const inactiveIconColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'colors', layer, 'icon-color')
  const inactiveBorderSizeVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'inactive', 'border-size')

  // Get variant-specific properties
  const borderRadiusVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'border-radius')

  // Get active text properties
  const activeFontFamilyVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'font-family')
  const activeFontSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'font-size')
  const activeFontWeightVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'font-weight')
  const activeLetterSpacingVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'letter-spacing')
  const activeLineHeightVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'line-height')
  const activeTextDecorationVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'text-decoration')
  const activeTextTransformVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'text-transform')
  const activeFontStyleVar = buildComponentCssVarPath('Tabs', 'properties', 'active-text', 'font-style')

  // Get inactive text properties
  const inactiveFontFamilyVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'font-family')
  const inactiveFontSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'font-size')
  const inactiveFontWeightVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'font-weight')
  const inactiveLetterSpacingVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'letter-spacing')
  const inactiveLineHeightVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'line-height')
  const inactiveTextDecorationVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'text-decoration')
  const inactiveTextTransformVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'text-transform')
  const inactiveFontStyleVar = buildComponentCssVarPath('Tabs', 'properties', 'inactive-text', 'font-style')

  // Get spacing properties from orientation variant
  const horizontalPaddingVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'horizontal-padding')
  const verticalPaddingVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'vertical-padding')
  const elementGapVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'element-gap')
  const spaceBetweenTabsVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'space-between-tabs')
  const gapBetweenTabsAndContentVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'orientation', orientation, 'properties', 'tabs-content-gap')

  // Get icon size from orientation variant
  const iconSizeVar = buildComponentCssVarPath('Tabs', 'variants', 'orientation', orientation, 'properties', 'icon-size')
  const minWidthVar = buildComponentCssVarPath('Tabs', 'properties', 'min-width')
  const maxWidthVar = buildComponentCssVarPath('Tabs', 'properties', 'max-width')

  // Get hover color and opacity from component-level UIKit tokens (not the global overlay)
  const hoverColorVar = getComponentLevelCssVar('Tabs', 'hover-color')
  const hoverOpacityVar = getComponentLevelCssVar('Tabs', 'hover-opacity')

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
    style: {
      // Set all CSS variables for the Tabs component
      // Active state
      '--recursica_tabs_active_background': activeBackgroundVar ? `var(${activeBackgroundVar})` : undefined,
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
      // Tab content alignment (icon/text/badge inside tab button)
      '--recursica_tabs_content_align': tabContentAlignment,
      '--recursica_tabs_content_justify': tabContentAlignment === 'center' ? 'center' : tabContentAlignment === 'right' ? 'flex-end' : 'flex-start',
      // Hover state (inactive tabs only)
      '--recursica_tabs_hover_opacity': `var(${hoverOpacityVar})`,
      '--recursica_tabs_hover_color': `var(${hoverColorVar})`,
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

