/**
 * Mantine MenuItem Implementation
 * 
 * Mantine-specific MenuItem component that uses CSS variables for theming.
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

  // Get component-level dimension/size properties
  const borderRadiusVar = getComponentLevelCssVar('MenuItem', 'border-radius')
  const verticalPaddingVar = getComponentLevelCssVar('MenuItem', 'vertical-padding')
  const horizontalPaddingVar = getComponentLevelCssVar('MenuItem', 'horizontal-padding')
  const iconTextGapVar = getComponentLevelCssVar('MenuItem', 'icon-text-gap')
  const textGapVar = getComponentLevelCssVar('MenuItem', 'text-gap')
  const leadingIconSizeVar = getComponentLevelCssVar('MenuItem', 'icon-leading-size')
  const trailingIconSizeVar = getComponentLevelCssVar('MenuItem', 'icon-trailing-size')

  // Get text styling CSS variables
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

  // Get hover vars from state-level UIKit tokens (separate per selected/unselected)
  const unselectedHoverColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'hover-color')
  const unselectedHoverOpacityVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'unselected-item', 'hover-opacity')
  const selectedHoverColorVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'hover-color')
  const selectedHoverOpacityVar = buildComponentCssVarPath('MenuItem', 'properties', 'colors', layer, 'selected-item', 'hover-opacity')
  const hoverColorVar = effectiveVariant === 'selected' ? selectedHoverColorVar : unselectedHoverColorVar
  const hoverOpacityVar = effectiveVariant === 'selected' ? selectedHoverOpacityVar : unselectedHoverOpacityVar
  const disabledOpacityVar = getComponentLevelCssVar('MenuItem', 'disabled-opacity')

  // Determine background
  const finalBgColorValue = readCssVar(finalBgVar)
  const finalHasBackground = finalBgColorValue && finalBgColorValue !== 'transparent' && finalBgColorValue !== 'null'

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`mantine-menu-item ${effectiveVariant} ${className || ''}`}
      data-variant={effectiveVariant}
      data-layer={layer}
      data-selected={selected}
      data-disabled={disabled}
      data-leading-icon-type={leadingIconType}
      style={{
        ['--menu-item-bg' as string]: finalHasBackground ? `var(${finalBgVar})` : 'transparent',
        ['--menu-item-text' as string]: `var(${finalTextVar})`,
        ['--menu-item-border-radius' as string]: `var(${borderRadiusVar})`,
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
        ['--menu-item-hover-opacity' as string]: `var(${hoverOpacityVar}, 0.08)`,
        ['--menu-item-hover-color' as string]: `var(${hoverColorVar}, #000000)`,
        // Apply cascading-safe text styles on the button (these cascade cleanly to children)
        fontFamily: fontFamilyVar ? `var(${fontFamilyVar})` : undefined,
        fontSize: fontSizeVar ? `var(${fontSizeVar})` : undefined,
        fontWeight: fontWeightVar ? `var(${fontWeightVar})` : undefined,
        letterSpacing: letterSpacingVar ? `var(${letterSpacingVar})` : undefined,
        lineHeight: lineHeightVar ? `var(${lineHeightVar})` : undefined,
        ...style,
      } as React.CSSProperties}
      {...mantine}
      {...props}
    >
      {leadingIconType !== 'none' && (
        <span
          className="mantine-menu-item-leading-icon"
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
            <span className={`mantine-menu-item-radio-icon ${selected ? 'selected' : ''}`} />
          )}
          {leadingIconType === 'checkbox' && !leadingIcon && (
            <span className={`mantine-menu-item-checkbox-icon ${selected ? 'selected' : ''}`} />
          )}
          {leadingIcon && <span className="mantine-menu-item-custom-icon">{leadingIcon}</span>}
        </span>
      )}
      <div className="mantine-menu-item-content">
        <span
          className="mantine-menu-item-text"
          style={{
            textDecoration: textDecorationVar ? `var(${textDecorationVar})` : 'none',
            textTransform: textTransformVar ? `var(${textTransformVar})` : 'none',
            fontStyle: fontStyleVar ? `var(${fontStyleVar})` : 'normal',
          } as React.CSSProperties}
        >{children}</span>
        {supportingText && (
          <span
            className="mantine-menu-item-supporting-text"
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
          className="mantine-menu-item-trailing-icon"
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
  )
}
