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
import { readCssVar } from '../../core/css/readCssVar'
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
  size = 'large',
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
    
    // Get size-specific height
    const sizePrefix = size === 'small' ? 'small' : 'large'
    const heightVar = getComponentCssVar('Badge', 'size', `${sizePrefix}-height`, undefined)
    // Min-height is fixed: 16px for small, 24px for large
    const minHeight = size === 'small' ? '16px' : '24px'
    
    return (
      <span
        className={className}
        style={{
          backgroundColor: `var(${bgVar})`,
          color: `var(${textVar})`,
          fontSize: `var(${textSizeVar})`,
          padding: `var(${paddingVerticalVar}) var(${paddingHorizontalVar})`,
          borderRadius: `var(${borderRadiusVar})`,
          height: heightVar ? `var(${heightVar})` : (size === 'small' ? '16px' : '24px'),
          minHeight,
          display: 'inline-block',
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

