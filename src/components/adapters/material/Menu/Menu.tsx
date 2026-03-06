/**
 * Material UI Menu Implementation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import type { MenuProps as AdapterMenuProps } from '../../Menu'
import './Menu.css'

export default function Menu({
  children,
  layer = 'layer-0',
  elevation,
  maxHeight = 600,
  className,
  style,
  material,
  ...props
}: AdapterMenuProps) {
  const { mode } = useThemeMode()

  // Get CSS variables for colors
  const bgVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'border-color')

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

  // Viewport-aware max-height clamping
  const menuRef = useRef<HTMLDivElement>(null)
  const [clampedMaxHeight, setClampedMaxHeight] = useState(maxHeight)

  const updateClampedHeight = useCallback(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const availableHeight = viewportHeight - rect.top
      setClampedMaxHeight(Math.min(maxHeight, availableHeight))
    } else {
      setClampedMaxHeight(maxHeight)
    }
  }, [maxHeight])

  useEffect(() => {
    updateClampedHeight()
    window.addEventListener('resize', updateClampedHeight)
    window.addEventListener('scroll', updateClampedHeight, true)
    return () => {
      window.removeEventListener('resize', updateClampedHeight)
      window.removeEventListener('scroll', updateClampedHeight, true)
    }
  }, [updateClampedHeight])

  return (
    <div
      ref={menuRef}
      className={`mui-menu ${className || ''}`}
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
        ['--menu-max-height' as string]: `${clampedMaxHeight}px`,
        boxShadow: elevationBoxShadow,
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    >
      {children}
    </div>
  )
}

