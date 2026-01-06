/**
 * Carbon MenuItem Implementation
 * 
 * Carbon-specific MenuItem component that uses CSS variables for theming.
 */

import type { MenuItemProps as AdapterMenuItemProps } from '../../MenuItem'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath } from '../../../utils/cssVarNames'
import { getBrandStateCssVar } from '../../../utils/brandCssVars'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './MenuItem.css'

export default function MenuItem({
  children,
  variant = 'default',
  layer = 'layer-0',
  leadingIcon,
  leadingIconType = 'none',
  trailingIcon,
  supportingText,
  selected = false,
  divider = 'bottom',
  dividerColor,
  dividerOpacity,
  disabled = false,
  onClick,
  className,
  style,
  carbon,
  ...props
}: AdapterMenuItemProps) {
  const { mode } = useThemeMode()
  
  // Determine effective variant
  let effectiveVariant = variant
  if (disabled) {
    effectiveVariant = 'disabled'
  } else if (selected) {
    effectiveVariant = 'selected'
  }
  
  // Get CSS variables for colors
  const bgVar = getComponentCssVar('MenuItem', 'colors', `${effectiveVariant}-background`, layer)
  const textVar = getComponentCssVar('MenuItem', 'colors', `${effectiveVariant}-text`, layer)
  
  // Get selected-background from properties.colors (component-level, layer-specific)
  const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-background')
  
  // Get component-level properties
  const borderRadiusVar = getComponentLevelCssVar('MenuItem', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('MenuItem', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('MenuItem', 'max-width')
  const verticalPaddingVar = getComponentLevelCssVar('MenuItem', 'vertical-padding')
  const supportingTextOpacityVar = getComponentLevelCssVar('MenuItem', 'supporting-text-opacity')
  const supportingTextColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'supporting-text-color')
  const dividerColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'divider-color')
  const dividerOpacityVar = getComponentLevelCssVar('MenuItem', 'divider-opacity')
  
  // Get hover opacity and overlay color from brand theme (not user-configurable)
  const hoverOpacityVar = getBrandStateCssVar(mode, 'hover')
  const overlayColorVar = getBrandStateCssVar(mode, 'overlay.color')
  
  // Read background color to check if it's null/transparent
  const bgColorValue = readCssVar(bgVar)
  const hasBackground = bgColorValue && bgColorValue !== 'transparent' && bgColorValue !== 'null'
  
  // For selected state, use selected-background instead of variant background
  const finalBgVar = effectiveVariant === 'selected' ? selectedBgVar : bgVar
  const finalBgColorValue = effectiveVariant === 'selected' ? readCssVar(selectedBgVar) : bgColorValue
  const finalHasBackground = finalBgColorValue && finalBgColorValue !== 'transparent' && finalBgColorValue !== 'null'
  
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`cds-menu-item ${className || ''} ${effectiveVariant} ${divider === 'bottom' ? 'has-divider' : ''}`}
      data-variant={effectiveVariant}
      data-layer={layer}
      data-selected={selected}
      data-disabled={disabled}
      data-leading-icon-type={leadingIconType}
      style={{
        // Set CSS custom properties for CSS file to use
        '--menu-item-bg': finalHasBackground ? `var(${finalBgVar})` : 'transparent',
        '--menu-item-text': `var(${textVar})`,
        '--menu-item-border-radius': `var(${borderRadiusVar})`,
        '--menu-item-min-width': `var(${minWidthVar})`,
        '--menu-item-max-width': `var(${maxWidthVar})`,
        '--menu-item-vertical-padding': `var(${verticalPaddingVar})`,
        '--menu-item-supporting-text-opacity': `var(${supportingTextOpacityVar})`,
        '--menu-item-supporting-text-color': `var(${supportingTextColorVar})`,
        '--menu-item-divider-color': dividerColor || `var(${dividerColorVar})`,
        '--menu-item-divider-opacity': dividerOpacity !== undefined ? dividerOpacity : `var(${dividerOpacityVar}, 1)`,
        '--menu-item-opacity': disabled ? `var(${getBrandStateCssVar(mode, 'disabled')})` : '1',
        '--menu-item-hover-opacity': `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
        '--menu-item-overlay-color': `var(${overlayColorVar}, #000000)`, // Overlay color
        ...style,
      }}
      {...carbon}
      {...props}
    >
      {leadingIcon && leadingIconType !== 'none' && (
        <span className="cds-menu-item-leading-icon" data-icon-type={leadingIconType}>
          {leadingIconType === 'radio' && !leadingIcon && (
            <span className="cds-menu-item-radio-icon" />
          )}
          {leadingIconType === 'checkbox' && !leadingIcon && (
            <span className="cds-menu-item-checkbox-icon" />
          )}
          {leadingIcon && <span className="cds-menu-item-custom-icon">{leadingIcon}</span>}
        </span>
      )}
      <div className="cds-menu-item-content">
        <span className="cds-menu-item-text">{children}</span>
        {supportingText && (
          <span className="cds-menu-item-supporting-text">{supportingText}</span>
        )}
      </div>
      {trailingIcon && (
        <span className="cds-menu-item-trailing-icon">{trailingIcon}</span>
      )}
      {divider === 'bottom' && (
        <div className="cds-menu-item-divider" />
      )}
    </button>
  )
}

