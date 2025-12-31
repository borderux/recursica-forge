/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getTypographyCssVarsFromValue, getTypographyCssVars } from '../../../utils/typographyUtils'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
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
  // The UIKit.json has: { "$type": "typography", "$value": "{brand.typography.caption}" }
  // The resolver might have set the CSS variable to a var() reference, so we try multiple approaches
  const textSizeUIKitVar = getComponentLevelCssVar('Badge', 'text-size')
  let textSizeValue = readCssVar(textSizeUIKitVar)
  
  // If the CSS variable contains a var() reference, try to extract the style name from it
  // e.g., var(--recursica-brand-typography-caption-font-size) -> caption
  if (!textSizeValue || !textSizeValue.includes('{')) {
    // Try reading the resolved value - it might be a var() reference
    const resolved = readCssVarResolved(textSizeUIKitVar)
    if (resolved) {
      textSizeValue = resolved
    }
  }
  
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

