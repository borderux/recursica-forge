/**
 * Material UI TextField Implementation
 * 
 * Material UI-specific TextField component that uses CSS variables for theming.
 * Uses native HTML elements since we're composing Label and AssistiveElement.
 */

import React, { useState, useEffect, useMemo } from 'react'
import type { TextFieldProps as AdapterTextFieldProps } from '../../TextField'
import { buildComponentCssVarPath, getComponentLevelCssVar, getComponentTextCssVar } from '../../../utils/cssVarNames'
import { useThemeMode } from '../../../../modules/theme/ThemeModeContext'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Label } from '../../Label'
import { AssistiveElement } from '../../AssistiveElement'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import './TextField.css'

export default function TextField({
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  helpText,
  errorText,
  leadingIcon,
  trailingIcon,
  state = 'default',
  layout = 'stacked',
  layer = 'layer-0',
  minWidth,
  required = false,
  id,
  labelId,
  helpId,
  errorId,
  name,
  type = 'text',
  className,
  style,
  material,
  ...props
}: AdapterTextFieldProps & { labelId?: string; helpId?: string; errorId?: string }) {
  const { mode } = useThemeMode()
  
  // Generate unique ID if not provided (needed for scoped styles)
  const uniqueId = id || `text-field-${Math.random().toString(36).substr(2, 9)}`
  
  // Determine effective state (focus is handled via CSS :focus)
  const effectiveState = state === 'focus' ? 'default' : state
  
  // Get CSS variables for colors based on state variant
  const backgroundVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'background')
  const borderVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'border-color')
  const textVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'text')
  const placeholderVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'placeholder')
  const leadingIconVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'leading-icon')
  const trailingIconVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'colors', layer, 'trailing-icon')
  
  // Get CSS variables for focus state border (when focused)
  const focusBorderVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'colors', layer, 'border-color')
  const focusBorderSizeVar = buildComponentCssVarPath('TextField', 'variants', 'states', 'focus', 'properties', 'border-size')
  
  // Get variant-specific border size
  const borderSizeVar = buildComponentCssVarPath('TextField', 'variants', 'states', effectiveState, 'properties', 'border-size')
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextField.tsx:65',message:'borderSizeVar computed',data:{state,effectiveState,borderSizeVar},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  // Get component-level properties
  const borderRadiusVar = getComponentLevelCssVar('TextField', 'border-radius')
  const minHeightVar = getComponentLevelCssVar('TextField', 'min-height')
  const horizontalPaddingVar = getComponentLevelCssVar('TextField', 'horizontal-padding')
  const verticalPaddingVar = getComponentLevelCssVar('TextField', 'vertical-padding')
  const iconSizeVar = getComponentLevelCssVar('TextField', 'icon-size')
  const iconTextGapVar = getComponentLevelCssVar('TextField', 'icon-text-gap')
  const maxWidthVar = getComponentLevelCssVar('TextField', 'max-width')
  const minWidthVar = getComponentLevelCssVar('TextField', 'min-width')
  const placeholderOpacityVar = getComponentLevelCssVar('TextField', 'placeholder-opacity')
  
  // Get text style CSS variables for value text
  const valueFontSizeVar = getComponentTextCssVar('TextField', 'value', 'font-size')
  const valueFontFamilyVar = getComponentTextCssVar('TextField', 'value', 'font-family')
  const valueFontWeightVar = getComponentTextCssVar('TextField', 'value', 'font-weight')
  const valueLetterSpacingVar = getComponentTextCssVar('TextField', 'value', 'letter-spacing')
  const valueLineHeightVar = getComponentTextCssVar('TextField', 'value', 'line-height')
  const valueTextDecorationVar = getComponentTextCssVar('TextField', 'value', 'text-decoration')
  const valueTextTransformVar = getComponentTextCssVar('TextField', 'value', 'text-transform')
  const valueFontStyleVar = getComponentTextCssVar('TextField', 'value', 'font-style')
  
  // Get text style CSS variables for placeholder text
  const placeholderFontSizeVar = getComponentTextCssVar('TextField', 'placeholder', 'font-size')
  const placeholderFontFamilyVar = getComponentTextCssVar('TextField', 'placeholder', 'font-family')
  const placeholderFontWeightVar = getComponentTextCssVar('TextField', 'placeholder', 'font-weight')
  const placeholderLetterSpacingVar = getComponentTextCssVar('TextField', 'placeholder', 'letter-spacing')
  const placeholderLineHeightVar = getComponentTextCssVar('TextField', 'placeholder', 'line-height')
  const placeholderTextDecorationVar = getComponentTextCssVar('TextField', 'placeholder', 'text-decoration')
  const placeholderTextTransformVar = getComponentTextCssVar('TextField', 'placeholder', 'text-transform')
  const placeholderFontStyleVar = getComponentTextCssVar('TextField', 'placeholder', 'font-style')
  
  // State to force re-renders when text CSS variables change
  const [, setTextVarsUpdate] = useState(0)
  
  // CRITICAL: Do NOT read CSS variable values here - use var() references directly in CSS.
  // The problem: When CSS variables aren't explicitly set, readCssVar() falls back to
  // computed styles which resolve through UIKit.json defaults. Since both 'value' and
  // 'placeholder' have the same defaults, they resolve to the same value initially.
  // Solution: Use CSS variable references (var(...)) directly in CSS. This ensures:
  // 1. Each CSS variable is independent
  // 2. When one is updated via toolbar, it doesn't affect the other
  // 3. CSS inheritance is prevented by using !important and high specificity selectors
  
  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar,
      valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar,
      placeholderFontSizeVar, placeholderFontFamilyVar, placeholderFontWeightVar, placeholderLetterSpacingVar,
      placeholderLineHeightVar, placeholderTextDecorationVar, placeholderTextTransformVar, placeholderFontStyleVar
    ]
    
    const dimensionCssVars = [
      borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar,
      iconSizeVar, iconTextGapVar, maxWidthVar, minWidthVar
    ]
    
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // #region agent log
      const borderSizeMatch = updatedVars.some((v: string) => {
        return borderSizeVar === v || v.includes(borderSizeVar.replace('--', '')) || borderSizeVar.replace('--', '').includes(v.replace('--', ''))
      })
      const borderSizeVarValue = typeof document !== 'undefined' ? document.documentElement.style.getPropertyValue(borderSizeVar) : 'N/A'
      fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextField.tsx:127',message:'cssVarsUpdated event received',data:{updatedVars,borderSizeVar,borderSizeVarValue,borderSizeMatch,effectiveState,state,allUpdatedVars:updatedVars},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      // Re-render if text CSS vars or dimension vars were updated, or if no specific vars were mentioned (global update)
      // Check for exact matches or if the updated var contains the var name (without -- prefix)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((v: string) => {
        return [...textCssVars, ...dimensionCssVars].some(tv => {
          const tvWithoutPrefix = tv.replace('--', '')
          return v === tv || v.includes(tvWithoutPrefix) || tvWithoutPrefix.includes(v.replace('--', ''))
        })
      })
      // #region agent log
      if (borderSizeMatch || updatedVars.length === 0) {
        fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextField.tsx:140',message:'should update check',data:{shouldUpdate,borderSizeMatch,dimensionCssVars},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
      }
      // #endregion
      if (shouldUpdate) {
        setTextVarsUpdate(prev => prev + 1)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    
    // Also watch for direct CSS variable changes using MutationObserver
    // This is needed because UIKit variables (like placeholder vars) are filtered out from cssVarsUpdated events
    const observer = new MutationObserver(() => {
      // Force re-render when CSS variables change
      setTextVarsUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      observer.disconnect()
    }
  }, [valueFontSizeVar, valueFontFamilyVar, valueFontWeightVar, valueLetterSpacingVar, valueLineHeightVar, valueTextDecorationVar, valueTextTransformVar, valueFontStyleVar, placeholderFontSizeVar, placeholderFontFamilyVar, placeholderFontWeightVar, placeholderLetterSpacingVar, placeholderLineHeightVar, placeholderTextDecorationVar, placeholderTextTransformVar, placeholderFontStyleVar, borderSizeVar, borderRadiusVar, minHeightVar, horizontalPaddingVar, verticalPaddingVar, iconSizeVar, iconTextGapVar, maxWidthVar, minWidthVar])
  
  // Get layout variant gap
  const labelFieldGapVar = buildComponentCssVarPath('TextField', 'variants', 'layouts', layout, 'properties', 'label-field-gap')
  
  // Use provided minWidth or fall back to CSS variable
  const effectiveMinWidth = minWidth !== undefined ? `${minWidth}px` : `var(${minWidthVar})`
  
  // Get placeholder opacity - use CSS variable directly, no fallback
  
  // Render Label component if provided
  const labelElement = label ? (
    <Label
      htmlFor={uniqueId}
      variant={required ? 'required' : 'default'}
      layout={layout}
      layer={layer}
      id={labelId}
      style={layout === 'side-by-side' ? { paddingTop: 0, alignItems: 'flex-start' } : undefined}
    >
      {label}
    </Label>
  ) : null
  
  // Get icon components for AssistiveElement
  const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
  const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])
  
  // Render AssistiveElement for help or error with icons
  const assistiveElement = errorText ? (
    <AssistiveElement
      text={errorText}
      variant="error"
      layer={layer}
      id={errorId}
      icon={ErrorIcon ? <ErrorIcon /> : <span>⚠</span>}
    />
  ) : helpText ? (
    <AssistiveElement
      text={helpText}
      variant="help"
      layer={layer}
      id={helpId}
      icon={HelpIcon ? <HelpIcon /> : <span>ℹ</span>}
    />
  ) : null
  
  // Input wrapper with icons
  const inputWrapper = (
    <div
      className="recursica-text-field-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `var(${iconTextGapVar}, 8px)`,
        width: '100%',
        paddingLeft: `var(${horizontalPaddingVar}, 12px)`,
        paddingRight: `var(${horizontalPaddingVar}, 12px)`,
        borderWidth: `var(${borderSizeVar})`,
        borderStyle: 'solid',
        borderColor: `var(${borderVar})`,
        borderRadius: `var(${borderRadiusVar})`,
        backgroundColor: `var(${backgroundVar})`,
        transition: 'border-color 0.2s, border-width 0.2s',
      }}
      // #region agent log
      data-debug-border-size-var={borderSizeVar}
      data-debug-state={state}
      data-debug-effective-state={effectiveState}
      // #endregion
    >
      {leadingIcon && (
        <div
          className="recursica-text-field-leading-icon"
          style={{
            width: `var(${iconSizeVar}, 20px)`,
            height: `var(${iconSizeVar}, 20px)`,
            flexShrink: 0,
            color: `var(${leadingIconVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {leadingIcon}
        </div>
      )}
      <input
        id={uniqueId}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        disabled={state === 'disabled'}
        readOnly={state === 'read-only'}
        className={`recursica-text-field-input ${className || ''}`}
        style={{
          flex: 1,
          minWidth: effectiveMinWidth,
          maxWidth: `var(${maxWidthVar})`,
          width: '100%',
          minHeight: `var(${minHeightVar})`,
          paddingTop: `var(${verticalPaddingVar})`,
          paddingBottom: `var(${verticalPaddingVar})`,
          border: 'none',
          backgroundColor: 'transparent',
          color: `var(${textVar})`,
          outline: 'none',
        } as React.CSSProperties}
        {...material}
        {...props}
      />
      {trailingIcon && (
        <div
          className="recursica-text-field-trailing-icon"
          style={{
            width: `var(${iconSizeVar}, 20px)`,
            height: `var(${iconSizeVar}, 20px)`,
            flexShrink: 0,
            color: `var(${trailingIconVar})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {trailingIcon}
        </div>
      )}
      <style>{`
        /* Value text styles - applied directly to input element - scoped to this instance */
        /* CRITICAL: These styles apply ONLY to the input value text, NOT the placeholder */
        /* Use CSS variable references directly - each variable is independent */
        #${uniqueId}.recursica-text-field-input {
          font-family: var(${valueFontFamilyVar}) !important;
          font-size: var(${valueFontSizeVar}) !important;
          font-weight: var(${valueFontWeightVar}) !important;
          letter-spacing: var(${valueLetterSpacingVar}) !important;
          line-height: var(${valueLineHeightVar}) !important;
          text-decoration: var(${valueTextDecorationVar}) !important;
          text-transform: var(${valueTextTransformVar}) !important;
          font-style: var(${valueFontStyleVar}) !important;
        }
        /* Placeholder styles - completely isolated from value styles - scoped to this instance */
        /* CRITICAL: These styles MUST override any inherited styles from the input element */
        /* Use multiple selectors to ensure maximum specificity and prevent inheritance */
        /* CRITICAL: Use CSS variable references directly - these are SEPARATE variables from value */
        #${uniqueId}.recursica-text-field-input::placeholder,
        #${uniqueId}.recursica-text-field-input::-webkit-input-placeholder,
        #${uniqueId}.recursica-text-field-input::-moz-placeholder,
        #${uniqueId}.recursica-text-field-input:-ms-input-placeholder {
          color: var(${placeholderVar}) !important;
          opacity: var(${placeholderOpacityVar}) !important;
          font-family: var(${placeholderFontFamilyVar}) !important;
          font-size: var(${placeholderFontSizeVar}) !important;
          font-weight: var(${placeholderFontWeightVar}) !important;
          letter-spacing: var(${placeholderLetterSpacingVar}) !important;
          line-height: var(${placeholderLineHeightVar}) !important;
          text-decoration: var(${placeholderTextDecorationVar}) !important;
          text-transform: var(${placeholderTextTransformVar}) !important;
          font-style: var(${placeholderFontStyleVar}) !important;
        }
        /* Additional rule to ensure placeholder never inherits value text styles */
        /* This uses even higher specificity to override any potential inheritance */
        input#${uniqueId}.recursica-text-field-input::placeholder,
        input#${uniqueId}.recursica-text-field-input::-webkit-input-placeholder,
        input#${uniqueId}.recursica-text-field-input::-moz-placeholder,
        input#${uniqueId}.recursica-text-field-input:-ms-input-placeholder {
          font-family: var(${placeholderFontFamilyVar}) !important;
          font-size: var(${placeholderFontSizeVar}) !important;
          font-weight: var(${placeholderFontWeightVar}) !important;
          letter-spacing: var(${placeholderLetterSpacingVar}) !important;
          line-height: var(${placeholderLineHeightVar}) !important;
          text-decoration: var(${placeholderTextDecorationVar}) !important;
          text-transform: var(${placeholderTextTransformVar}) !important;
          font-style: var(${placeholderFontStyleVar}) !important;
        }
        #${uniqueId}.recursica-text-field-input:focus {
          /* Focus styles are handled by wrapper */
        }
        .recursica-text-field-wrapper:has(#${uniqueId}:focus) {
          border-color: var(${focusBorderVar}) !important;
          border-width: var(${focusBorderSizeVar}) !important;
        }
      `}</style>
    </div>
  )
  
  // Render based on layout
  if (layout === 'side-by-side' && labelElement) {
    return (
      <div className={`recursica-text-field recursica-text-field-side-by-side ${className || ''}`} style={style}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: `var(${labelFieldGapVar}, 8px)`, width: '100%' }}>
          <div style={{ flexShrink: 0 }}>
            {labelElement}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: `var(${labelFieldGapVar}, 8px)` }}>
            {inputWrapper}
            {assistiveElement}
          </div>
        </div>
      </div>
    )
  }
  
  // Stacked layout (default)
  return (
    <div className={`recursica-text-field recursica-text-field-stacked ${className || ''}`} style={style}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${labelFieldGapVar}, 8px)`, width: '100%' }}>
        {labelElement}
        {inputWrapper}
        {assistiveElement}
      </div>
    </div>
  )
}
