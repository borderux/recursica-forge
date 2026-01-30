/**
 * Material UI Badge Implementation
 * 
 * Material UI-specific Badge component that uses CSS variables for theming.
 * Note: Material UI's Badge component is for badges on other components (like notification badges).
 * We use a Chip component instead for standalone badges, or a custom span.
 */

import { Chip } from '@mui/material'
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
  material,
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
  
  // Get level CSS variables (border-radius, padding)
  const borderRadiusVar = getComponentLevelCssVar('Badge', 'border-radius')
  const paddingVerticalVar = getComponentLevelCssVar('Badge', 'padding-vertical')
  const paddingHorizontalVar = getComponentLevelCssVar('Badge', 'padding-horizontal')
  
  return (
    <Chip
      label={children}
      className={`mui-badge ${className || ''}`}
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
        '--badge-border-radius': `var(${borderRadiusVar})`,
        '--badge-padding-vertical': `var(${paddingVerticalVar})`,
        '--badge-padding-horizontal': `var(${paddingHorizontalVar})`,
        // Set height to auto to override Material UI Chip's default height
        height: 'auto',
        ...style,
      } as React.CSSProperties}
      {...material}
      {...props}
    />
  )
}

