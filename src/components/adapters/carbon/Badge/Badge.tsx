/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getTypographyCssVarsFromValue, getTypographyCssVars } from '../../../utils/typographyUtils'
import { useCssVar } from '../../../hooks/useCssVar'
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
  
  // For typography type properties, we need to extract the typography style name
  // When updated via toolbar, it's set to: {brand.typography.body}
  // The UIKit.json has: { "$type": "typography", "$value": "{brand.typography.body.font-size}" }
  const textSizeUIKitVar = getComponentLevelCssVar('Badge', 'text-size')
  const textSizeValue = useCssVar(textSizeUIKitVar)
  
  // Extract typography style name from the CSS variable value
  // It can be a brace reference like {brand.typography.body} or a CSS var reference
  // Always get typography vars - use fallback to 'caption' if extraction fails
  // This ensures the CSS variables are always set, even if the UIKit.json value can't be read
  const typographyVars = getTypographyCssVarsFromValue(textSizeValue) || getTypographyCssVarsFromValue('{brand.typography.caption}') || getTypographyCssVars('caption')
  
  return (
    <span
      className={`cds--badge ${className || ''}`}
      style={{
        // Set component-level CSS custom properties for colors only
        '--badge-bg': `var(${bgVar})`,
        '--badge-text': `var(${textVar})`,
        // Set all typography CSS variables
        ...(typographyVars ? {
          '--badge-font-family': `var(${typographyVars['font-family']})`,
          '--badge-font-size': `var(${typographyVars['font-size']})`,
          '--badge-font-weight': `var(${typographyVars['font-weight']})`,
          '--badge-letter-spacing': `var(${typographyVars['font-letter-spacing']})`,
          '--badge-line-height': `var(${typographyVars['line-height']})`,
        } : {}),
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

