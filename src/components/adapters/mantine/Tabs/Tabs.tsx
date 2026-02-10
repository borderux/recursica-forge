/**
 * Mantine Tabs Implementation
 * 
 * Mantine-specific Tabs component that uses CSS variables for theming.
 */

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
  children,
  className,
  style,
  layer = 'layer-0',
  mantine,
  ...props
}: AdapterTabsProps & { layer?: string }) {
  const { mode } = useThemeMode()

  // Get selected state colors
  const selectedBackgroundVar = buildComponentCssVarPath('Tabs', 'properties', 'selected', 'colors', layer, 'background')
  const selectedBorderColorVar = buildComponentCssVarPath('Tabs', 'properties', 'selected', 'colors', layer, 'border-color')
  const selectedTextColorVar = buildComponentCssVarPath('Tabs', 'properties', 'selected', 'colors', layer, 'text-color')
  const selectedBorderSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'selected', 'border-size')

  // Get unselected state colors
  const unselectedBackgroundVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected', 'colors', layer, 'background')
  const unselectedBackgroundHoverVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected', 'colors', layer, 'background-hover')
  const unselectedBorderColorVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected', 'colors', layer, 'border-color')
  const unselectedTextColorVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected', 'colors', layer, 'text-color')
  const unselectedBorderSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected', 'border-size')

  // Get variant-specific properties
  const borderRadiusVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', 'pills', 'properties', 'border-radius')

  // Get text properties
  const fontFamilyVar = getComponentTextCssVar('Tabs', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Tabs', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Tabs', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Tabs', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Tabs', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Tabs', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Tabs', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Tabs', 'text', 'font-style')

  // Get spacing properties  
  const horizontalPaddingVar = buildComponentCssVarPath('Tabs', 'properties', 'horizontal-padding')
  const verticalPaddingVar = buildComponentCssVarPath('Tabs', 'properties', 'vertical-padding')
  const elementGapVar = buildComponentCssVarPath('Tabs', 'properties', 'element-gap')

  // Get icon size
  const iconSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'icon-size')

  const mantineProps = {
    value,
    defaultValue,
    onChange,
    orientation,
    variant: variant === 'pills' ? 'pills' : variant === 'outline' ? 'outline' : 'default',
    className,
    style: {
      // Set all CSS variables for the Tabs component
      // Selected state
      '--recursica-tabs-selected-background': selectedBackgroundVar ? `var(${selectedBackgroundVar})` : undefined,
      '--recursica-tabs-selected-border-color': selectedBorderColorVar ? `var(${selectedBorderColorVar})` : undefined,
      '--recursica-tabs-selected-text-color': selectedTextColorVar ? `var(${selectedTextColorVar})` : undefined,
      '--recursica-tabs-selected-border-size': selectedBorderSizeVar ? `var(${selectedBorderSizeVar})` : undefined,
      // Unselected state
      '--recursica-tabs-unselected-background': unselectedBackgroundVar ? `var(${unselectedBackgroundVar})` : undefined,
      '--recursica-tabs-unselected-background-hover': unselectedBackgroundHoverVar ? `var(${unselectedBackgroundHoverVar})` : undefined,
      '--recursica-tabs-unselected-border-color': unselectedBorderColorVar ? `var(${unselectedBorderColorVar})` : undefined,
      '--recursica-tabs-unselected-text-color': unselectedTextColorVar ? `var(${unselectedTextColorVar})` : undefined,
      '--recursica-tabs-unselected-border-size': unselectedBorderSizeVar ? `var(${unselectedBorderSizeVar})` : undefined,
      // Variant-specific
      '--recursica-tabs-border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
      // Typography
      '--recursica-tabs-font-family': fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
      '--recursica-tabs-font-size': fontSizeVar ? `var(${fontSizeVar})` : undefined,
      '--recursica-tabs-font-weight': fontWeightVar ? `var(${fontWeightVar})` : undefined,
      '--recursica-tabs-letter-spacing': letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
      '--recursica-tabs-line-height': lineHeightVar ? `var(${lineHeightVar})` : undefined,
      '--recursica-tabs-text-decoration': textDecorationVar ? `var(${textDecorationVar})` : undefined,
      '--recursica-tabs-text-transform': textTransformVar ? `var(${textTransformVar})` : undefined,
      '--recursica-tabs-font-style': fontStyleVar ? `var(${fontStyleVar})` : undefined,
      // Spacing
      '--recursica-tabs-horizontal-padding': horizontalPaddingVar ? `var(${horizontalPaddingVar})` : undefined,
      '--recursica-tabs-vertical-padding': verticalPaddingVar ? `var(${verticalPaddingVar})` : undefined,
      '--recursica-tabs-element-gap': elementGapVar ? `var(${elementGapVar})` : undefined,
      // Icon
      '--recursica-tabs-icon-size': iconSizeVar ? `var(${iconSizeVar})` : undefined,
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

