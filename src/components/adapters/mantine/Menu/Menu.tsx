/**
 * Mantine Menu Implementation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getElevationBoxShadow } from '../../../utils/brandCssVars'
import { readCssVar } from '../../../../core/css/readCssVar'
import type { MenuProps as AdapterMenuProps } from '../../Menu'
import './Menu.css'

export default function Menu({
  children,
  layer = 'layer-0',
  elevation,
  maxHeight = 600,
  className,
  style,
  mantine,
  ...props
}: AdapterMenuProps) {
  const { mode } = useThemeMode()

  // Get CSS variables for colors
  const bgVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'border-color')
  const dividerColorVar = buildComponentCssVarPath('Menu', 'properties', 'colors', layer, 'divider-color')

  // Get component-level properties
  const borderSizeVar = getComponentLevelCssVar('Menu', 'border-size')
  const borderRadiusVar = getComponentLevelCssVar('Menu', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('Menu', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('Menu', 'max-width')
  const paddingVar = getComponentLevelCssVar('Menu', 'padding')
  const itemGapVar = getComponentLevelCssVar('Menu', 'item-gap')
  const dividerHeightVar = getComponentLevelCssVar('Menu', 'divider-height')
  const dividerOpacityVar = getComponentLevelCssVar('Menu', 'divider-opacity')

  // Determine if a divider line is configured (height > 0)
  const dividerHeightValue = readCssVar(dividerHeightVar)
  const showDividers = dividerHeightValue && dividerHeightValue !== '0px' && dividerHeightValue !== '0'

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

  // Interleave divider elements between children when configured
  const childArray = React.Children.toArray(children)
  const renderedChildren = showDividers && childArray.length > 1
    ? childArray.reduce<React.ReactNode[]>((acc, child, index) => {
        acc.push(child)
        if (index < childArray.length - 1) {
          acc.push(
            <div
              key={`divider-${index}`}
              className="mantine-menu-divider"
              aria-hidden="true"
            />
          )
        }
        return acc
      }, [])
    : children

  return (
    <div
      ref={menuRef}
      className={`mantine-menu ${className || ''}`}
      data-layer={layer}
      style={{
        ['--menu-bg' as string]: `var(${bgVar})`,
        ['--menu-border' as string]: `var(${borderVar})`,
        ['--menu-border-size' as string]: `var(${borderSizeVar})`,
        ['--menu-border-radius' as string]: `var(${borderRadiusVar})`,
        ['--menu-min-width' as string]: `var(${minWidthVar})`,
        ['--menu-max-width' as string]: `var(${maxWidthVar})`,
        ['--menu-padding' as string]: `var(${paddingVar})`,
        ['--menu-item-gap' as string]: `var(${itemGapVar})`,
        ['--menu-max-height' as string]: `${clampedMaxHeight}px`,
        ['--menu-divider-color' as string]: `var(${dividerColorVar})`,
        ['--menu-divider-height' as string]: `var(${dividerHeightVar})`,
        ['--menu-divider-opacity' as string]: `var(${dividerOpacityVar}, 1)`,
        boxShadow: elevationBoxShadow,
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {renderedChildren}
    </div>
  )
}
