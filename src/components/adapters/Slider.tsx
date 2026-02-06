/**
 * Slider Component Adapter
 * 
 * Unified Slider component that renders the appropriate library implementation
 * based on the current UI kit selection.
 */

import { Suspense, useState, useEffect, useRef } from 'react'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar, buildComponentCssVarPath, getFormCssVar, getComponentTextCssVar } from '../utils/cssVarNames'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Label } from './Label'
import { TextField } from './TextField'
import { getTypographyCssVar, extractTypographyStyleName } from '../utils/typographyUtils'
import { getElevationBoxShadow, parseElevationValue, getBrandStateCssVar } from '../utils/brandCssVars'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type SliderProps = {
  value: number | [number, number]
  onChange: (value: number | [number, number]) => void
  onChangeCommitted?: (value: number | [number, number]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  layout?: 'stacked' | 'side-by-side'
  layer?: ComponentLayer
  label?: React.ReactNode
  showInput?: boolean
  showValueLabel?: boolean
  valueLabel?: string | ((value: number) => string)
  tooltipText?: string | ((value: number) => string)
  minLabel?: string
  maxLabel?: string
  showMinMaxLabels?: boolean
  readOnly?: boolean
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Slider({
  value,
  onChange,
  onChangeCommitted,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  layout = 'stacked',
  layer = 'layer-0',
  label,
  showInput = false,
  showValueLabel = false,
  valueLabel,
  tooltipText,
  minLabel,
  maxLabel,
  showMinMaxLabels = true,
  readOnly = false,
  className,
  style,
  mantine,
  material,
  carbon,
}: SliderProps) {
  const Component = useComponent('Slider')
  const { mode } = useThemeMode()
  
  const isRange = Array.isArray(value)
  const singleValue = isRange ? value[0] : value
  
  // Calculate tooltip text - call function if provided, otherwise use string directly
  let computedTooltipText: string | undefined
  try {
    if (tooltipText) {
      if (typeof tooltipText === 'function') {
        computedTooltipText = tooltipText(singleValue)
      } else {
        computedTooltipText = tooltipText
      }
    }
  } catch (error) {
    console.warn('Error calculating tooltip text:', error)
    computedTooltipText = undefined
  }
  
  // Get read-only value text styling CSS variables using getComponentTextCssVar (for text style toolbar)
  const readOnlyValueFontFamilyVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-family')
  const readOnlyValueFontSizeVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-size')
  const readOnlyValueFontWeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-weight')
  const readOnlyValueLetterSpacingVar = getComponentTextCssVar('Slider', 'read-only-value', 'letter-spacing')
  const readOnlyValueLineHeightVar = getComponentTextCssVar('Slider', 'read-only-value', 'line-height')
  const readOnlyValueTextDecorationVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-decoration')
  const readOnlyValueTextTransformVar = getComponentTextCssVar('Slider', 'read-only-value', 'text-transform')
  const readOnlyValueFontStyleVar = getComponentTextCssVar('Slider', 'read-only-value', 'font-style')
  
  // State to force re-render when text CSS variables change
  const [textVarsUpdate, setTextVarsUpdate] = useState(0)

  // Listen for CSS variable updates from the toolbar
  useEffect(() => {
    const textCssVars = [
      readOnlyValueFontFamilyVar, readOnlyValueFontSizeVar, readOnlyValueFontWeightVar, readOnlyValueLetterSpacingVar,
      readOnlyValueLineHeightVar, readOnlyValueTextDecorationVar, readOnlyValueTextTransformVar, readOnlyValueFontStyleVar
    ]
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      // Update if any text CSS var was updated, or if no specific vars were mentioned (global update)
      const shouldUpdate = updatedVars.length === 0 || updatedVars.some((cssVar: string) => textCssVars.includes(cssVar))
      if (shouldUpdate) {
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
    readOnlyValueFontFamilyVar, readOnlyValueFontSizeVar, readOnlyValueFontWeightVar, readOnlyValueLetterSpacingVar,
    readOnlyValueLineHeightVar, readOnlyValueTextDecorationVar, readOnlyValueTextTransformVar, readOnlyValueFontStyleVar
  ])
  
  if (!Component) {
    // Fallback to native input range
    const isRange = Array.isArray(value)
    const singleValue = isRange ? value[0] : value
    
    // Get CSS variables for colors
    const trackVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'track')
    const trackActiveVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'track-active')
    const thumbVar = buildComponentCssVarPath('Slider', 'properties', 'colors', layer, 'thumb')
    
    // Get CSS variables for sizes
    const trackHeightVar = getComponentLevelCssVar('Slider', 'track-height')
    const thumbSizeVar = getComponentLevelCssVar('Slider', 'thumb-size')
    const trackBorderRadiusVar = getComponentLevelCssVar('Slider', 'track-border-radius')
    const thumbBorderRadiusVar = getComponentLevelCssVar('Slider', 'thumb-border-radius')
    const thumbElevationVar = getComponentLevelCssVar('Slider', 'thumb-elevation')
    
    // Get Label's gutter for side-by-side layout (Label component manages spacing)
    const labelGutterVar = layout === 'side-by-side' 
      ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
      : null
    
    // Get input width and gap if showing input
    const inputWidthVar = getComponentLevelCssVar('Slider', 'input-width')
    const inputGapVar = getComponentLevelCssVar('Slider', 'input-gap')
    
    // Get disabled opacity CSS variable
    const disabledOpacityVar = getBrandStateCssVar(mode, 'disabled')
    
    // Reactively read thumb elevation from CSS variable
    const [thumbElevationFromVar, setThumbElevationFromVar] = useState<string | undefined>(() => {
      if (!thumbElevationVar) return undefined
      const value = readCssVar(thumbElevationVar)
      return value ? parseElevationValue(value) : undefined
    })
    
    // Force re-render when CSS variables change (including colors)
    const [, forceUpdate] = useState(0)
    
    // Get top-bottom-margin CSS variables for BOTH layout variants (needed for update listener)
    // We need to listen for updates to both variants regardless of current layout
    const topBottomMarginVarStacked = buildComponentCssVarPath('Slider', 'variants', 'layouts', 'stacked', 'properties', 'top-bottom-margin')
    const topBottomMarginVarSideBySide = buildComponentCssVarPath('Slider', 'variants', 'layouts', 'side-by-side', 'properties', 'top-bottom-margin')
    
    // Listen for CSS variable updates from the toolbar
    useEffect(() => {
      const handleCssVarUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail
        const updatedVars = detail?.cssVars || []
        
        // Check if any slider-related CSS vars were updated
        const sliderVars = [
          trackVar, trackActiveVar, thumbVar,
          trackHeightVar, thumbSizeVar, trackBorderRadiusVar, thumbBorderRadiusVar, thumbElevationVar,
          disabledOpacityVar, topBottomMarginVarStacked, topBottomMarginVarSideBySide
        ].filter(Boolean)
        
        // Check if top-bottom-margin was updated (for any layout variant)
        const topBottomMarginUpdated = updatedVars.length === 0 || updatedVars.some((v: string) => 
          v.includes('top-bottom-margin') || v === topBottomMarginVarStacked || v === topBottomMarginVarSideBySide
        )
        
        const shouldUpdate = updatedVars.length === 0 || updatedVars.some((v: string) => 
          sliderVars.some(sliderVar => v === sliderVar || v.includes('slider') || v.includes('track') || v.includes('thumb') || v.includes('state-disabled')) || topBottomMarginUpdated
        )
        
        if (shouldUpdate) {
          // Update thumb elevation if it changed
          if (thumbElevationVar && (!updatedVars.length || updatedVars.includes(thumbElevationVar))) {
            const value = readCssVar(thumbElevationVar)
            setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
          }
          
          // Force re-render to ensure colors and other CSS vars update
          requestAnimationFrame(() => {
            forceUpdate(prev => prev + 1)
          })
        }
      }
      
      window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.addEventListener('cssVarsReset', handleCssVarUpdate)
      
      // Also watch for direct style changes using MutationObserver
      const observer = new MutationObserver(() => {
        if (thumbElevationVar) {
          const value = readCssVar(thumbElevationVar)
          setThumbElevationFromVar(value ? parseElevationValue(value) : undefined)
        }
        // Force re-render on any style change
        requestAnimationFrame(() => {
          forceUpdate(prev => prev + 1)
        })
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
      })
      
      return () => {
        window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
        window.removeEventListener('cssVarsReset', handleCssVarUpdate)
        observer.disconnect()
      }
    }, [thumbElevationVar, trackVar, trackActiveVar, thumbVar, trackHeightVar, thumbSizeVar, trackBorderRadiusVar, thumbBorderRadiusVar, disabledOpacityVar, topBottomMarginVarStacked, topBottomMarginVarSideBySide, layout])
    
    // Determine thumb elevation from UIKit.json
    const thumbElevationBoxShadow = getElevationBoxShadow(mode, thumbElevationFromVar)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (isRange) {
        onChange([newValue, value[1]])
      } else {
        onChange(newValue)
      }
    }
    
    const sliderId = `slider-${Math.random().toString(36).substr(2, 9)}`
    const percentage = ((singleValue - min) / (max - min)) * 100
    
    // Read resolved values for thumb styling (CSS variables in template strings need resolved values)
    const thumbSizeValue = readCssVarResolved(thumbSizeVar) || readCssVar(thumbSizeVar) || '20px'
    const thumbColorValue = readCssVarResolved(thumbVar) || readCssVar(thumbVar) || '#000000'
    const thumbBorderRadiusValue = readCssVarResolved(thumbBorderRadiusVar) || readCssVar(thumbBorderRadiusVar) || '50%'
    const trackHeightValue = readCssVarResolved(trackHeightVar) || readCssVar(trackHeightVar) || '4px'
    const thumbElevationValue = thumbElevationBoxShadow || '0 1px 2px rgba(0, 0, 0, 0.15)'
    
    // Parse thumb size to calculate padding (account for thumb half-width on each side)
    const thumbSizeNum = parseFloat(thumbSizeValue) || 20
    const thumbSizeUnit = thumbSizeValue.replace(/[\d.-]/g, '') || 'px'
    const thumbHalfSize = `${thumbSizeNum / 2}${thumbSizeUnit}`
    
    // Use ref to measure container and calculate active track width
    const trackContainerRef = useRef<HTMLDivElement>(null)
    const [activeTrackWidth, setActiveTrackWidth] = useState<string>('0%')
    
    useEffect(() => {
      const updateActiveTrackWidth = () => {
        if (!trackContainerRef.current) return
        
        const containerWidth = trackContainerRef.current.offsetWidth
        const thumbWidthPx = thumbSizeNum
        
        // The thumb center is positioned at percentage% of the usable track width
        // Usable track width = containerWidth - thumbWidthPx
        // Thumb center position = thumbHalfSize + (percentage / 100) * (containerWidth - thumbWidthPx)
        // Active track should extend to thumb right edge = thumb center + thumbHalfSize
        const usableWidth = containerWidth - thumbWidthPx
        const thumbCenterPosition = (percentage / 100) * usableWidth
        const thumbRightEdge = thumbCenterPosition + thumbWidthPx
        
        // Convert to percentage of container width
        const activeTrackWidthPercent = (thumbRightEdge / containerWidth) * 100
        setActiveTrackWidth(`${activeTrackWidthPercent}%`)
      }
      
      updateActiveTrackWidth()
      
      // Update on resize
      const resizeObserver = new ResizeObserver(updateActiveTrackWidth)
      if (trackContainerRef.current) {
        resizeObserver.observe(trackContainerRef.current)
      }
      
      return () => {
        resizeObserver.disconnect()
      }
    }, [percentage, thumbSizeNum, singleValue])
    
    const sliderElement = (
      <div 
        ref={(el) => {
          // #region agent log
          if (el) {
            requestAnimationFrame(() => {
              const rect = el.getBoundingClientRect()
              const computedStyle = window.getComputedStyle(el)
              fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Slider.tsx:sliderElement',message:'sliderElement dimensions after layout',data:{width:rect.width,height:rect.height,computedWidth:computedStyle.width,computedFlex:computedStyle.flex,computedFlexGrow:computedStyle.flexGrow,parentWidth:el.parentElement?.getBoundingClientRect().width},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
            })
          }
          // #endregion
        }}
        style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: `var(${inputGapVar}, 8px)`, overflow: 'visible' }}>
        {/* Min value display */}
        {showMinMaxLabels && (
          <span style={{ 
            fontSize: 12, 
            color: `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-color)`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-high-emphasis, 0.7)`, 
            flexShrink: 0,
          }}>
            {minLabel ?? min}
          </span>
        )}
        <div 
          ref={(el) => {
            trackContainerRef.current = el
            // #region agent log
            if (el) {
              requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect()
                const computedStyle = window.getComputedStyle(el)
                fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Slider.tsx:trackContainer',message:'Track container dimensions after layout',data:{width:rect.width,height:rect.height,computedWidth:computedStyle.width,computedFlex:computedStyle.flex,parentWidth:el.parentElement?.getBoundingClientRect().width},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
              })
            }
            // #endregion
          }}
          style={{ 
            position: 'relative', 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            overflow: 'visible', 
            minWidth: 0,
          }}>
          {/* Track background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: thumbHalfSize,
            right: thumbHalfSize,
            height: `var(${trackHeightVar}, 4px)`,
            transform: 'translateY(-50%)',
            backgroundColor: `var(${trackVar})`,
            borderRadius: `var(${trackBorderRadiusVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1,
          }} />
          
          {/* Active track */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: activeTrackWidth,
            height: `var(${trackHeightVar}, 4px)`,
            transform: 'translateY(-50%)',
            backgroundColor: `var(${trackActiveVar})`,
            borderRadius: `var(${trackBorderRadiusVar})`,
            opacity: disabled ? `var(${disabledOpacityVar})` : 1,
          }} />
          
          {/* Slider input */}
          <input
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={singleValue}
            onChange={handleChange}
            disabled={disabled}
            title={computedTooltipText}
            style={{
              position: 'relative',
              width: '100%',
              height: `var(${thumbSizeVar}, 20px)`,
              margin: 0,
              padding: 0,
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              zIndex: 1,
            }}
            className={className}
          />
          
          {/* Custom thumb styling */}
          <style>{`
            #${sliderId}::-webkit-slider-thumb {
              appearance: none;
              -webkit-appearance: none;
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: ${thumbElevationValue};
              opacity: ${disabled ? `var(${disabledOpacityVar})` : 1};
              margin-top: calc(-1 * (${thumbSizeValue} - ${trackHeightValue}) / 2);
            }
            
            #${sliderId}::-moz-range-thumb {
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: ${thumbElevationValue};
              opacity: ${disabled ? `var(${disabledOpacityVar})` : 1};
            }
            
            #${sliderId}::-ms-thumb {
              width: ${thumbSizeValue};
              height: ${thumbSizeValue};
              border-radius: ${thumbBorderRadiusValue};
              background: ${thumbColorValue};
              border: none;
              cursor: ${disabled ? 'not-allowed' : 'pointer'};
              box-shadow: ${thumbElevationValue};
              opacity: ${disabled ? `var(${disabledOpacityVar})` : 1};
            }
            
            #${sliderId}::-webkit-slider-runnable-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
            }
            
            #${sliderId}::-moz-range-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
            }
            
            #${sliderId}::-ms-track {
              width: 100%;
              height: ${trackHeightValue};
              background: transparent;
              border: none;
              color: transparent;
            }
          `}</style>
        </div>
        {/* Max value display */}
        {showMinMaxLabels && (
          <span style={{ 
            fontSize: 12, 
            color: `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-color)`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-high-emphasis, 0.7)`, 
            flexShrink: 0,
          }}>
            {maxLabel ?? max}
          </span>
        )}
        
        {/* Value label (when showValueLabel is true and no input) */}
        {showValueLabel && !showInput && (
          <span style={{ 
            fontSize: 12, 
            color: `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-color)`,
            opacity: disabled ? `var(${disabledOpacityVar})` : `var(--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-high-emphasis, 0.7)`, 
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            {valueLabel ? (typeof valueLabel === 'function' ? valueLabel(singleValue) : valueLabel) : singleValue}
          </span>
        )}
        
        {/* Input field */}
        {showInput && (
          <TextField
            type="number"
            min={min}
            max={max}
            step={step}
            value={singleValue}
            onChange={(e) => {
              if (!readOnly) {
                const newValue = Number(e.target.value)
                if (!isNaN(newValue)) {
                  const clampedValue = Math.max(min, Math.min(max, newValue))
                  if (isRange) {
                    onChange([clampedValue, value[1]])
                  } else {
                    onChange(clampedValue)
                  }
                }
              }
            }}
            state={disabled ? 'disabled' : 'default'}
            readOnly={readOnly}
            layer="layer-0"
            style={{
              width: `var(${inputWidthVar}, 60px)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            }}
          />
        )}
      </div>
    )
    
    // Calculate the width of the max value display to align value label above it
    const maxValueWidth = 30 // Approximate width for max value display
    
    if (layout === 'side-by-side' && label) {
      // For side-by-side, use Label's gutter property
      const gapValue = labelGutterVar ? `var(${labelGutterVar})` : '8px'
      // topBottomMarginVar is already declared at the top level
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: gapValue, 
          width: '100%', 
          marginTop: `var(${topBottomMarginVar})`,
          marginBottom: `var(${topBottomMarginVar})`,
          ...style 
        }}>
          <div style={{ flexShrink: 0, minWidth: 100, width: 100 }}>
            {label}
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex',
            alignItems: 'center',
          }}>
            {sliderElement}
          </div>
        </div>
      )
    }
    
    // For stacked layout, Label's bottom-padding handles the spacing, so no gap needed
    // topBottomMarginVar is already declared at the top level
    // Extract flex and flexGrow from style prop if present, but always ensure flexGrow is 1
    const { flex, flexGrow: styleFlexGrow, ...restStyle } = style || {}
    const wrapperStyle = {
      display: 'flex', 
      flexDirection: 'column', 
      marginTop: `var(${topBottomMarginVar})`,
      marginBottom: `var(${topBottomMarginVar})`,
      minWidth: 0,
      ...restStyle,
      // Always set flexGrow to 1, overriding any value from style prop
      flexGrow: 1,
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Slider.tsx:wrapper',message:'Wrapper style object',data:{wrapperStyle,hasFlexGrow:wrapperStyle.flexGrow!==undefined,flexGrowValue:wrapperStyle.flexGrow,styleProp:style},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return (
      <div 
        ref={(el) => {
          // #region agent log
          if (el) {
            requestAnimationFrame(() => {
              const rect = el.getBoundingClientRect()
              const computedStyle = window.getComputedStyle(el)
              fetch('http://127.0.0.1:7242/ingest/d16cd3f3-655c-4e29-8162-ad6e504c679e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Slider.tsx:wrapper',message:'Slider wrapper dimensions after layout',data:{width:rect.width,height:rect.height,computedWidth:computedStyle.width,computedFlex:computedStyle.flex,computedFlexGrow:computedStyle.flexGrow,inlineFlexGrow:el.style.flexGrow},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
            })
          }
          // #endregion
        }}
        style={{
          ...wrapperStyle,
          flexGrow: 1,
        }}>
        {label && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label}
          </div>
        )}
        {sliderElement}
      </div>
    )
  }
  
  // Calculate display value - call function if provided, otherwise use value directly
  let displayValue: string | number | undefined
  try {
    if (valueLabel) {
      if (typeof valueLabel === 'function') {
        displayValue = valueLabel(singleValue)
      } else {
        displayValue = valueLabel
      }
    } else {
      displayValue = singleValue
    }
  } catch (error) {
    console.warn('Error calculating value label:', error)
    displayValue = singleValue
  }
  // Ensure displayValue is always a non-empty string for rendering
  const displayValueStr = (displayValue !== undefined && displayValue !== null && String(displayValue).trim() !== '') 
    ? String(displayValue).trim() 
    : (singleValue !== undefined && singleValue !== null ? String(singleValue) : '—')
  
  // Calculate the width of the max value display to align value label above it
  const maxValueWidth = 30 // Approximate width for max value display
  
  // When showValueLabel is true, we handle the label row ourselves to avoid duplicates
  // and to position the value label correctly
  const shouldHandleLabelRow = showValueLabel && label
  
  const sliderComponent = (
    <Suspense fallback={<div style={{ width: '100%', height: 20 }} />}>
      <Component
        value={value}
        onChange={onChange}
        onChangeCommitted={onChangeCommitted}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        layout={layout}
        layer={layer}
        label={shouldHandleLabelRow ? undefined : label}
        showInput={showInput}
        showValueLabel={false}
        valueLabel={valueLabel}
        tooltipText={computedTooltipText}
        minLabel={minLabel}
        maxLabel={maxLabel}
        showMinMaxLabels={showMinMaxLabels}
        readOnly={readOnly}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      />
    </Suspense>
  )
  
  // Get top-bottom-margin from layout variant (defined early so it can be used in all return paths)
  const topBottomMarginVar = buildComponentCssVarPath('Slider', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')
  
  // Force re-render when top-bottom-margin CSS variable changes
  const [, forceMarginUpdate] = useState(0)
  
  useEffect(() => {
    const handleMarginUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars || []
      if (updatedVars.length === 0 || updatedVars.some((v: string) => v === topBottomMarginVar || v.includes('top-bottom-margin'))) {
        forceMarginUpdate(prev => prev + 1)
      }
    }
    
    window.addEventListener('cssVarsUpdated', handleMarginUpdate)
    const observer = new MutationObserver(() => {
      forceMarginUpdate(prev => prev + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      window.removeEventListener('cssVarsUpdated', handleMarginUpdate)
      observer.disconnect()
    }
  }, [topBottomMarginVar, layout])
  
  // Get Label's gutter for side-by-side layout (Label component manages spacing)
  const labelGutterVarForLibrary = layout === 'side-by-side'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'side-by-side', 'properties', 'gutter')
    : null
  
  // Get Label's bottom-padding for stacked layout to match spacing
  const labelBottomPaddingVar = layout === 'stacked'
    ? buildComponentCssVarPath('Label', 'variants', 'layouts', 'stacked', 'properties', 'bottom-padding')
    : null
  
  // Render value label using Label component to match label styling
  // Always show the value label when showValueLabel is true
  // Ensure we always have a non-empty value to display
  const finalDisplayValue = (displayValueStr && displayValueStr.trim() !== '') 
    ? displayValueStr 
    : (singleValue !== undefined && singleValue !== null ? String(singleValue) : '0')

  // Use layer text color directly for value labels
  const layerTextColorVar = `--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-color`
  const layerTextEmphasisVar = `--recursica-brand-themes-${mode}-layer-${layer}-property-element-text-high-emphasis`
  
  const valueLabelElement = showValueLabel ? (
    <span
      style={{ 
        flexShrink: 1,
        whiteSpace: 'nowrap',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontFamily: readOnlyValueFontFamilyVar ? `var(${readOnlyValueFontFamilyVar})` : undefined,
        fontSize: readOnlyValueFontSizeVar ? `var(${readOnlyValueFontSizeVar})` : undefined,
        fontWeight: readOnlyValueFontWeightVar ? `var(${readOnlyValueFontWeightVar})` : undefined,
        letterSpacing: readOnlyValueLetterSpacingVar ? `var(${readOnlyValueLetterSpacingVar})` : undefined,
        lineHeight: readOnlyValueLineHeightVar ? `var(${readOnlyValueLineHeightVar})` : undefined,
        textDecoration: readOnlyValueTextDecorationVar ? (readCssVar(readOnlyValueTextDecorationVar) || 'none') : 'none',
        textTransform: readOnlyValueTextTransformVar ? (readCssVar(readOnlyValueTextTransformVar) || 'none') : 'none',
        fontStyle: readOnlyValueFontStyleVar ? (readCssVar(readOnlyValueFontStyleVar) || 'normal') : 'normal',
        color: `var(${layerTextColorVar})`,
        opacity: disabled ? 0.5 : `var(${layerTextEmphasisVar})`,
        textAlign: 'right',
        paddingBottom: labelBottomPaddingVar ? `var(${labelBottomPaddingVar})` : undefined,
      } as React.CSSProperties}
    >
      {finalDisplayValue}
    </span>
  ) : null
  
  // When using library components, they handle their own label rendering
  // We only override this when showValueLabel is true to position the value label correctly
  // So we should NOT wrap with additional label rendering when shouldHandleLabelRow is false
  if (!shouldHandleLabelRow) {
    // Let the library component handle label rendering
    // Apply top-bottom-margin wrapper (forceMarginUpdate hook above ensures re-render on CSS var change)
    return (
      <div style={{ 
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
        flexGrow: 1,
        minWidth: 0,
        ...style,
      }}>
        {sliderComponent}
      </div>
    )
  }
  
  // When layout is side-by-side, always let the Component handle it
  // This ensures proper side-by-side rendering regardless of showValueLabel
  if (layout === 'side-by-side' && label && Component) {
    return (
      <div style={{ 
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
        flexGrow: 1,
        minWidth: 0,
        ...style,
      }}>
        <Suspense fallback={<div style={{ width: '100%', height: 20 }} />}>
          <Component
            value={value}
            onChange={onChange}
            onChangeCommitted={onChangeCommitted}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            layout={layout}
            layer={layer}
            label={label}
            showInput={showInput}
            showValueLabel={showValueLabel}
            valueLabel={valueLabel}
            tooltipText={tooltipText}
            minLabel={minLabel}
            maxLabel={maxLabel}
            showMinMaxLabels={showMinMaxLabels}
            className={className}
            style={style}
            mantine={mantine}
            material={material}
            carbon={carbon}
          />
        </Suspense>
      </div>
    )
  }
  
  // For stacked layout, Label's bottom-padding handles the spacing, so no gap needed
  const gapValueForLibrary = labelGutterVarForLibrary ? `var(${labelGutterVarForLibrary})` : '0px'
  
  // When Component is not null, sliderComponent wraps it but has showValueLabel={false}
  // So we need to render the value label ourselves in the label row
  // When Component is null, we return early in the fallback block, so sliderElement is used
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: gapValueForLibrary, 
      width: '100%', 
      minWidth: 0,
      marginTop: `var(${topBottomMarginVar})`,
      marginBottom: `var(${topBottomMarginVar})`,
      flexGrow: 1,
      ...style,
      flexGrow: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{label}</div>
        {valueLabelElement}
      </div>
      {sliderComponent}
    </div>
  )
}
