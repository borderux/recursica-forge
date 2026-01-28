/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

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
  carbon,
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
    <span
      className={`cds--badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors and text styles
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

