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
import { getComponentCssVar, getComponentTextCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
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
  const { mode } = useThemeMode()

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
      '--recursica-tabs-active-background': activeBackgroundVar ? `var(${activeBackgroundVar})` : undefined,
      '--recursica-tabs-active-border-color': activeBorderColorVar ? `var(${activeBorderColorVar})` : undefined,
      '--recursica-tabs-active-text-color': activeTextColorVar ? `var(${activeTextColorVar})` : undefined,
      '--recursica-tabs-active-icon-color': activeIconColorVar ? `var(${activeIconColorVar})` : undefined,
      '--recursica-tabs-active-border-size': activeBorderSizeVar ? `var(${activeBorderSizeVar})` : undefined,
      // Inactive state
      '--recursica-tabs-inactive-background': inactiveBackgroundVar ? `var(${inactiveBackgroundVar})` : undefined,
      '--recursica-tabs-inactive-border-color': inactiveBorderColorVar ? `var(${inactiveBorderColorVar})` : undefined,
      '--recursica-tabs-inactive-text-color': inactiveTextColorVar ? `var(${inactiveTextColorVar})` : undefined,
      '--recursica-tabs-inactive-icon-color': inactiveIconColorVar ? `var(${inactiveIconColorVar})` : undefined,
      '--recursica-tabs-inactive-border-size': inactiveBorderSizeVar ? `var(${inactiveBorderSizeVar})` : undefined,
      // Variant-specific
      '--recursica-tabs-border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
      // Active text typography
      '--recursica-tabs-active-font-family': activeFontFamilyVar ? `var(${activeFontFamilyVar})` : undefined,
      '--recursica-tabs-active-font-size': activeFontSizeVar ? `var(${activeFontSizeVar})` : undefined,
      '--recursica-tabs-active-font-weight': activeFontWeightVar ? `var(${activeFontWeightVar})` : undefined,
      '--recursica-tabs-active-letter-spacing': activeLetterSpacingVar ? `var(${activeLetterSpacingVar})` : undefined,
      '--recursica-tabs-active-line-height': activeLineHeightVar ? `var(${activeLineHeightVar})` : undefined,
      '--recursica-tabs-active-text-decoration': activeTextDecorationVar ? `var(${activeTextDecorationVar})` : undefined,
      '--recursica-tabs-active-text-transform': activeTextTransformVar ? `var(${activeTextTransformVar})` : undefined,
      '--recursica-tabs-active-font-style': activeFontStyleVar ? `var(${activeFontStyleVar})` : undefined,
      // Inactive text typography
      '--recursica-tabs-inactive-font-family': inactiveFontFamilyVar ? `var(${inactiveFontFamilyVar})` : undefined,
      '--recursica-tabs-inactive-font-size': inactiveFontSizeVar ? `var(${inactiveFontSizeVar})` : undefined,
      '--recursica-tabs-inactive-font-weight': inactiveFontWeightVar ? `var(${inactiveFontWeightVar})` : undefined,
      '--recursica-tabs-inactive-letter-spacing': inactiveLetterSpacingVar ? `var(${inactiveLetterSpacingVar})` : undefined,
      '--recursica-tabs-inactive-line-height': inactiveLineHeightVar ? `var(${inactiveLineHeightVar})` : undefined,
      '--recursica-tabs-inactive-text-decoration': inactiveTextDecorationVar ? `var(${inactiveTextDecorationVar})` : undefined,
      '--recursica-tabs-inactive-text-transform': inactiveTextTransformVar ? `var(${inactiveTextTransformVar})` : undefined,
      '--recursica-tabs-inactive-font-style': inactiveFontStyleVar ? `var(${inactiveFontStyleVar})` : undefined,
      // Spacing
      '--recursica-tabs-horizontal-padding': horizontalPaddingVar ? `var(${horizontalPaddingVar})` : undefined,
      '--recursica-tabs-vertical-padding': verticalPaddingVar ? `var(${verticalPaddingVar})` : undefined,
      '--recursica-tabs-element-gap': elementGapVar ? `var(${elementGapVar})` : undefined,
      '--recursica-tabs-space-between-tabs': spaceBetweenTabsVar ? `var(${spaceBetweenTabsVar})` : undefined,
      '--recursica-tabs-content-gap': gapBetweenTabsAndContentVar ? `var(${gapBetweenTabsAndContentVar})` : undefined,
      gap: gapBetweenTabsAndContentVar ? `var(${gapBetweenTabsAndContentVar})` : undefined,
      // Icon
      '--recursica-tabs-icon-size': iconSizeVar ? `var(${iconSizeVar})` : undefined,
      // Tab sizing
      '--recursica-tabs-min-width': minWidthVar ? `var(${minWidthVar})` : undefined,
      '--recursica-tabs-max-width': maxWidthVar ? `var(${maxWidthVar})` : undefined,
      // Tab content alignment (icon/text/badge inside tab button)
      '--recursica-tabs-content-align': tabContentAlignment,
      '--recursica-tabs-content-justify': tabContentAlignment === 'center' ? 'center' : tabContentAlignment === 'right' ? 'flex-end' : 'flex-start',
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

