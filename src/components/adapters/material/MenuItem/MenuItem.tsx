/**
 * Material UI MenuItem Implementation
 * 
 * Material UI-specific MenuItem component that uses CSS variables for theming.
 */

import type { MenuItemProps as AdapterMenuItemProps } from '../../MenuItem'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
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
  material,
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
  const horizontalPaddingVar = getComponentLevelCssVar('MenuItem', 'horizontal-padding')
  const supportingTextOpacityVar = getComponentLevelCssVar('MenuItem', 'supporting-text-opacity')
  const supportingTextColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'supporting-text-color')
  const dividerColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'divider-color')
  const dividerOpacityVar = getComponentLevelCssVar('MenuItem', 'divider-opacity')
  const dividerItemGapVar = getComponentLevelCssVar('MenuItem', 'divider-item-gap')
  
  // Get text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const fontFamilyVar = getComponentTextCssVar('MenuItem', 'text', 'font-family')
  const fontSizeVar = getComponentTextCssVar('MenuItem', 'text', 'font-size')
  const fontWeightVar = getComponentTextCssVar('MenuItem', 'text', 'font-weight')
  const letterSpacingVar = getComponentTextCssVar('MenuItem', 'text', 'letter-spacing')
  const lineHeightVar = getComponentTextCssVar('MenuItem', 'text', 'line-height')
  const textDecorationVar = getComponentTextCssVar('MenuItem', 'text', 'text-decoration')
  const textTransformVar = getComponentTextCssVar('MenuItem', 'text', 'text-transform')
  const fontStyleVar = getComponentTextCssVar('MenuItem', 'text', 'font-style')
  
  // Get supporting text styling CSS variables
  const supportingFontFamilyVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'font-family')
  const supportingFontSizeVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'font-size')
  const supportingFontWeightVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'font-weight')
  const supportingLetterSpacingVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'letter-spacing')
  const supportingLineHeightVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'line-height')
  const supportingTextDecorationVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'text-decoration')
  const supportingTextTransformVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'text-transform')
  const supportingFontStyleVar = getComponentTextCssVar('MenuItem', 'supporting-text', 'font-style')
  
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
    <div
      className={`mui-menu-item-wrapper ${className || ''} ${divider === 'bottom' ? 'has-divider' : ''}`}
      style={{
        // Set CSS custom properties for CSS file to use
        ['--menu-item-divider-color' as string]: dividerColor || `var(${dividerColorVar})`,
        ['--menu-item-divider-opacity' as string]: dividerOpacity !== undefined ? dividerOpacity : `var(${dividerOpacityVar}, 1)`,
        ['--menu-item-divider-item-gap' as string]: `var(${dividerItemGapVar})`,
        ...style,
      } as React.CSSProperties}
    >
      <button
        disabled={disabled}
        onClick={onClick}
        className={`mui-menu-item ${effectiveVariant}`}
        data-variant={effectiveVariant}
        data-layer={layer}
        data-selected={selected}
        data-disabled={disabled}
        data-leading-icon-type={leadingIconType}
        style={{
          // Set CSS custom properties for CSS file to use
          ['--menu-item-bg' as string]: finalHasBackground ? `var(${finalBgVar})` : 'transparent',
          ['--menu-item-text' as string]: `var(${textVar})`,
          ['--menu-item-border-radius' as string]: `var(${borderRadiusVar})`,
          ['--menu-item-min-width' as string]: `var(${minWidthVar})`,
          ['--menu-item-max-width' as string]: `var(${maxWidthVar})`,
          ['--menu-item-vertical-padding' as string]: `var(${verticalPaddingVar})`,
          ['--menu-item-horizontal-padding' as string]: `var(${horizontalPaddingVar})`,
          ['--menu-item-supporting-text-opacity' as string]: `var(${supportingTextOpacityVar})`,
          ['--menu-item-supporting-text-color' as string]: `var(${supportingTextColorVar})`,
          ['--menu-item-opacity' as string]: disabled ? `var(${getBrandStateCssVar(mode, 'disabled')})` : '1',
          ['--menu-item-hover-opacity' as string]: `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
          ['--menu-item-overlay-color' as string]: `var(${overlayColorVar}, #000000)`, // Overlay color
          // Apply text styles using CSS variables from text style toolbar
          fontFamily: fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
          fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
          fontWeight: fontWeightVar ? `var(${fontWeightVar})` : undefined,
          letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
          lineHeight: lineHeightVar ? `var(${lineHeightVar})` : undefined,
          textDecoration: textDecorationVar ? (readCssVar(textDecorationVar) || 'none') : 'none',
          textTransform: textTransformVar ? (readCssVar(textTransformVar) || 'none') : 'none',
          fontStyle: fontStyleVar ? (readCssVar(fontStyleVar) || 'normal') : 'normal',
        } as React.CSSProperties}
        {...material}
        {...props}
      >
        {leadingIcon && leadingIconType !== 'none' && (
          <span className="mui-menu-item-leading-icon" data-icon-type={leadingIconType}>
            {leadingIconType === 'radio' && !leadingIcon && (
              <span className="mui-menu-item-radio-icon" />
            )}
            {leadingIconType === 'checkbox' && !leadingIcon && (
              <span className="mui-menu-item-checkbox-icon" />
            )}
            {leadingIcon && <span className="mui-menu-item-custom-icon">{leadingIcon}</span>}
          </span>
        )}
        <div className="mui-menu-item-content">
          <span className="mui-menu-item-text">{children}</span>
          {supportingText && (
            <span 
              className="mui-menu-item-supporting-text"
              style={{
                fontFamily: supportingFontFamilyVar ? `var(${supportingFontFamilyVar})` : undefined,
                fontSize: supportingFontSizeVar ? `var(${supportingFontSizeVar})` : undefined,
                fontWeight: supportingFontWeightVar ? `var(${supportingFontWeightVar})` : undefined,
                letterSpacing: supportingLetterSpacingVar ? `var(${supportingLetterSpacingVar})` : undefined,
                lineHeight: supportingLineHeightVar ? `var(${supportingLineHeightVar})` : undefined,
                textDecoration: supportingTextDecorationVar ? (readCssVar(supportingTextDecorationVar) || 'none') : 'none',
                textTransform: supportingTextTransformVar ? (readCssVar(supportingTextTransformVar) || 'none') : 'none',
                fontStyle: supportingFontStyleVar ? (readCssVar(supportingFontStyleVar) || 'normal') : 'normal',
              } as React.CSSProperties}
            >
              {supportingText}
            </span>
          )}
        </div>
        {trailingIcon && (
          <span className="mui-menu-item-trailing-icon">{trailingIcon}</span>
        )}
      </button>
      {divider === 'bottom' && (
        <div className="mui-menu-item-divider" />
      )}
    </div>
  )
}

