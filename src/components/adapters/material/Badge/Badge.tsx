/**
 * Material UI Badge Implementation
 * 
 * Material UI-specific Badge component that uses CSS variables for theming.
 * Note: Material UI's Badge component is for badges on other components (like notification badges).
 * We use a Chip component instead for standalone badges, or a custom span.
 */

import { Chip } from '@mui/material'
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
  material,
  ...props
}: AdapterBadgeProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables
  const bgVar = getComponentCssVar('Badge', 'colors', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Badge', 'colors', `${variant}-text`, layer)
  const textSizeVar = getComponentLevelCssVar('Badge', 'text-size')
  
  return (
    <Chip
      label={children}
      className={`mui-badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors only
        // The CSS file will use these to style the badge
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        '--badge-font-size': `var(${textSizeVar})`,
        // Set height to auto to override Material UI Chip's default height
        height: 'auto',
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    />
  )
}

