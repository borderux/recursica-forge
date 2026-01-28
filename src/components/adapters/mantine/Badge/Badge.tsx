/**
 * Mantine Badge Implementation
 * 
 * Mantine-specific Badge component that uses CSS variables for theming.
 */

import { Badge as MantineBadge } from '@mantine/core'
import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
  
  // Get text CSS variables
  const fontFamilyVar = getComponentTextCssVar('Badge', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('Badge', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('Badge', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('Badge', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('Badge', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('Badge', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('Badge', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('Badge', 'text', 'font-style')
  
  return (
    <MantineBadge
      className={`mantine-badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and text styles
        // The CSS file will use these to style the badge
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        '--badge-font-family': `var(${fontFamilyVar})`,
        '--badge-font-size': `var(${fontSizeVar})`,
        '--badge-font-weight': `var(${fontWeightVar})`,
        '--badge-letter-spacing': `var(${letterSpacingVar})`,
        '--badge-line-height': `var(${lineHeightVar})`,
        '--badge-text-decoration': `var(${textDecorationVar})`,
        '--badge-text-transform': `var(${textTransformVar})`,
        '--badge-font-style': `var(${fontStyleVar})`,
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

