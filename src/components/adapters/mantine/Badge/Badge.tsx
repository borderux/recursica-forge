/**
 * Mantine Badge Implementation
 * 
 * Mantine-specific Badge component that uses CSS variables for theming.
 */

import { Badge as MantineBadge } from '@mantine/core'
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
  mantine,
  ...props
}: AdapterBadgeProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables
  const bgVar = getComponentCssVar('Badge', 'colors', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Badge', 'colors', `${variant}-text`, layer)
  const textSizeVar = getComponentLevelCssVar('Badge', 'text-size')
  
  return (
    <MantineBadge
      className={`mantine-badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and font-size
        // The CSS file will use these to style the badge
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        '--badge-font-size': `var(${textSizeVar})`,
        // Set height to auto to override Mantine Badge's default height
        height: 'auto',
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {children}
    </MantineBadge>
  )
}

