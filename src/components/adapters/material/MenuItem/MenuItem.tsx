/**
 * Material UI MenuItem Implementation
 * 
 * Material UI-specific MenuItem component that uses CSS variables for theming.
 */

import React, { useState, useEffect } from 'react'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import type { MenuItemProps as AdapterMenuItemProps } from '../../MenuItem'
import { getComponentLevelCssVar, buildComponentCssVarPath, getComponentTextCssVar } from '../../../utils/cssVarNames'
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

  // Get selected/unselected colors from properties.colors (component-level, layer-specific)
  const selectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'background')
  const selectedTextVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'text')
  const selectedSupportingTextColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'supporting-text-color')
  const selectedLeadingIconColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'leading-icon-color')
  const selectedTrailingIconColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'trailing-icon-color')

  const unselectedBgVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'background')
  const unselectedTextVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'text')
  const unselectedSupportingTextColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'supporting-text-color')
  const unselectedLeadingIconColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'leading-icon-color')
  const unselectedTrailingIconColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'trailing-icon-color')

  // Resolve state-specific vars
  const finalBgVar = effectiveVariant === 'selected' ? selectedBgVar : unselectedBgVar
  const finalTextVar = effectiveVariant === 'selected' ? selectedTextVar : unselectedTextVar
  const finalSupportingTextColorVar = effectiveVariant === 'selected' ? selectedSupportingTextColorVar : unselectedSupportingTextColorVar
  const finalLeadingIconColorVar = effectiveVariant === 'selected' ? selectedLeadingIconColorVar : unselectedLeadingIconColorVar
  const finalTrailingIconColorVar = effectiveVariant === 'selected' ? selectedTrailingIconColorVar : unselectedTrailingIconColorVar

  // Get component-level properties
  const borderRadiusVar = getComponentLevelCssVar('MenuItem', 'border-radius')
  const minWidthVar = getComponentLevelCssVar('MenuItem', 'min-width')
  const maxWidthVar = getComponentLevelCssVar('MenuItem', 'max-width')
  const verticalPaddingVar = getComponentLevelCssVar('MenuItem', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('MenuItem', 'horizontal-padding')
  const iconTextGapVar = getComponentLevelCssVar('MenuItem', 'icon-text-gap')
  const textGapVar = getComponentLevelCssVar('MenuItem', 'text-gap')
  const leadingIconSizeVar = getComponentLevelCssVar('MenuItem', 'icon-leading-size')
  const trailingIconSizeVar = getComponentLevelCssVar('MenuItem', 'icon-trailing-size')

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

  // Get hover color and opacity from component-level UIKit tokens
  const unselectedHoverColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'hover-color')
  const unselectedHoverOpacityVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'hover-opacity')
  const selectedHoverColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'hover-color')
  const selectedHoverOpacityVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'hover-opacity')
  const hoverColorVar = effectiveVariant === 'selected' ? selectedHoverColorVar : unselectedHoverColorVar
  const hoverOpacityVar = effectiveVariant === 'selected' ? selectedHoverOpacityVar : unselectedHoverOpacityVar
  const disabledOpacityVar = getComponentLevelCssVar('MenuItem', 'disabled-opacity')

  // Read background color to check if it's null/transparent
  const finalBgColorValue = readCssVar(finalBgVar)
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
          ['--menu-item-text' as string]: `var(${finalTextVar})`,
          ['--menu-item-border-radius' as string]: `var(${borderRadiusVar})`,
          ['--menu-item-min-width' as string]: `var(${minWidthVar})`,
          ['--menu-item-max-width' as string]: `var(${maxWidthVar})`,
          ['--menu-item-vertical-padding' as string]: `var(${verticalPaddingVar})`,
          ['--menu-item-horizontal-padding' as string]: `var(${horizontalPaddingVar})`,
          ['--menu-item-icon-text-gap' as string]: `var(${iconTextGapVar}, 8px)`,
          ['--menu-item-text-gap' as string]: `var(${textGapVar}, 4px)`,
          ['--menu-item-leading-icon-size' as string]: `var(${leadingIconSizeVar}, 20px)`,
          ['--menu-item-trailing-icon-size' as string]: `var(${trailingIconSizeVar}, 20px)`,
          ['--menu-item-leading-icon-color' as string]: `var(${finalLeadingIconColorVar})`,
          ['--menu-item-trailing-icon-color' as string]: `var(${finalTrailingIconColorVar})`,
          ['--menu-item-supporting-text-color' as string]: `var(${finalSupportingTextColorVar})`,
          ['--menu-item-opacity' as string]: disabled ? `var(${disabledOpacityVar})` : '1',
          ['--menu-item-hover-opacity' as string]: `var(${hoverOpacityVar}, 0.08)`, // Hover overlay opacity
          ['--menu-item-hover-color' as string]: `var(${hoverColorVar}, #000000)`, // Hover color
          // Apply text styles using CSS variables from text style toolbar
          fontFamily: fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
          fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
          fontWeight: fontWeightVar ? `var(${fontWeightVar})` : undefined,
          letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
          lineHeight: lineHeightVar ? `var(${lineHeightVar})` : undefined,
        } as React.CSSProperties}
        {...material}
        {...props}
      >
        {leadingIconType !== 'none' && (
          <span
            className="mui-menu-item-leading-icon"
            data-icon-type={leadingIconType}
            style={{
              width: `var(${leadingIconSizeVar}, 20px)`,
              height: `var(${leadingIconSizeVar}, 20px)`,
              minWidth: `var(${leadingIconSizeVar}, 20px)`,
              minHeight: `var(${leadingIconSizeVar}, 20px)`,
              maxWidth: `var(${leadingIconSizeVar}, 20px)`,
              maxHeight: `var(${leadingIconSizeVar}, 20px)`,
            } as React.CSSProperties}
          >
            {leadingIconType === 'radio' && !leadingIcon && (
              <span className={`mui-menu-item-radio-icon ${selected ? 'selected' : ''}`} />
            )}
            {leadingIconType === 'checkbox' && !leadingIcon && (
              <span className={`mui-menu-item-checkbox-icon ${selected ? 'selected' : ''}`} />
            )}
            {leadingIcon && <span className="mui-menu-item-custom-icon">{leadingIcon}</span>}
          </span>
        )}
        <div className="mui-menu-item-content">
          <span
            className="mui-menu-item-text"
            style={{
              textDecoration: textDecorationVar ? `var(${textDecorationVar})` : 'none',
              textTransform: textTransformVar ? `var(${textTransformVar})` : 'none',
              fontStyle: fontStyleVar ? `var(${fontStyleVar})` : 'normal',
            } as React.CSSProperties}
          >
            {children}
          </span>
          {supportingText && (
            <span
              className="mui-menu-item-supporting-text"
              style={{
                fontFamily: supportingFontFamilyVar ? `var(${supportingFontFamilyVar})` : undefined,
                fontSize: supportingFontSizeVar ? `var(${supportingFontSizeVar})` : undefined,
                fontWeight: supportingFontWeightVar ? `var(${supportingFontWeightVar})` : undefined,
                letterSpacing: supportingLetterSpacingVar ? `var(${supportingLetterSpacingVar})` : undefined,
                lineHeight: supportingLineHeightVar ? `var(${supportingLineHeightVar})` : undefined,
                textDecoration: supportingTextDecorationVar ? `var(${supportingTextDecorationVar})` : 'none',
                textTransform: supportingTextTransformVar ? `var(${supportingTextTransformVar})` : 'none',
                fontStyle: supportingFontStyleVar ? `var(${supportingFontStyleVar})` : 'normal',
              } as React.CSSProperties}
            >
              {supportingText}
            </span>
          )}
        </div>
        {(trailingIcon || selected) && (
          <span
            className="mui-menu-item-trailing-icon"
            style={{
              width: `var(${trailingIconSizeVar}, 20px)`,
              height: `var(${trailingIconSizeVar}, 20px)`,
              minWidth: `var(${trailingIconSizeVar}, 20px)`,
              minHeight: `var(${trailingIconSizeVar}, 20px)`,
              maxWidth: `var(${trailingIconSizeVar}, 20px)`,
              maxHeight: `var(${trailingIconSizeVar}, 20px)`,
            } as React.CSSProperties}
          >
            {trailingIcon || (selected && iconNameToReactComponent('check') ? React.createElement(iconNameToReactComponent('check')!) : (selected ? '✓' : null))}
          </span>
        )}
      </button>
      {divider === 'bottom' && (
        <div className="mui-menu-item-divider" />
      )}
    </div>
  )
}


