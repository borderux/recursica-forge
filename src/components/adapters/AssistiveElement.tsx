/**
 * AssistiveElement Component Adapter
 * 
 * Unified AssistiveElement component that renders the appropriate library implementation
 * based on the current UI kit selection.
 * Used for help text and error text in forms.
 */

import { Suspense, useState, useEffect } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../core/css/readCssVar'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type AssistiveElementProps = {
  text: string
  variant?: 'help' | 'error'
  icon?: React.ReactNode
  layer?: ComponentLayer
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function AssistiveElement({
  text,
  variant = 'help',
  icon,
  layer = 'layer-0',
  className,
  style,
  mantine,
  material,
  carbon,
}: AssistiveElementProps) {
  const Component = useComponent('AssistiveElement')
  const { mode } = useThemeMode()
  
  // Get text CSS variables for reactive updates
  const textFontSizeVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-size')
  const textFontFamilyVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-family')
  const textFontWeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-weight')
  const textLetterSpacingVar = getComponentTextCssVar('AssistiveElement', 'text', 'letter-spacing')
  const textLineHeightVar = getComponentTextCssVar('AssistiveElement', 'text', 'line-height')
  const textTextDecorationVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-decoration')
  const textTextTransformVar = getComponentTextCssVar('AssistiveElement', 'text', 'text-transform')
  const textFontStyleVar = getComponentTextCssVar('AssistiveElement', 'text', 'font-style')
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      textFontSizeVar, textFontFamilyVar, textFontWeightVar, textLetterSpacingVar,
      textLineHeightVar, textTextDecorationVar, textTextTransformVar, textFontStyleVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Update if any text CSS var was updated
      const shouldUpdateText = !detail?.cssVars || detail.cssVars.some((cssVar: string) => textCssVars.includes(cssVar))
      
      if (shouldUpdateText) {
        // Force re-render by updating state
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    
    // Also watch for direct style changes using MutationObserver
    const observer = new MutationObserver(() => {
      // Force re-render for text vars
      setTextVarsUpdate(prev => prev + 1)
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
  
  // Get CSS variables for colors (variant-specific)
  const textColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', variant, 'properties', 'colors', layer, 'text-color')
  const iconColorVar = buildComponentCssVarPath('AssistiveElement', 'variants', 'types', variant, 'properties', 'colors', layer, 'icon-color')
  
  // Get CSS variables for size
  const iconSizeVar = getComponentLevelCssVar('AssistiveElement', 'icon-size')
  const iconTextGapVar = getComponentLevelCssVar('AssistiveElement', 'icon-text-gap')
  const topMarginVar = getComponentLevelCssVar('AssistiveElement', 'top-margin')
  
  if (!Component) {
    // Fallback to native HTML element
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: `var(${iconTextGapVar})`,
          marginTop: `var(${topMarginVar})`,
          ...style,
        }}
      >
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `var(${iconSizeVar})`,
              height: `var(${iconSizeVar})`,
              flexShrink: 0,
              color: `var(${iconColorVar})`,
            }}
          >
            {icon}
          </span>
        )}
        <span
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
  
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center' }}>{text}</div>}>
      <Component
        text={text}
        variant={variant}
        icon={icon}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
}
