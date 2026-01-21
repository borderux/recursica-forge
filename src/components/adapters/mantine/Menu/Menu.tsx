/**
 * Mantine Menu Implementation
 */

import React from 'react'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import type { MenuProps as AdapterMenuProps } from '../../Menu'
import './Menu.css'

export default function Menu({
  children,
  layer = 'layer-0',
  elevation,
  className,
  style,
  mantine,
  ...props
}: AdapterMenuProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables for colors
  const bgVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'border')
  
  // Get component-level properties
  const borderSizeVar = getComponentLevelCssVar('Menu', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Menu', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('Menu', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Menu', 'max-width')
  const paddingVar = getComponentLevelCssVar('Menu', 'padding')
  const itemGapVar = getComponentLevelCssVar('Menu', 'item-gap')
  
  // Compute elevation box-shadow if elevation is provided
  const elevationBoxShadow = elevation && elevation !== 'elevation-0' 
    ? getElevationBoxShadow(mode, elevation) 
    : undefined
  
  return (
    <div
      className={`mantine-menu ${className || ''}`}
      data-layer={layer}
      style={{
        // Set CSS custom properties for CSS file to use
        ['--menu-bg' as string]: `var(${bgVar})`,
        ['--menu-border' as string]: `var(${borderVar})`,
        ['--menu-border-size' as string]: `var(${borderSizeVar})`,
        ['--menu-border-radius' as string]: `var(${borderRadiusVar})`,
        ['--menu-min-width' as string]: `var(${minWidthVar})`,
        ['--menu-max-width' as string]: `var(${maxWidthVar})`,
        ['--menu-padding' as string]: `var(${paddingVar})`,
        ['--menu-item-gap' as string]: `var(${itemGapVar})`,
        boxShadow: elevationBoxShadow,
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {children}
    </div>
  )
}

