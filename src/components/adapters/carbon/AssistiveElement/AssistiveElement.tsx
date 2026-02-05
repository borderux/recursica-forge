/**
 * Carbon AssistiveElement Implementation
 * 
 * Carbon-specific AssistiveElement component that uses CSS variables for theming.
 * Uses native HTML elements since Carbon doesn't have a specific component for this.
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
  carbon,
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
  
  // Get text properties from component text property groups
  const textFontSizeVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-size')
  const textFontFamilyVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-family')
  const textFontWeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-weight')
  const textLetterSpacingVar = getComponentTextCssVar('AssistiveElement', 'text', 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'line-height')
  const textTextDecorationVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-decoration')
  const textTextTransformVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-transform')
  const textFontStyleVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-style')
  
  // State to force re-renders when CSS vars change (needed for text properties)
  const [, setUpdateKey] = useState(0)
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      textFontSizeVar, textFontFamilyVar, textFontWeightVar, textLetterSpacingVar,
      textLineHeightVar, textTextDecorationVar, textTextTransformVar, textFontStyleVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Update if any text CSS var was updated, or if no specific vars were mentioned (global update)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdate) {
        // Force re-render by updating state
        setUpdateKey(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text vars
      setUpdateKey(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      observer.disconnect()
    }
  }, [
    textFontSizeVar, textFontFamilyVar, textFontWeightVar, textLetterSpacingVar,
    textLineHeightVar, textTextDecorationVar, textTextTransformVar, textFontStyleVar
  ])
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: `var(${iconTextGapVar})`,
        marginTop: `var(${topMarginVar})`,
        ...style,
        ...carbon?.style,
      }}
      {...carbon}
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
          fontStyle: textFontStyleVar ? (readCssVar(textFontStyleVar) || 'normal') as any : 'normal',
          letterSpacing: textLetterSpacingVar ? `var(${textLetterSpacingVar})` : undefined,
          lineHeight: `var(${textLineHeightVar})`,
          textDecoration: (readCssVar(textTextDecorationVar) || 'none') as any,
          textTransform: (readCssVar(textTextTransformVar) || 'none') as any,
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
