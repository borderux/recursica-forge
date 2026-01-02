/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Badge.css'

export default function Badge({
  children,
  variant = 'primary-color',
  size,
  layer = 'layer-0',
  className,
  style,
  carbon,
  ...props
}: AdapterBadgeProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables
  const bgVar = getComponentCssVar('Badge', 'colors', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Badge', 'colors', `${variant}-text`, layer)
  const textSizeVar = getComponentLevelCssVar('Badge', 'text-size')
  
  return (
    <span
      className={`cds--badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and font-size
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        '--badge-font-size': `var(${textSizeVar})`,
        // Set height to auto to ensure min-height controls the height
        height: 'auto',
        // Only set non-CSS-variable styles here (like display)
        display: 'inline-block',
        ...style,
      } as React.CSSProperties}
      {...carbon}
      {...props}
    >
      {children}
    </span>
  )
}

