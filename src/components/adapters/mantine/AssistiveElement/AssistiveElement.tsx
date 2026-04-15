/**
 * Mantine AssistiveElement Implementation
 * 
 * Mantine-specific AssistiveElement component that uses CSS variables for theming.
 * Uses native HTML elements since Mantine doesn't have a specific component for this.
 */

import React, { useState, useEffect } from 'react'
import type { AssistiveElementProps as AdapterAssistiveElementProps } from '../../AssistiveElement'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import './AssistiveElement.css'

export default function AssistiveElement({
  text,
  variant = 'help',
  icon,
  layer = 'layer-0',
  className,
  style,
  mantine,
  ...props
}: AdapterAssistiveElementProps) {
  const { mode } = useThemeMode()
  
  // Get CSS variables for colors (variant-specific)
  const textColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', variant, 'properties', 'colors', layer, 'text-color')
  const iconColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', variant, 'properties', 'colors', layer, 'icon-color')
  
  // Get CSS variables for size
  const iconSizeVar = getComponentLevelCssVar('AssistiveElement', 'icon-size')
  const iconTextGapVar = getComponentLevelCssVar('AssistiveElement', 'icon-text-gap')
  const topMarginVar = getComponentLevelCssVar('AssistiveElement', 'top-margin')
  const maxWidthVar = getComponentLevelCssVar('AssistiveElement', 'max-width')
  
  // Get text properties from component text property groups
  const textFontSizeVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-size')
  const textFontFamilyVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-family')
  const textFontWeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-weight')
  const textLetterSpacingVar = getComponentTextCssVar('AssistiveElement', 'text', 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'line-height')
  const textTextDecorationVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-decoration')
  const textTextTransformVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-transform')
  const textFontStyleVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-style')
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: `var(${iconTextGapVar})`,
        marginTop: `var(${topMarginVar})`,
        maxWidth: `var(${maxWidthVar})`,
        ...style,
        ...mantine?.style,
      }}
      {...mantine}
      {...props}
    >
      {icon && (
        <span
          className="recursica-assistive-element-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `var(${iconSizeVar})`,
            height: `var(${iconSizeVar})`,
            minWidth: `var(${iconSizeVar})`,
            minHeight: `var(${iconSizeVar})`,
            flexShrink: 0,
            color: `var(${iconColorVar})`,
          }}
        >
          {icon}
        </span>
      )}
      <span
        className="recursica-assistive-element-text"
        style={{
          color: `var(${textColorVar})`,
          fontSize: `var(${textFontSizeVar})`,
          fontFamily: `var(${textFontFamilyVar})`,
          fontWeight: `var(${textFontWeightVar})`,
          fontStyle: textFontStyleVar ? `var(${textFontStyleVar})` as any : 'normal',
          letterSpacing: textLetterSpacingVar ? `var(${textLetterSpacingVar})` : undefined,
          lineHeight: `var(${textLineHeightVar})`,
          textDecoration: textTextDecorationVar ? `var(${textTextDecorationVar})` as any : 'none',
          textTransform: textTextTransformVar ? `var(${textTextTransformVar})` as any : 'none',
          minWidth: 0,
          flex: '1 1 0%',
          minHeight: `var(${iconSizeVar})`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {text}
      </span>
    </div>
  )
}
