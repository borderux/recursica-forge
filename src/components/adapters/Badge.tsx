/**
 * Badge Component Adapter
 * 
 * Unified Badge component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type BadgeProps = {
  children?: React.ReactNode
  variant?: 'primary-color' | 'warning' | 'success' | 'alert'
  size?: 'small' | 'large'
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: BadgeProps) {
  const Component = useComponent('Badge')
  const { mode } = useThemeMode()
  
  if (!Component) {
    // Fallback to native implementation if component not available
    const bgVar = getComponentCssVar('Badge', 'color', `${variant}-background`, layer)
    const textVar = getComponentCssVar('Badge', 'color', `${variant}-text`, layer)
    const textSizeVar = getComponentLevelCssVar('Badge', 'text-size')
    const paddingHorizontalVar = getComponentLevelCssVar('Badge', 'padding-horizontal')
    const paddingVerticalVar = getComponentLevelCssVar('Badge', 'padding-vertical')
    const borderRadiusVar = getComponentLevelCssVar('Badge', 'border-radius')
    
    // Get size-specific min-height if size is provided
    const minHeightVar = size ? getComponentCssVar('Badge', 'size', `${size}-min-height`, undefined) : undefined
    
    return (
      <span
        className={className}
        style={{
          // Set CSS custom properties for CSS to use
          '--badge-bg': `var(${bgVar})`,
          '--badge-text': `var(${textVar})`,
          '--badge-font-size': `var(${textSizeVar})`,
          '--badge-padding-horizontal': `var(${paddingHorizontalVar})`,
          '--badge-padding-vertical': `var(${paddingVerticalVar})`,
          '--badge-border-radius': `var(${borderRadiusVar})`,
          '--badge-min-height': minHeightVar ? `var(${minHeightVar})` : undefined,
          // Fallback styles for native implementation
          backgroundColor: `var(${bgVar})`,
          color: `var(${textVar})`,
          fontSize: `var(${textSizeVar})`,
          padding: `var(${paddingVerticalVar}) var(${paddingHorizontalVar})`,
          borderRadius: `var(${borderRadiusVar})`,
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: minHeightVar ? `var(${minHeightVar})` : undefined,
          ...style,
        } as React.CSSProperties}
      >
        {children}
      </span>
    )
  }
  
  return (
    <Suspense fallback={<span>{children}</span>}>
      <Component
        variant={variant}
        size={size}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}

