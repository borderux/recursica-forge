/**
 * Mantine MenuItem Implementation
 * 
 * Mantine-specific MenuItem component that uses CSS variables for theming.
 */

import React, { useState, useEffect } from 'react'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
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
  divider,
  dividerColor,
  dividerOpacity,
  disabled = false,
  onClick,
  className,
  style,
  mantine,
  ...props
}: AdapterMenuItemProps) {
  const { mode } = useThemeMode()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handleUpdate = () => forceUpdate(prev => prev + 1)
    window.addEventListener('cssVarsUpdated', handleUpdate)
    return () => window.removeEventListener('cssVarsUpdated', handleUpdate)
  }, [])

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

  // Get selected/unselected background and text from properties.colors (component-level, layer-specific)
  const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'background')
  const selectedTextVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'text')
  const unselectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'background')
  const unselectedTextVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'text')

  // Get component-level properties
  const borderRadiusVar = getComponentLevelCssVar('MenuItem', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('MenuItem', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('MenuItem', 'max-width')
  const verticalPaddingVar = getComponentLevelCssVar('MenuItem', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('MenuItem', 'horizontal-padding')
  const supportingTextOpacityVar = buildComponentCssVarPath('MenuItem', 'properties', 'unselected-item', 'supporting-text-opacity')
  const supportingTextColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'supporting-text-color')
  const dividerColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'divider-color')
  const dividerOpacityVar = getComponentLevelCssVar('MenuItem', 'divider-opacity')
  const dividerHeightVar = getComponentLevelCssVar('MenuItem', 'divider-height')
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

  // For selected state, use selected-item properties. For default state, use unselected-item properties.
  const finalBgVar = effectiveVariant === 'selected' ? selectedBgVar : (effectiveVariant === 'default' ? unselectedBgVar : bgVar)
  const finalTextVar = effectiveVariant === 'selected' ? selectedTextVar : (effectiveVariant === 'default' ? unselectedTextVar : textVar)
  const finalBgColorValue = readCssVar(finalBgVar)
  const finalHasBackground = finalBgColorValue && finalBgColorValue !== 'transparent' && finalBgColorValue !== 'null'

  // Read divider height to determine if it should be visible by default
  const dividerHeightValue = readCssVar(dividerHeightVar)
  const isGlobalDividerVisible = dividerHeightValue && dividerHeightValue !== '0px' && dividerHeightValue !== '0'

  // Explicit prop 'bottom' always shows it. 
  // 'none' always hides it.
  // undefined (default) uses global setting.
  const showDivider = divider === 'bottom' || (divider !== 'none' && isGlobalDividerVisible)

  return (
    <div
      className={`mantine-menu-item-wrapper ${className || ''} ${showDivider ? 'has-divider' : ''}`}
      style={{
        // Set CSS custom properties for CSS file to use
        ['--menu-item-divider-color' as string]: dividerColor || `var(${dividerColorVar})`,
        ['--menu-item-divider-opacity' as string]: dividerOpacity !== undefined ? dividerOpacity : `var(${dividerOpacityVar}, 1)`,
        // Use dividerHeightVar if showDivider is true, otherwise 0px
        ['--menu-item-divider-height' as string]: showDivider ? `var(${dividerHeightVar})` : '0px',
        ['--menu-item-divider-item-gap' as string]: showDivider ? `var(${dividerItemGapVar}, 4px)` : '0px',
        ...style,
      } as React.CSSProperties}
    >
      <button
        disabled={disabled}
        onClick={onClick}
        className={`mantine-menu-item ${effectiveVariant}`}
        data-variant={effectiveVariant}
        data-layer={layer}
        data-selected={selected}
        data-disabled={disabled}
        data-leading-icon-type={leadingIconType}
        style={{
          // Set CSS custom properties for CSS file to use
          ['--menu-item-bg' as string]: finalHasBackground ? `var(${finalBgVar})` : 'transparent',
          ['--menu-item-text' as string]: `var(${finalTextVar})`,
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
        {...mantine}
        {...props}
      >
        {leadingIconType !== 'none' && (
          <span className="mantine-menu-item-leading-icon" data-icon-type={leadingIconType}>
            {leadingIconType === 'radio' && !leadingIcon && (
              <span className={`mantine-menu-item-radio-icon ${selected ? 'selected' : ''}`} />
            )}
            {leadingIconType === 'checkbox' && !leadingIcon && (
              <span className={`mantine-menu-item-checkbox-icon ${selected ? 'selected' : ''}`} />
            )}
            {leadingIcon && <span className="mantine-menu-item-custom-icon">{leadingIcon}</span>}
          </span>
        )}
        <div className="mantine-menu-item-content">
          <span className="mantine-menu-item-text">{children}</span>
          {supportingText && (
            <span
              className="mantine-menu-item-supporting-text"
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
        {(trailingIcon || selected) && (
          <span className="mantine-menu-item-trailing-icon">
            {trailingIcon || (selected && iconNameToReactComponent('check') ? React.createElement(iconNameToReactComponent('check')!) : (selected ? '✓' : null))}
          </span>
        )}
      </button>
      <div className="mantine-menu-item-divider" />
    </div>
  )
}

