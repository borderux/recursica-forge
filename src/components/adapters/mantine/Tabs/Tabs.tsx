/**
 * Mantine Tabs Implementation
 *
 * Mantine-specific Tabs component that uses CSS variables for theming.
 * Uses CSS mask on list::before to create a gap under the selected tab (so we don't need
 * opaque bg to cover the track line when selected background is null).
 */

import { useRef, useEffect } from 'react'
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

  // Get selected state colors
  const selectedBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'selected', 'colors', layer, 'background')
  const selectedBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'selected', 'colors', layer, 'border-color')
  const selectedTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'selected', 'colors', layer, 'text-color')
  const selectedIconColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'selected', 'colors', layer, 'icon-color')
  const selectedBorderSizeVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'selected', 'border-size')

  // Get unselected state colors
  const unselectedBackgroundVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'unselected', 'colors', layer, 'background')
  const unselectedBorderColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'unselected', 'colors', layer, 'border-color')
  const unselectedTextColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'unselected', 'colors', layer, 'text-color')
  const unselectedIconColorVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'unselected', 'colors', layer, 'icon-color')
  const unselectedBorderSizeVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'unselected', 'border-size')

  // Get variant-specific properties
  const borderRadiusVar = buildComponentCssVarPath('Tabs', 'variants', 'styles', variantStyle, 'properties', 'border-radius')

  // Get selected text properties
  const selectedFontFamilyVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'font-family')
  const selectedFontSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'font-size')
  const selectedFontWeightVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'font-weight')
  const selectedLetterSpacingVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'letter-spacing')
  const selectedLineHeightVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'line-height')
  const selectedTextDecorationVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'text-decoration')
  const selectedTextTransformVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'text-transform')
  const selectedFontStyleVar = buildComponentCssVarPath('Tabs', 'properties', 'selected-text', 'font-style')

  // Get unselected text properties
  const unselectedFontFamilyVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'font-family')
  const unselectedFontSizeVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'font-size')
  const unselectedFontWeightVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'font-weight')
  const unselectedLetterSpacingVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'letter-spacing')
  const unselectedLineHeightVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'line-height')
  const unselectedTextDecorationVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'text-decoration')
  const unselectedTextTransformVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'text-transform')
  const unselectedFontStyleVar = buildComponentCssVarPath('Tabs', 'properties', 'unselected-text', 'font-style')

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

  useEffect(() => {
    const root = rootRef.current
    if (!root || variant === 'pills') return
    const list = root.querySelector<HTMLElement>('[role="tablist"]')
    if (!list) return
    const updateTrackGap = () => {
      const selectedTab = root!.querySelector<HTMLElement>('[role="tab"][data-active]')
      if (orientation === 'horizontal') {
        root!.style.removeProperty('--recursica-tabs-track-gap-top')
        root!.style.removeProperty('--recursica-tabs-track-gap-height')
        if (!selectedTab) {
          root!.style.removeProperty('--recursica-tabs-track-gap-left')
          root!.style.removeProperty('--recursica-tabs-track-gap-width')
          return
        }
        const listRect = list.getBoundingClientRect()
        const tabRect = selectedTab.getBoundingClientRect()
        const left = tabRect.left - listRect.left + list.scrollLeft
        const width = tabRect.width
        root!.style.setProperty('--recursica-tabs-track-gap-left', `${left}px`)
        root!.style.setProperty('--recursica-tabs-track-gap-width', `${width}px`)
      } else {
        /* vertical outline: gap in track where selected tab is */
        root!.style.removeProperty('--recursica-tabs-track-gap-left')
        root!.style.removeProperty('--recursica-tabs-track-gap-width')
        if (!selectedTab || variant !== 'outline') {
          root!.style.removeProperty('--recursica-tabs-track-gap-top')
          root!.style.removeProperty('--recursica-tabs-track-gap-height')
          return
        }
        const listRect = list.getBoundingClientRect()
        const tabRect = selectedTab.getBoundingClientRect()
        const top = tabRect.top - listRect.top + list.scrollTop
        const height = tabRect.height
        root!.style.setProperty('--recursica-tabs-track-gap-top', `${top}px`)
        root!.style.setProperty('--recursica-tabs-track-gap-height', `${height}px`)
      }
    }
    updateTrackGap()
    const ro = new ResizeObserver(updateTrackGap)
    const mo = new MutationObserver(updateTrackGap)
    ro.observe(list)
    mo.observe(list, { attributes: true, attributeFilter: ['data-active'], subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [value, defaultValue, orientation, variant, children])

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
      // Selected state
      '--recursica-tabs-selected-background': selectedBackgroundVar ? `var(${selectedBackgroundVar})` : undefined,
      '--recursica-tabs-selected-border-color': selectedBorderColorVar ? `var(${selectedBorderColorVar})` : undefined,
      '--recursica-tabs-selected-text-color': selectedTextColorVar ? `var(${selectedTextColorVar})` : undefined,
      '--recursica-tabs-selected-icon-color': selectedIconColorVar ? `var(${selectedIconColorVar})` : undefined,
      '--recursica-tabs-selected-border-size': selectedBorderSizeVar ? `var(${selectedBorderSizeVar})` : undefined,
      // Unselected state
      '--recursica-tabs-unselected-background': unselectedBackgroundVar ? `var(${unselectedBackgroundVar})` : undefined,
      '--recursica-tabs-unselected-border-color': unselectedBorderColorVar ? `var(${unselectedBorderColorVar})` : undefined,
      '--recursica-tabs-unselected-text-color': unselectedTextColorVar ? `var(${unselectedTextColorVar})` : undefined,
      '--recursica-tabs-unselected-icon-color': unselectedIconColorVar ? `var(${unselectedIconColorVar})` : undefined,
      '--recursica-tabs-unselected-border-size': unselectedBorderSizeVar ? `var(${unselectedBorderSizeVar})` : undefined,
      // Variant-specific
      '--recursica-tabs-border-radius': borderRadiusVar ? `var(${borderRadiusVar})` : undefined,
      // Selected text typography
      '--recursica-tabs-selected-font-family': selectedFontFamilyVar ? `var(${selectedFontFamilyVar})` : undefined,
      '--recursica-tabs-selected-font-size': selectedFontSizeVar ? `var(${selectedFontSizeVar})` : undefined,
      '--recursica-tabs-selected-font-weight': selectedFontWeightVar ? `var(${selectedFontWeightVar})` : undefined,
      '--recursica-tabs-selected-letter-spacing': selectedLetterSpacingVar ? `var(${selectedLetterSpacingVar})` : undefined,
      '--recursica-tabs-selected-line-height': selectedLineHeightVar ? `var(${selectedLineHeightVar})` : undefined,
      '--recursica-tabs-selected-text-decoration': selectedTextDecorationVar ? `var(${selectedTextDecorationVar})` : undefined,
      '--recursica-tabs-selected-text-transform': selectedTextTransformVar ? `var(${selectedTextTransformVar})` : undefined,
      '--recursica-tabs-selected-font-style': selectedFontStyleVar ? `var(${selectedFontStyleVar})` : undefined,
      // Unselected text typography
      '--recursica-tabs-unselected-font-family': unselectedFontFamilyVar ? `var(${unselectedFontFamilyVar})` : undefined,
      '--recursica-tabs-unselected-font-size': unselectedFontSizeVar ? `var(${unselectedFontSizeVar})` : undefined,
      '--recursica-tabs-unselected-font-weight': unselectedFontWeightVar ? `var(${unselectedFontWeightVar})` : undefined,
      '--recursica-tabs-unselected-letter-spacing': unselectedLetterSpacingVar ? `var(${unselectedLetterSpacingVar})` : undefined,
      '--recursica-tabs-unselected-line-height': unselectedLineHeightVar ? `var(${unselectedLineHeightVar})` : undefined,
      '--recursica-tabs-unselected-text-decoration': unselectedTextDecorationVar ? `var(${unselectedTextDecorationVar})` : undefined,
      '--recursica-tabs-unselected-text-transform': unselectedTextTransformVar ? `var(${unselectedTextTransformVar})` : undefined,
      '--recursica-tabs-unselected-font-style': unselectedFontStyleVar ? `var(${unselectedFontStyleVar})` : undefined,
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

