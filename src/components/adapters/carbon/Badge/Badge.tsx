/**
 * Carbon Badge Implementation
 * 
 * Carbon-specific Badge component that uses CSS variables for theming.
 * Note: Carbon doesn't have a native Badge component, so we'll create a custom implementation.
 */

import type { BadgeProps as AdapterBadgeProps } from '../../Badge'
import { getComponentCssVar, getComponentLevelCssVar } from '../../../utils/cssVarNames'
import { getTypographyCssVarsFromValue } from '../../../utils/typographyUtils'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import './Badge.css'

export default function Badge({
  children,
  variant = 'primary-color',
  size = 'default',
  layer = 'layer-0',
  className,
  style,
  carbon,
  ...props
}: AdapterBadgeProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables
  const bgVar = getComponentCssVar('Badge', 'color', `${variant}-background`, layer)
  const textVar = getComponentCssVar('Badge', 'color', `${variant}-text`, layer)
  
  // Get size variant CSS variable for min-height
  const minHeightVar = getComponentCssVar('Badge', 'size', `${size}-min-height`, undefined)
  
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
  const typographyVars = getTypographyCssVarsFromValue(textSizeValue) || getTypographyCssVarsFromValue('{brand.typography.caption}') || {
    'font-family': '--recursica-brand-typography-caption-font-family',
    'font-size': '--recursica-brand-typography-caption-font-size',
    'font-weight': '--recursica-brand-typography-caption-font-weight',
    'font-letter-spacing': '--recursica-brand-typography-caption-font-letter-spacing',
    'line-height': '--recursica-brand-typography-caption-line-height',
  }
  
  const paddingHorizontalVar = getComponentLevelCssVar('Badge', 'padding-horizontal')
  const paddingVerticalVar = getComponentLevelCssVar('Badge', 'padding-vertical')
  const borderRadiusVar = getComponentLevelCssVar('Badge', 'border-radius')
  
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
        // Apply size variant min-height
        minHeight: minHeightVar ? `var(${minHeightVar})` : undefined,
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

