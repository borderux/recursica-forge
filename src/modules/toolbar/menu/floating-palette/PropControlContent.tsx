import { getVarsStore } from '../../../../core/store/varsStore'
// Extract the rendering logic from PropControl for use in accordions
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import {
  parseComponentStructure,
  getComponentCssVarsForVariants,
  getDimensionPropertyType,
  getDimensionCategoryFromValue,
  type ComponentProp,
  toSentenceCase,
  pathMatchesVariant
} from '../../utils/componentToolbarUtils'
import { getPropLabel, getGroupedProps, getPropConfig, type ToolbarPropConfig } from '../../utils/loadToolbarConfig'
import { readCssVar, readCssVarResolved } from '../../../../core/css/readCssVar'
import { updateCssVar } from '../../../../core/css/updateCssVar'
import PaletteColorControl from '../../../forms/PaletteColorControl'
import DimensionTokenSelector from '../../../components/DimensionTokenSelector'
import { useVars } from '../../../vars/VarsContext'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { buildComponentCssVarPath, getGlobalCssVar } from '../../../../components/utils/cssVarNames'
import type { ComponentName } from '../../../../components/registry/types'
import OpacitySelector from './OpacitySelector'
import { Slider } from '../../../../components/adapters/Slider'
import { Label } from '../../../../components/adapters/Label'
import OpacitySlider from '../../utils/OpacitySlider'
import TextStyleToolbar from '../text-style/TextStyleToolbar'
import BorderGroupToolbar from '../border-group/BorderGroupToolbar'
import PaddingGroupToolbar from '../padding-group/PaddingGroupToolbar'
import WidthGroupToolbar from '../width-group/WidthGroupToolbar'
import ElevationToolbar from '../elevation/ElevationToolbar'
import BackgroundToolbar from '../background/BackgroundToolbar'
import IconGroupToolbar from '../icon-group/IconGroupToolbar'
import TopBottomMarginToolbar from '../top-bottom-margin-group/TopBottomMarginToolbar'
import BrandDimensionSliderInline from '../../utils/BrandDimensionSliderInline'
import { SegmentedControl } from '../../../../components/adapters/SegmentedControl'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import { useCssVar, useRawCssVar } from '../../../../components/hooks/useCssVar'
import { Dropdown } from '../../../../components/adapters/Dropdown'
import type { ComponentLayer } from '../../../../components/registry/types'
import uikitJson from '../../../../../recursica_ui-kit.json'
import { parseBrandCssVar } from '../../../../core/css/cssVarBuilder'
import { useGlobalRefControl } from '../../../../core/css/globalRefInterceptor'
import './PropControl.css'

// Helper to format dimension label from key
const formatDimensionLabel = (key: string): string => {
  if (key === 'default') return 'Default'
  if (key === 'none') return 'None'
  if (key === '2xl') return '2Xl'
  if (key === 'horizontal') return 'Horizontal'
  if (key === 'vertical') return 'Vertical'

  const sizeMap: Record<string, string> = {
    'xs': 'Xs',
    'sm': 'Sm',
    'md': 'Md',
    'lg': 'Lg',
    'xl': 'Xl',
  }
  if (sizeMap[key]) return sizeMap[key]

  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Segmented control that reads/writes a CSS var - re-renders when the var changes */
function SegmentedControlFromCssVar({
  primaryVar,
  cssVars,
  label,
  options,
}: {
  primaryVar: string
  cssVars: string[]
  label: string
  options: Array<string | { value: string; icon?: string }>
}) {
  const { uikit } = useVars()
  const globalRef = useGlobalRefControl(primaryVar, uikit)

  const firstValue = typeof options[0] === 'string' ? options[0] : options[0]?.value ?? ''
  const currentValue = useRawCssVar(primaryVar, firstValue)
  const cleanValue = (typeof currentValue === 'string' ? currentValue : String(currentValue)).trim().replace(/^["']|["']$/g, '') || firstValue
  const items = options.map((opt) => {
    // Normalize: options can be plain strings or { value, icon } objects
    const optValue = typeof opt === 'string' ? opt : opt.value
    const optIcon = typeof opt === 'string' ? undefined : opt.icon
    const IconComp = optIcon ? iconNameToReactComponent(optIcon) : null
    return {
      value: optValue,
      icon: IconComp ? React.createElement(IconComp, { size: 16 }) : undefined,
      tooltip: optValue ? optValue.charAt(0).toUpperCase() + optValue.slice(1) : '',
    }
  })
  return (
    <div>
      <Label layer="layer-3" layout="stacked" editIcon={globalRef.editIcon} onEditIconClick={globalRef.handleGlobeClick} editIconTitle={globalRef.editIconTitle}>{label}</Label>
      <SegmentedControl
        items={items}
        value={cleanValue}
        onChange={(value) => {
          cssVars.forEach((v) => updateCssVar(v, value, undefined, false, true))
        }}
        layer="layer-1"
        showLabel={false}
      />
    </div>
  )
}

/** Pixel slider for properties that use raw px values instead of tokens */
function PixelValueSlider({
  primaryVar,
  cssVars,
  label,
  minPixelValue,
  maxPixelValue,
}: {
  primaryVar: string
  cssVars: string[]
  label: string
  minPixelValue: number
  maxPixelValue: number
}) {
  const { uikit } = useVars()
  const globalRef = useGlobalRefControl(primaryVar, uikit)

  const [value, setValue] = useState(() => {
    const currentValue = readCssVar(primaryVar)
    const resolvedValue = readCssVarResolved(primaryVar)
    const valueStr = resolvedValue || currentValue || `${minPixelValue}px`
    const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
    return match ? Math.max(minPixelValue, Math.min(maxPixelValue, parseFloat(match[1]))) : minPixelValue
  })

  useEffect(() => {
    const handleUpdate = () => {
      const currentValue = readCssVar(primaryVar)
      const resolvedValue = readCssVarResolved(primaryVar)
      const valueStr = resolvedValue || currentValue || `${minPixelValue}px`
      const match = valueStr.match(/^(-?\d+(?:\.\d+)?)(?:px)?$/i)
      if (match) {
        setValue(Math.max(minPixelValue, Math.min(maxPixelValue, parseFloat(match[1]))))
      } else {
        setValue(minPixelValue)
      }
    }
    window.addEventListener('cssVarsUpdated', handleUpdate)
    window.addEventListener('cssVarsReset', handleUpdate)
    return () => {
      window.removeEventListener('cssVarsUpdated', handleUpdate)
      window.removeEventListener('cssVarsReset', handleUpdate)
    }
  }, [primaryVar, minPixelValue, maxPixelValue])

  const updateCssVars = useCallback((clampedValue: number) => {
    const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
    cssVarsToUpdate.forEach(cssVar => {
      updateCssVar(cssVar, `${clampedValue}px`)
    })

    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: cssVarsToUpdate }
    }))
  }, [cssVars, primaryVar])

  const handleChange = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, numValue))
    setValue(clampedValue)
    const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
    cssVarsToUpdate.forEach(cssVar => {
      document.documentElement.style.setProperty(cssVar, `${clampedValue}px`)
    })
  }

  const handleChangeCommitted = (newValue: number | [number, number]) => {
    const numValue = typeof newValue === 'number' ? newValue : newValue[0]
    const clampedValue = Math.max(minPixelValue, Math.min(maxPixelValue, numValue))
    const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
    cssVarsToUpdate.forEach(cssVar => {
      document.documentElement.style.setProperty(cssVar, `${clampedValue}px`)
    })
    updateCssVars(clampedValue)
  }

  const getValueLabel = useCallback((val: number) => {
    return `${Math.round(val)}px`
  }, [])

  return (
    <Slider
      value={value}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      min={minPixelValue}
      max={maxPixelValue}
      step={1}
      layer="layer-1"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      minLabel={`${minPixelValue}px`}
      maxLabel={`${maxPixelValue}px`}
      showMinMaxLabels={false}
      label={<Label layer="layer-1" layout="stacked" editIcon={globalRef.editIcon} onEditIconClick={globalRef.handleGlobeClick} editIconTitle={globalRef.editIconTitle}>{label}</Label>}
    />
  )
}

/** Dropdown that reads/writes a CSS var - re-renders when the var changes */
function DropdownFromCssVar({
  primaryVar,
  cssVars,
  label,
  options,
  layer = 'layer-1',
  defaultValue,
}: {
  primaryVar: string
  cssVars: string[]
  label: string
  options: Array<string | { label: string; value: string; icon?: string }>
  layer?: any
  defaultValue?: string
}) {
  const { uikit } = useVars()
  const globalRef = useGlobalRefControl(primaryVar, uikit)

  const currentValue = useRawCssVar(primaryVar, defaultValue ?? '')
  const fallback = defaultValue ?? (typeof options[0] === 'string' ? options[0] : options[0]?.value ?? '')
  let cleanValue = (typeof currentValue === 'string' ? currentValue : String(currentValue)).trim().replace(/^["']|["']$/g, '') || fallback

  // Reverse map typography CSS vars back to their token references so dropdown matches option value
  const typographyMatch = /var\(--recursica_brand_typography_([^)]+)/.exec(cleanValue)
  if (typographyMatch) {
    const style = typographyMatch[1].replace(/-font-size$/, '')
    cleanValue = `{brand.typography.${style}}`
  }

  const dropdownItems = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: toSentenceCase(opt) }
    }
    const IconComp = opt.icon ? iconNameToReactComponent(opt.icon) : null
    return {
      value: opt.value,
      label: opt.label,
      leadingIcon: IconComp ? <IconComp size={16} /> : undefined,
    }
  })

  return (
    <div style={{ marginBottom: '8px' }}>
      <Dropdown
        items={dropdownItems}
        value={cleanValue}
        onChange={(value) => {
          cssVars.forEach((v) => updateCssVar(v, value, undefined, false, true))
          // Dispatch event to notify components of CSS var updates
          window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
            detail: { cssVars }
          }))
        }}
        label={label}
        layer={layer as any}
        layout="stacked"
        disableTopBottomMargin={true}
        editIcon={globalRef.editIcon}
        onEditIconClick={globalRef.handleGlobeClick}
        editIconTitle={globalRef.editIconTitle}
      />
    </div>
  )
}



// Inline typography slider component
function TypographySliderInline({
  targetCssVar,
  targetCssVars = [],
  label,
  layer = 'layer-0',
}: {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const { theme, uikit } = useVars()
  const { mode } = useThemeMode()
  const globalRef = useGlobalRefControl(targetCssVar, uikit)

  // Build tokens list from text-size brand dimension tokens, sorted by font-size
  const tokens = useMemo(() => {
    const options: Array<{ name: string; label: string; fontSize: number; sizeKey: string }> = []

    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const textSizes = dimensions['text-size'] || {}

      // Collect all text-size tokens (2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl)
      Object.keys(textSizes).forEach(sizeKey => {
        if (sizeKey.startsWith('$')) return

        const sizeValue = textSizes[sizeKey]
        if (sizeValue && typeof sizeValue === 'object' && '$type' in sizeValue) {
          const cssVar = `--recursica_brand_dimensions_text-size_${sizeKey}`
          const cssValue = readCssVar(cssVar)

          if (cssValue) {
            const resolvedValue = readCssVarResolved(cssVar)
            let fontSize = 0

            if (resolvedValue) {
              const match = resolvedValue.match(/([\d.]+)(px|rem|em)/)
              if (match) {
                const value = parseFloat(match[1])
                const unit = match[2]

                if (unit === 'px') {
                  fontSize = value
                } else if (unit === 'rem' || unit === 'em') {
                  fontSize = value * 16
                }
              } else {
                const numMatch = resolvedValue.match(/([\d.]+)/)
                if (numMatch) {
                  fontSize = parseFloat(numMatch[1])
                }
              }
            }

            // Format label from size key (e.g., "2xs" -> "2Xs", "sm" -> "Sm")
            const formattedLabel = sizeKey === '2xs' ? '2Xs' :
              sizeKey === '2xl' ? '2Xl' :
                sizeKey === '3xl' ? '3Xl' :
                  sizeKey === '4xl' ? '4Xl' :
                    sizeKey === '5xl' ? '5Xl' :
                      sizeKey === '6xl' ? '6Xl' :
                        sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)

            options.push({
              name: cssVar,
              label: formattedLabel,
              fontSize,
              sizeKey,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error loading text-size tokens:', error)
      return []
    }

    // Sort by font-size from smallest to largest
    return options.sort((a, b) => a.fontSize - b.fontSize)
  }, [theme, mode])

  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)

  const extractTextSizeKey = useCallback((cssVarValue: string): string | null => {
    if (!cssVarValue) return null

    // Check for text-size dimension reference: {brand.dimensions.text-size.2xs}
    const braceMatch = cssVarValue.match(/\{brand\.dimensions\.text-size\.([^}]+)\}/)
    if (braceMatch) {
      return braceMatch[1].toLowerCase()
    }

    // Check for CSS variable using central parser
    const parsed = parseBrandCssVar(cssVarValue)
    if (parsed && parsed.type === 'dimension' && parsed.category === 'text-size') {
      return parsed.key.toLowerCase()
    }

    // Also check resolved value
    const resolved = readCssVarResolved(targetCssVar)
    if (resolved) {
      const resolvedBraceMatch = resolved.match(/\{brand\.dimensions\.text-size\.([^}]+)\}/)
      if (resolvedBraceMatch) {
        return resolvedBraceMatch[1].toLowerCase()
      }
      const resolvedParsed = parseBrandCssVar(resolved)
      if (resolvedParsed && resolvedParsed.type === 'dimension' && resolvedParsed.category === 'text-size') {
        return resolvedParsed.key.toLowerCase()
      }
    }

    return null
  }, [targetCssVar])

  const readInitialValue = useCallback(() => {
    const inlineValue = typeof document !== 'undefined'
      ? document.documentElement.style.getPropertyValue(targetCssVar).trim()
      : ''

    if (justSetValueRef.current === inlineValue) {
      return
    }

    const currentValue = inlineValue || readCssVar(targetCssVar)

    if (!currentValue) {
      const resolvedValue = readCssVarResolved(targetCssVar)
      if (!resolvedValue) {
        // Default to first token (usually smallest)
        setSelectedIndex(0)
        return
      }
    }

    const sizeKey = extractTextSizeKey(currentValue || readCssVarResolved(targetCssVar) || '')
    if (sizeKey) {
      const matchingIndex = tokens.findIndex(t => t.sizeKey === sizeKey)

      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
    }

    setSelectedIndex(0)
  }, [targetCssVar, tokens, extractTextSizeKey])

  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])

  useEffect(() => {
    const handleReset = () => {
      readInitialValue()
    }

    const handleCssVarUpdate = (event: CustomEvent) => {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      if (event.detail?.cssVars?.some((cv: string) => cssVars.includes(cv))) {
        setTimeout(() => {
          readInitialValue()
        }, 0)
      }
    }

    window.addEventListener('cssVarsReset', handleReset)
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => {
      window.removeEventListener('cssVarsReset', handleReset)
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [readInitialValue, targetCssVar, targetCssVars])

  const handleDrag = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)

    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      const tokenValue = `var(${selectedToken.name})`

      cssVars.forEach(cssVar => {
        document.documentElement.style.setProperty(cssVar, tokenValue)
      })
    }
  }

  const handleCommit = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)

    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const cssVars = targetCssVars.length > 0 ? targetCssVars : [targetCssVar]
      const tokenValue = `var(${selectedToken.name})`

      cssVars.forEach(cssVar => {
        updateCssVar(cssVar, tokenValue, undefined, false, true)
        justSetValueRef.current = tokenValue
        setTimeout(() => {
          justSetValueRef.current = null
        }, 100)
      })

      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars }
        }))
      })
    }
  }

  if (tokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }

  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tokens.length - 1))
  const currentToken = tokens[safeSelectedIndex]

  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  const minLabel = minToken?.label || '2Xs'
  const maxLabel = maxToken?.label || '6Xl'

  // Create a function that calculates the value label from the current slider value
  // This ensures it updates when the slider changes
  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    // Always return a non-empty string
    const label = token?.label || ''
    return label || String(index)
  }, [tokens])

  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleDrag}
      onChangeCommitted={handleCommit}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={currentToken?.label || String(safeSelectedIndex)}
      minLabel={minLabel}
      maxLabel={maxLabel}
      showMinMaxLabels={false}
      label={<Label layer={layer} layout="stacked" editIcon={globalRef.editIcon} onEditIconClick={globalRef.handleGlobeClick} editIconTitle={globalRef.editIconTitle}>{label}</Label>}
    />
  )
}

// Inline elevation slider component
function ElevationSliderInline({
  primaryVar,
  label,
  elevationOptions,
  mode,
  layer = 'layer-1',
}: {
  primaryVar: string
  label: string
  elevationOptions: Array<{ name: string; label: string }>
  mode: 'light' | 'dark'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const { uikit } = useVars()
  const globalRef = useGlobalRefControl(primaryVar, uikit)
  // Get current elevation value from CSS var
  // IMPORTANT: Only read from the mode-specific CSS variable - never fall back to other modes
  const getCurrentElevationName = useCallback((): string => {
    // Only check inline style for the current mode-specific CSS variable
    // Don't fall back to computed styles as they might cascade from other modes
    const inlineValue = typeof document !== 'undefined'
      ? document.documentElement.style.getPropertyValue(primaryVar).trim()
      : ''

    // If no inline value exists for this mode, return default (don't read computed as it might be from another mode)
    if (!inlineValue) {
      return 'elevation-0'
    }

    // Parse token reference format: {brand.themes.light.elevations.elevation-0}
    // Check if the token reference is for the correct mode
    const tokenMatch = inlineValue.match(/themes[._](light|dark)[._]elevations?[._](elevation-\d+)/i)
    if (tokenMatch) {
      const refMode = tokenMatch[1].toLowerCase() as 'light' | 'dark'
      const elevationName = tokenMatch[2]

      // If the token reference is for a different mode, ignore it and return default
      // This prevents reading light mode values when in dark mode
      if (refMode !== mode) {
        return 'elevation-0'
      }

      return elevationName
    }

    // Fallback: try to match without mode check (for backwards compatibility)
    const fallbackMatch = inlineValue.match(/elevations?[._](elevation-\d+)/i)
    if (fallbackMatch) {
      return fallbackMatch[1]
    }
    // Parse direct elevation name format: elevation-0
    if (/^elevation-\d+$/.test(inlineValue)) {
      return inlineValue
    }

    return 'elevation-0'
  }, [primaryVar, mode])

  const [currentElevationName, setCurrentElevationName] = useState(() => getCurrentElevationName())

  useEffect(() => {
    const newElevationName = getCurrentElevationName()
    setCurrentElevationName(newElevationName)
  }, [primaryVar, mode, getCurrentElevationName])

  useEffect(() => {
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.cssVars || detail.cssVars.includes(primaryVar)) {
        const newElevationName = getCurrentElevationName()
        setCurrentElevationName(newElevationName)
      }
    }
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    window.addEventListener('cssVarsReset', handleCssVarUpdate)
    return () => {
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
      window.removeEventListener('cssVarsReset', handleCssVarUpdate)
    }
  }, [primaryVar, getCurrentElevationName])

  // Convert elevation options to tokens array
  const tokens = useMemo(() => {
    return elevationOptions.map((opt, index) => ({
      name: opt.name,
      label: opt.label,
      index,
    }))
  }, [elevationOptions])

  // Find current index
  const currentIdx = tokens.findIndex(t => t.name === currentElevationName)
  const safeCurrentIdx = currentIdx >= 0 ? currentIdx : 0

  // Extract elevation number from token name
  const getElevationNumber = useCallback((token: typeof tokens[0] | undefined): number => {
    if (!token) return 0
    const match = token.name.match(/elevation-(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }, [])

  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    if (!token) return 'None'
    const elevationNum = getElevationNumber(token)
    return elevationNum === 0 ? 'None' : String(elevationNum)
  }, [tokens, getElevationNumber])

  const minToken = tokens[0]
  const maxToken = tokens[tokens.length - 1]
  const minElevationNum = getElevationNumber(minToken)
  const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)
  const maxElevationNum = getElevationNumber(maxToken)
  const maxLabel = String(maxElevationNum)

  const handleSliderChange = useCallback((value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(Math.round(numValue), tokens.length - 1))
    const selectedToken = tokens[clampedIndex]

    if (selectedToken) {
      const elevationValue = `{brand.themes.${mode}.elevations.${selectedToken.name}}`
      updateCssVar(primaryVar, elevationValue)
      setCurrentElevationName(selectedToken.name)

      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
          detail: { cssVars: [primaryVar] }
        }))
      })
    }
  }, [primaryVar, mode, tokens])

  if (tokens.length === 0) {
    return (
      <div style={{ padding: '8px', fontSize: 12, opacity: 0.7 }}>
        Loading tokens...
      </div>
    )
  }

  return (
    <Slider
      value={safeCurrentIdx}
      onChange={handleSliderChange}
      min={0}
      max={tokens.length - 1}
      step={1}
      type="discrete"
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      minLabel={minLabel}
      maxLabel={maxLabel}
      showMinMaxLabels={false}
      label={<Label layer={layer} layout="stacked" editIcon={globalRef.editIcon} onEditIconClick={globalRef.handleGlobeClick} editIconTitle={globalRef.editIconTitle}>{label}</Label>}
    />
  )
}

interface PropControlContentProps {
  prop: ComponentProp
  componentName: ComponentName
  selectedVariants: Record<string, string>
  selectedLayer: string
}

export default function PropControlContent({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
}: PropControlContentProps) {
  const { theme: themeJson } = useVars()
  const { mode } = useThemeMode()

  // Variant-specific variables
  const sizeVariant = selectedVariants.size || 'default'
  const layoutVariant = selectedVariants.layout || 'stacked'

  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const elev: any = themes?.[mode]?.elevations || root?.[mode]?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson, mode])

  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {

    // If the prop already has a CSS var and a path, use it directly to avoid mismatching
    // This is especially important for grouped props like "container" vs "selected"
    if (propToCheck.cssVar && propToCheck.path && propToCheck.path.length > 0) {
      // For grouped props, ensure we match the exact path
      // Check if this is a grouped prop by looking for "container" or "selected" in path
      const isGroupedProp = propToCheck.path.includes('container') || propToCheck.path.includes('selected') || propToCheck.path.includes('unselected') || propToCheck.path.includes('active') || propToCheck.path.includes('inactive') || propToCheck.path.includes('selected-item') || propToCheck.path.includes('unselected-item') || propToCheck.path.includes('thumb-selected') || propToCheck.path.includes('thumb-unselected') || propToCheck.path.includes('track-selected') || propToCheck.path.includes('track-unselected')
      if (isGroupedProp) {
        // Use the prop's CSS var directly to ensure we're updating the correct one
        return [propToCheck.cssVar]
      }
    }

    const structure = parseComponentStructure(componentName)

    // Special handling for Chip/Badge text-color: toolbar config uses "text-color" but recursica_ui-kit.json uses "text"
    const isTextColorMapping = (componentName.toLowerCase() === 'chip' || componentName.toLowerCase() === 'badge') &&
      propToCheck.name.toLowerCase() === 'text-color' &&
      propToCheck.category === 'colors'
      
    let targetPropName = propToCheck.name
    if (isTextColorMapping) {
      targetPropName = 'text'
    } else if (componentName.toLowerCase() === 'avatar' && propToCheck.name.toLowerCase() === 'text-color' && selectedVariants.style === 'icon') {
      // For Avatar in icon mode, if the UI still exposes "text-color", forcibly map it to "icon-color" to prevent logic breaking
      targetPropName = 'icon-color'
    }

    // For state-specific props (like border-size in TextField), prioritize matching the selected state
    // First, try to find a prop that matches the selected state variant
    let matchingProp = structure.props.find(p => {
      if (p.name !== targetPropName || p.category !== propToCheck.category) {
        return false
      }
      // For grouped props, ensure the path matches exactly
      if (propToCheck.path && propToCheck.path.length > 0) {
        const isGroupedProp = propToCheck.path.includes('container') || propToCheck.path.includes('selected') || propToCheck.path.includes('unselected') || propToCheck.path.includes('active') || propToCheck.path.includes('inactive') || propToCheck.path.includes('selected-item') || propToCheck.path.includes('unselected-item') || propToCheck.path.includes('thumb-selected') || propToCheck.path.includes('thumb-unselected') || propToCheck.path.includes('track-selected') || propToCheck.path.includes('track-unselected') || propToCheck.path.includes('thumb-selected') || propToCheck.path.includes('thumb-unselected') || propToCheck.path.includes('track-selected') || propToCheck.path.includes('track-unselected')
        if (isGroupedProp) {
          // Match the exact path segments for grouped props
          const propToCheckPathStr = propToCheck.path.join('/')
          const pPathStr = p.path.join('/')
          if (propToCheckPathStr !== pPathStr) {
            return false
          }
        }
      }
      // CRITICAL FIX: Check if prop path contains variant information - if so, MUST match selected variant
      // This handles cases where multiple variants have the same prop name (e.g., border-size for solid/outline/text)
      // Check if the prop being searched (p) has variant info in its path
      if (p.isVariantSpecific && p.variantProp) {
        const selectedVariant = selectedVariants[p.variantProp]
        if (!selectedVariant) {
          // If no variant is selected for this variantProp, don't match variant-specific props
          return false
        }
        if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) {
          // Prop is variant-specific but doesn't match selected variant - skip it
          return false
        }
      }
      // Also check propToCheck's variant requirements if it explicitly has them
      // This ensures we respect explicit variant requirements from the prop being checked
      if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
        const selectedVariant = selectedVariants[propToCheck.variantProp]
        if (!selectedVariant) return false
        if (!pathMatchesVariant(p.path, propToCheck.variantProp, selectedVariant)) return false
      }
      // Props under both style and orientation (e.g. tabs-content-gap under styles.pills.variants.orientation.horizontal)
      // must match BOTH selectedVariants.style and selectedVariants.orientation
      // Require path structure variants.styles.X.variants.orientation.Y (not variants.orientation which is component-level)
      const stylesIdx = p.path.indexOf('styles')
      const orientationIdx = p.path.indexOf('orientation')
      const hasStyleAndOrientationInPath = stylesIdx >= 0 && orientationIdx >= 0 && stylesIdx < orientationIdx
      if (hasStyleAndOrientationInPath) {
        if (selectedVariants.style && !p.path.includes(selectedVariants.style)) return false
        if (selectedVariants.orientation && !p.path.includes(selectedVariants.orientation)) return false
      }
      
      // CRITICAL FIX: Ensure deeply nested variants match their primary container variant.
      // For Avatar (or similar components), if evaluating a nested types prop (like solid),
      // we MUST also ensure the primary style (like icon or text) is present in the path.
      if (selectedVariants.style && stylesIdx >= 0) {
        if (!p.path.includes(selectedVariants.style)) return false
      }

      // Filter by layer for ANY prop that has layer-X in its path (not just colors)
      // This ensures Card borders (size category under borders.layer-X) are also filtered
      const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
      if (layerInPath) {
        if (layerInPath !== selectedLayer) return false
      }
      return true
    })

    // If no match found, try to find a prop matching the selected state variant
    // This handles cases where propToCheck might be from a different state but we need the selected state's prop
    // CRITICAL FIX: Also handle cases where propToCheck.name is wrong (e.g., "border" instead of "border-size")
    if (!matchingProp) {
      // Check if this is a TextField border-size lookup where propToCheck has wrong name
      const isTextFieldBorderSize = componentName === 'TextField' &&
        propToCheck.name === 'border' &&
        propToCheck.category === 'size' &&
        propToCheck.path && propToCheck.path.includes('border')

      const targetPropName = isTextFieldBorderSize ? 'border-size' : propToCheck.name
      const targetVariantProp = propToCheck.isVariantSpecific ? propToCheck.variantProp :
        (componentName === 'TextField' && targetPropName === 'border-size' ? 'states' : undefined)

      if (targetVariantProp) {
        const selectedVariant = selectedVariants[targetVariantProp]
        if (selectedVariant) {
          matchingProp = structure.props.find(p => {
            if (p.name !== targetPropName || p.category !== propToCheck.category) {
              return false
            }
            if (!p.isVariantSpecific || p.variantProp !== targetVariantProp) {
              return false
            }
            // Must have the selected variant in the path
            const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
            if (!variantInPath) return false

            // Filter by layer for ANY prop with layer in path
            const layerInPath = p.path.find(pathPart => pathPart.startsWith('layer-'))
            if (layerInPath && layerInPath !== selectedLayer) return false
            return true
          })
        }
      }
    }

    // If a content variant is selected (e.g., "label" or "icon-only"), prefer the
    // content-variant-specific prop over the sizes-level one. This ensures the toolbar
    // writes to the same CSS var that the preview component reads from.
    const selectedContent = selectedVariants.content
    if (selectedContent && matchingProp) {
      // Check if a more specific content-variant prop exists
      const contentSpecificProp = structure.props.find(p => {
        if (p.name !== matchingProp!.name || p.category !== matchingProp!.category) return false
        // Must have 'content' in the path with the selected content variant value
        if (!p.path.includes('content') || !p.path.includes(selectedContent)) return false
        // Must also match the selected size variant if applicable
        if (p.isVariantSpecific && p.variantProp) {
          const variantKey = p.variantProp === 'sizes' ? 'size' :
                             p.variantProp === 'styles' ? 'style' :
                             p.variantProp === 'layouts' ? 'layout' : p.variantProp
          const selectedVariant = selectedVariants[variantKey]
          if (selectedVariant && !p.path.includes(selectedVariant)) return false
        }
        return true
      })
      if (contentSpecificProp) {
        matchingProp = contentSpecificProp
      }
    }

    return matchingProp ? [matchingProp.cssVar] : [propToCheck.cssVar]
  }

  const baseCssVars = getCssVarsForProp(prop)
  let primaryCssVar = baseCssVars[0] || prop.cssVar
  let cssVarsForControl = baseCssVars

  // Special handling for MenuItem background: update all three background CSS variables
  // Component name can be "Menu item" (display name) or "MenuItem" (component name)
  const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' ||
    componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
    componentName === 'MenuItem'

  if (prop.name.toLowerCase() === 'height' && componentName.toLowerCase() === 'badge') {
    const minHeightVar = `--recursica_ui-kit_components_badge_size_variants_${sizeVariant}-min-height`
    primaryCssVar = minHeightVar
    cssVarsForControl = [minHeightVar]
  }

  if (prop.name.toLowerCase() === 'label-width' && componentName.toLowerCase() === 'label') {
    // Build CSS var path using buildComponentCssVarPath to include theme prefix
    const widthVar = buildComponentCssVarPath('Label', 'variants', 'layouts', layoutVariant, 'variants', 'sizes', sizeVariant, 'properties', 'width')
    primaryCssVar = widthVar
    cssVarsForControl = [widthVar]
  }

  const getContrastColorVar = (propToRender: ComponentProp): string | undefined => {
    const propName = propToRender.name.toLowerCase()
    const structure = parseComponentStructure(componentName)

    if (propName === 'text' || propName === 'text-hover') {
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background'
      const bgProp = structure.props.find(p =>
        p.name.toLowerCase() === bgPropName &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (bgProp) {
        const bgCssVars = getCssVarsForProp(bgProp)
        return bgCssVars[0]
      }
    }

    if (propName === 'background' || propName === 'background-hover') {
      const textPropName = propName === 'background-hover' ? 'text-hover' : 'text'
      const textProp = structure.props.find(p =>
        p.name.toLowerCase() === textPropName &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (textProp) {
        const textCssVars = getCssVarsForProp(textProp)
        return textCssVars[0]
      }
    }

    if (propName === 'track-selected' || propName === 'track-unselected') {
      const thumbProp = structure.props.find(p =>
        p.name.toLowerCase() === 'thumb' &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (thumbProp) {
        const thumbCssVars = getCssVarsForProp(thumbProp)
        return thumbCssVars[0]
      }
    }

    if (propName === 'thumb') {
      const trackProp = structure.props.find(p =>
        p.name.toLowerCase() === 'track-selected' &&
        p.category === 'colors' &&
        (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
        (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
      )
      if (trackProp) {
        const trackCssVars = getCssVarsForProp(trackProp)
        return trackCssVars[0]
      }
    }

    return undefined
  }

  // Helper function to render Switch dimension slider
  const renderSwitchDimensionSlider = (propName: string, cssVars: string[], primaryVar: string, label: string) => {
    const propNameLower = propName.toLowerCase()
    let minValue = 0
    let maxValue = 500

    if (propNameLower === 'thumb-height') {
      minValue = 10
      maxValue = 40
    } else if (propNameLower === 'thumb-width') {
      minValue = 10
      maxValue = 40
    } else if (propNameLower === 'thumb-border-radius') {
      minValue = 0
      maxValue = 20
    } else if (propNameLower === 'track-width') {
      minValue = 40
      maxValue = 120
    } else if (propNameLower === 'track-inner-padding') {
      minValue = 0
      maxValue = 10
    } else if (propNameLower === 'track-border-radius') {
      minValue = 0
      maxValue = 20
    }

    const SwitchDimensionSlider = () => {
      const [value, setValue] = useState(() => {
        const currentValue = readCssVar(primaryVar)
        const resolvedValue = readCssVarResolved(primaryVar)
        const valueStr = resolvedValue || currentValue || '0px'
        const match = valueStr.match(/^(-?\d+(?:\.\d+)?)px$/i)
        return match ? Math.max(minValue, Math.min(maxValue, parseFloat(match[1]))) : 0
      })

      useEffect(() => {
        const handleUpdate = () => {
          const currentValue = readCssVar(primaryVar)
          const resolvedValue = readCssVarResolved(primaryVar)
          const valueStr = resolvedValue || currentValue || '0px'
          const match = valueStr.match(/^(-?\d+(?:\.\d+)?)(?:px)?$/i)
          if (match) {
            setValue(Math.max(minValue, Math.min(maxValue, parseFloat(match[1]))))
          } else {
            setValue(minValue)
          }
        }
        window.addEventListener('cssVarsUpdated', handleUpdate)
        window.addEventListener('cssVarsReset', handleUpdate)
        return () => {
          window.removeEventListener('cssVarsUpdated', handleUpdate)
          window.removeEventListener('cssVarsReset', handleUpdate)
        }
      }, [primaryVar, minValue, maxValue])

      const handleChange = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(minValue, Math.min(maxValue, Math.round(numValue)))
        setValue(clampedValue)

        // Apply CSS immediately for real-time preview (no event dispatch)
        const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
        cssVarsToUpdate.forEach(cssVar => {
          document.documentElement.style.setProperty(cssVar, `${clampedValue}px`)
        })
      }, [primaryVar, cssVars, minValue, maxValue])

      const handleChangeCommitted = useCallback((val: number | [number, number]) => {
        const numValue = typeof val === 'number' ? val : val[0]
        const clampedValue = Math.max(minValue, Math.min(maxValue, Math.round(numValue)))
        setValue(clampedValue)

        // Update CSS vars directly with pixel value
        const cssVarsToUpdate = cssVars.length > 0 ? cssVars : [primaryVar]
        cssVarsToUpdate.forEach(cssVar => {
          document.documentElement.style.setProperty(cssVar, `${clampedValue}px`)
        })
        }, [primaryVar, cssVars, minValue, maxValue])

      const getValueLabel = useCallback((val: number) => {
        return `${Math.round(val)}px`
      }, [minValue, maxValue]) // Added minValue, maxValue to dependencies

      return (
        <Slider
          value={value}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={minValue}
          max={maxValue}
          step={1}
          layer="layer-1"
          layout="stacked"
          showInput={false}
          showValueLabel={true}
          valueLabel={getValueLabel}
          minLabel={`${minValue}px`}
          maxLabel={`${maxValue}px`}
          showMinMaxLabels={false}
          label={<Label layer="layer-1" layout="stacked">{label}</Label>}
        />
      )
    }

    return <SwitchDimensionSlider key={`${primaryVar}-${selectedVariants.size || ''}`} />
  }

  // This function is responsible for rendering one or more controls for a given property.
  // It handles "combined" props like border (border-color, border-size, border-radius)
  // as well as any generic groups defined in the toolbar JSON
  const renderPropControl = (prop: ComponentProp) => {
    // 1. Handle combined "border" props (legacy specialized handling)
    if (prop.name.toLowerCase() === 'border' && prop.borderProps) {
      return (
        <>
          {Array.from(prop.borderProps.entries()).map(([key, borderProp], index) => {
            // Virtual props (isVariantSpecific) already have the exact CSS var set — use it directly.
            // getCssVarsForProp would otherwise ignore the content-variant path and fall back to sizes-level.
            let cssVars = (borderProp.isVariantSpecific && borderProp.cssVar)
              ? [borderProp.cssVar]
              : getCssVarsForProp(borderProp)

            // Button border-radius lives at the content × size cross-variant axis.
            // parseComponentStructure tags these tokens as variantProp='size' (not 'content'),
            // so the find() in allProps always resolves to the icon-label prop regardless of selection.
            // Compute the authoritative CSS var directly from selectedVariants — same path
            // that ButtonPreview uses for its --button-border-radius inline style.
            if (componentName.toLowerCase() === 'button' && key === 'border-radius') {
              const cv = selectedVariants.content || 'label'
              const sv = selectedVariants.size || 'default'
              const authoritativeVar = buildComponentCssVarPath(
                'Button', 'variants', 'content', cv, 'variants', 'sizes', sv, 'properties', 'border-radius'
              )
              cssVars = [authoritativeVar]
            }

            const primaryVar = cssVars[0] || borderProp.cssVar
            const label = getPropLabel(componentName, key) || toSentenceCase(key)
            const config = getPropConfig(componentName, key) || undefined

            return (
              <div
                key={key}
                style={{ marginTop: index > 0 ? `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` : 0 }}
              >
                {renderControl(borderProp, cssVars, primaryVar, label, config)}
              </div>
            )
          })}
        </>
      )
    }

    // 2. Handle combined "thumb" or "track" props (legacy specialized handling)
    if ((prop.name.toLowerCase() === 'thumb' || prop.name.toLowerCase() === 'track') && prop.thumbProps) {
      return (
        <>
          {Array.from(prop.thumbProps.entries()).map(([key, thumbProp], index) => {
            const cssVars = getCssVarsForProp(thumbProp)
            const primaryVar = cssVars[0] || thumbProp.cssVar
            const label = getPropLabel(componentName, key) || toSentenceCase(key)
            const config = getPropConfig(componentName, key) || undefined

            return (
              <div
                key={key}
                style={{ marginTop: index > 0 ? `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` : 0 }}
              >
                {renderControl(thumbProp, cssVars, primaryVar, label, config)}
              </div>
            )
          })}
        </>
      )
    }

    // 3. Handle GENERIC groups defined in the toolbar JSON (e.g., "Widths" or "Padding" groups)
    let groupedConfigs = getGroupedProps(componentName, prop.name)
    if (groupedConfigs) {
      const activeState = selectedVariants.states || selectedVariants.state || selectedVariants.__activeState || 'default'
      const currentActiveState = activeState.toLowerCase()

      groupedConfigs = Object.fromEntries(
        Object.entries(groupedConfigs).filter(([groupedPropName]) => {
          const groupedPropKey = groupedPropName.toLowerCase()
          const isHoverProp = groupedPropKey.includes('hover')
          const isFocusProp = groupedPropKey.includes('focus')
          const isDisabledProp = groupedPropKey.includes('disabled')
          const isErrorProp = groupedPropKey.includes('error')

          if (currentActiveState === 'default' || currentActiveState === 'base') {
            if (isHoverProp || isFocusProp || isDisabledProp || isErrorProp) return false
          } else {
            if (currentActiveState !== 'hover' && isHoverProp) return false
            if (currentActiveState !== 'focus' && isFocusProp) return false
            if (currentActiveState !== 'disabled' && isDisabledProp) return false
            if (currentActiveState !== 'error' && isErrorProp) return false
          }
          return true
        })
      )
      const structure = parseComponentStructure(componentName)
      const parentPropConfig = getPropConfig(componentName, prop.name)
      const componentRefLabel = parentPropConfig?.componentRef
        ? parentPropConfig.componentRef.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : null
      return (
        <>
          {componentRefLabel && (
            <h4 style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.5,
            }}>
              {componentRefLabel}
            </h4>
          )}
          {Object.entries(groupedConfigs).map(([childPropName, childConfig], index) => {
            // Find the child property in the component structure, ensuring we don't grab text-group properties (which are top-level only).
            // When the parent prop (e.g. "inactive", "active", "tabs") implies a specific path segment,
            // we prefer a prop whose path contains that segment AND whose variant matches the selected one.
            const parentGroupKey = prop.name.toLowerCase()
            // Determine if the parent group name is a path segment that disambiguates sibling groups
            // (e.g. "inactive" vs "active" both have a child "border-size" with different paths)
            const groupIsPathSegment = ['active', 'inactive', 'selected', 'unselected', 'selected-item', 'unselected-item',
              'container', 'thumb-selected', 'thumb-unselected', 'track-selected', 'track-unselected'].includes(parentGroupKey)

            const findChildProp = (requireLayer: boolean) =>
              structure.props.find(p => {
                if (p.name.toLowerCase() !== childPropName.toLowerCase() || p.type === 'text-group') return false
                if (requireLayer && !p.path.includes(selectedLayer)) return false
                // When the parent group name is a known path segment, require it in the prop's path
                if (groupIsPathSegment && !p.path.includes(parentGroupKey)) return false
                // Filter by selected style variant for style-variant-specific props
                if (p.isVariantSpecific && p.variantProp) {
                  const selectedVariant = selectedVariants[p.variantProp]
                  if (!selectedVariant) return false
                  if (!pathMatchesVariant(p.path, p.variantProp, selectedVariant)) return false
                }
                return true
              })

            // For component-level props (like min-width in the "tabs" group), find non-variant-specific ones
            const findComponentLevelChildProp = () =>
              structure.props.find(p =>
                p.name.toLowerCase() === childPropName.toLowerCase() &&
                p.type !== 'text-group' &&
                !p.isVariantSpecific
              )

            const layerMatchedChildProp = findChildProp(true)
            // Check if ComponentToolbar injected a virtual override for this child prop
            // (e.g., Button border-radius / min-width pointing to the content-variant CSS var)
            const borderPropsOverride = prop.borderProps?.get(childPropName)
            const hasBorderPropsOverride = !!borderPropsOverride

            let childProp: ReturnType<typeof findChildProp> = hasBorderPropsOverride
              ? borderPropsOverride
              : (layerMatchedChildProp ?? findChildProp(false) ?? findComponentLevelChildProp())

            // Special case: "text-color" in toolbar config maps to the "text" color prop
            // (mirrors the same special case in ComponentToolbar for grouped prop lookup)
            if (!childProp && childPropName.toLowerCase() === 'text-color') {
              const textColorProp = structure.props.find(p => {
                if (p.name.toLowerCase() !== 'text' || p.category !== 'colors' || !p.path.includes('colors')) return false
                const layerInPath = p.path.find(part => part.startsWith('layer-'))
                if (layerInPath && layerInPath !== selectedLayer) return false
                return true
              })
              if (textColorProp) {
                childProp = { ...textColorProp, name: 'text-color' }
              }
            }

            // Generic resolver for layout-variant dimension props used by group components
            // (e.g. switch-group, checkbox-group, radio-button-group).
            // Toolbar configs express these as "{layout-alias}-{propname}" (e.g. "stacked-label-field-gap",
            // "sbs-gutter") but the actual uikit path is variants.layouts.{layoutName}.properties.{propname}.
            // The layout alias mapping: "stacked" -> "stacked", "sbs" -> "side-by-side".
            if (!childProp) {
              const layoutAliases: Record<string, string> = {
                stacked: 'stacked',
                sbs: 'side-by-side',
              }
              for (const [alias, layoutName] of Object.entries(layoutAliases)) {
                if (childPropName.toLowerCase().startsWith(alias + '-')) {
                  const layoutPropName = childPropName.slice(alias.length + 1)
                  const cssVarPath = buildComponentCssVarPath(
                    componentName,
                    'variants', 'layouts', layoutName, 'properties', layoutPropName
                  )
                  childProp = {
                    name: childPropName,
                    category: 'size',
                    type: 'dimension',
                    cssVar: cssVarPath,
                    path: ['variants', 'layouts', layoutName, 'properties', layoutPropName],
                    isVariantSpecific: false,
                  }
                  break
                }
              }
            }

            // If not found in structure, create a virtual prop (e.g., for Pagination config string props)
            if (!childProp && childConfig.options) {
              // Build the correct CSS var path for nested properties
              const parentName = prop.name.toLowerCase()
              let cssVarPath: string
              let pathSegments: string[]
              let virtualDefault: string | undefined
              if (childPropName.startsWith(parentName + '-')) {
                const suffix = childPropName.slice(parentName.length + 1)
                cssVarPath = buildComponentCssVarPath(componentName, 'properties', parentName, suffix)
                pathSegments = ['properties', parentName, suffix]
                // Use static import — the live store strips $-prefixed keys during processing,
                // making $extensions inaccessible. The static uikitJson always has raw data intact.
                const compKey = componentName.toLowerCase()
                const rawComponents = (uikitJson as any)?.['ui-kit']?.components ?? {}
                const parentNode = rawComponents?.[compKey]?.properties?.[parentName]
                const extVariants = parentNode?.['$extensions']?.['recursica.component']?.['selected-variants']
                if (extVariants?.[suffix]) {
                  const ref = String(extVariants[suffix])
                  const leafMatch = /\.([^.}]+)\}$/.exec(ref)
                  if (leafMatch) virtualDefault = leafMatch[1]
                }
              } else {
                cssVarPath = buildComponentCssVarPath(componentName, 'properties', childPropName)
                pathSegments = ['properties', childPropName]
              }
              childProp = {
                name: childPropName,
                category: 'size',
                type: 'string',
                cssVar: cssVarPath,
                path: pathSegments,
                isVariantSpecific: false,
                defaultValue: virtualDefault,
              }
            }


            if (!childProp) return null

            const isVirtualProp = hasBorderPropsOverride || childProp.type === 'string' || (!layerMatchedChildProp && !structure.props.find(p => p.name.toLowerCase() === childPropName.toLowerCase() && p.type !== 'text-group'))
            const cssVars = isVirtualProp ? [childProp.cssVar] : getCssVarsForProp(childProp)
            const primaryVar = cssVars[0] || childProp.cssVar
            const label = childConfig.label || getPropLabel(componentName, childPropName) || toSentenceCase(childPropName)

            return (
              <div
                key={childPropName}
                style={{ marginTop: index > 0 ? `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` : 0 }}
              >
                {renderControl(childProp, cssVars, primaryVar, label, childConfig)}
              </div>
            )
          })}
        </>
      )
    }

    // Fallback: use getCssVarsForProp to find the correct CSS var based on variants/layer
    const cssVarsForControl = getCssVarsForProp(prop)
    const primaryCssVar = cssVarsForControl[0] || prop.cssVar
    const baseLabel = getPropLabel(componentName, prop.name) || toSentenceCase(prop.name)
    const basePropConfig = getPropConfig(componentName, prop.name) || undefined

    // Render the base control
    return renderControl(prop, cssVarsForControl, primaryCssVar, baseLabel, basePropConfig)
  }

  const renderControl = (propToRender: ComponentProp, cssVars: string[], primaryVar: string, label: string, config?: ToolbarPropConfig) => {
    // Normalize component name for comparison (same as loadToolbarConfig) - must be defined at top of function
    const normalizedComponentName = componentName.toLowerCase().replace(/\s+/g, '-')
    // Use config to hydrate propToRender with custom settings
    if (config) {
      if (config.propertyType) propToRender.propertyType = config.propertyType
      if (config.range) propToRender.range = config.range
      if (config.step) propToRender.step = config.step
    }

    // Segmented control or Dropdown with options
    // Use a wrapper component with useCssVar so it re-renders when the value changes
    const configWithControl = config as (ToolbarPropConfig & { control?: string; options?: Array<string | { label: string; value: string; icon?: string }> }) | undefined
    if (configWithControl?.options?.length) {
      if (configWithControl.control === 'segmented') {
        return (
          <SegmentedControlFromCssVar
            primaryVar={primaryVar}
            cssVars={cssVars}
            label={label}
            options={configWithControl.options as any}
          />
        )
      } else {
        return (
          <DropdownFromCssVar
            primaryVar={primaryVar}
            cssVars={cssVars}
            label={label}
            options={configWithControl.options}
            layer={selectedLayer}
            defaultValue={propToRender.defaultValue}
          />
        )
      }
    }

    // Generic Slider implementation for propertyType: 'slider'
    if (propToRender.propertyType === 'slider' || propToRender.type === 'slider') {
      // Determine if this is a unitless (number) property or a dimension (px) property
      const isUnitless = propToRender.type === 'number'
      const unit = isUnitless ? '' : 'px'

              const minValue = propToRender.range ? propToRender.range[0] : 0
        const maxValue = propToRender.range ? propToRender.range[1] : 500
        const step = propToRender.step || 1

        const isTokenBacked = (varName: string): boolean => {
          const raw = readCssVar(varName)
          return !!raw && /var\s*\(\s*--recursica_(tokens|brand)_/.test(raw)
        }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

    const propNameLower = propToRender.name.toLowerCase()

    // Component type checks - defined at top so they're available throughout the function
    const isLabelWidth = propToRender.name.toLowerCase() === 'label-width'
    const isMenuItem = componentName.toLowerCase().replace(/\s+/g, '-') === 'menu-item' ||
      componentName.toLowerCase().replace(/\s+/g, '') === 'menuitem' ||
      componentName === 'MenuItem'
    const isMenu = componentName.toLowerCase() === 'menu'
    const isAccordion = componentName.toLowerCase() === 'accordion' || normalizedComponentName === 'accordion-item'
    const isAvatar = componentName.toLowerCase() === 'avatar'
    const isButton = componentName.toLowerCase() === 'button'
    const isChip = componentName.toLowerCase() === 'chip'
    const isSlider = componentName.toLowerCase() === 'slider'
    const isSwitch = componentName.toLowerCase() === 'switch' || normalizedComponentName === 'switch-item' || normalizedComponentName === 'switch-group-item'
    const isSegmentedControl = normalizedComponentName === 'segmented-control' || normalizedComponentName === 'segmented-control-item'
    const isSegmentedControlItem = normalizedComponentName === 'segmented-control-item'
    const isBadge = componentName.toLowerCase() === 'badge'
    const isTextField = normalizedComponentName === 'text-field' || normalizedComponentName === 'text field'
    const isNumberInput = normalizedComponentName === 'number-input' || normalizedComponentName === 'number input'
    const isTooltip = componentName.toLowerCase() === 'tooltip'
    const isAssistiveElement = normalizedComponentName === 'assistive-element'
    const isTree = componentName.toLowerCase() === 'tree'
    const isTableCell = normalizedComponentName === 'table-cell'



    if (propToRender.type === 'color') {
      const contrastColorVar = getContrastColorVar(propToRender)
      let validPrimaryVar = (primaryVar && primaryVar.trim()) || (cssVars.length > 0 && cssVars[0]?.trim()) || propToRender.cssVar
      let validCssVars = cssVars.length > 0 ? cssVars.filter(v => v && v.trim()) : [propToRender.cssVar]


      // Special validation for breadcrumb read-only color
      if (componentName.toLowerCase() === 'breadcrumb' && label.toLowerCase().includes('read only')) {
        // Ensure we're using the read-only CSS variable, not the interactive one
        if (validPrimaryVar.includes('interactive') && !validPrimaryVar.includes('read-only')) {
          // Try to find the correct CSS variable from the structure
          const structure = parseComponentStructure(componentName)
          const correctProp = structure.props.find(p =>
            p.name.toLowerCase() === 'color' &&
            p.category === 'colors' &&
            !p.isVariantSpecific &&
            p.path.includes('colors') &&
            p.path.includes('read-only') &&
            !p.path.includes('interactive') &&
            p.path.includes(selectedLayer) &&
            p.cssVar.includes('read-only') &&
            !p.cssVar.includes('interactive')
          )
          if (correctProp) {
            validPrimaryVar = correctProp.cssVar
            validCssVars = [correctProp.cssVar]
          }
        }
      }

      if (!validPrimaryVar || !validPrimaryVar.trim()) {
        return null
      }

      return (
        <PaletteColorControl
          targetCssVar={validPrimaryVar}
          targetCssVars={validCssVars.length > 1 ? validCssVars : undefined}
          currentValueCssVar={validPrimaryVar}
          label={label}
          contrastColorCssVar={contrastColorVar}
        />
      )
    }

    if (propToRender.type === 'typography') {

      return (
        <TypographySliderInline
          targetCssVar={primaryVar}
          targetCssVars={cssVars.length > 0 ? cssVars : undefined}
          label={label}
          layer="layer-1"
        />
      )
    }

    if (propToRender.type === 'dimension') {
      const propNameLower = propToRender.name.toLowerCase()

      // FIRST: Check recursica_ui-kit.json to determine if this property uses tokens or px
      // This ensures we use the correct slider type based on what's actually in recursica_ui-kit.json
      const dimensionType = getDimensionPropertyType(componentName, propToRender.path, selectedVariants, propToRender.sourceComponent)

      // If recursica_ui-kit.json indicates this uses tokens, use BrandDimensionSliderInline (unless overridden below)
      const isSliderOverride = isSlider && (
        propNameLower === 'input-width' ||
        propNameLower === 'input-height' ||
        propNameLower === 'thumb-size' ||
        propNameLower === 'thumb-border-radius' ||
        propNameLower === 'track-height' ||
        propNameLower === 'track-border-radius' ||
        propNameLower === 'input-gap' ||
        propNameLower === 'icon-size' ||
        propNameLower === 'input-border-size' ||
        propNameLower === 'input-padding-vertical' ||
        propNameLower === 'input-padding-left' ||
        propNameLower === 'input-padding-right'
      )

      if (dimensionType === 'token' && !isSliderOverride) {
        // Determine dimension category based on the actual value in the JSON definition
        let dimensionCategory: 'border-radii' | 'icons' | 'general' | 'text-size' = 'general'
        const categoryFromJSON = getDimensionCategoryFromValue(componentName, propToRender.path, selectedVariants, propToRender.sourceComponent)
        
        if (categoryFromJSON) {
          dimensionCategory = categoryFromJSON
        } else {
          // Fallback to name-based heuristic if not found
          if (propNameLower.includes('border-radius') || propNameLower.includes('corner-radius')) {
            dimensionCategory = 'border-radii'
          } else if (propNameLower.includes('icon-size') || (propNameLower.includes('icon') && propNameLower.includes('size'))) {
            dimensionCategory = 'icons'
          } else if (propNameLower.includes('text-size') || propNameLower.includes('font-size')) {
            dimensionCategory = 'text-size'
          }
        }
        // Default to 'general' for padding, gap, spacing (including tabs-content-gap)

        // Use token slider for properties that recursica_ui-kit.json says use tokens
        // Key includes style+orientation for variant-specific props (e.g. tabs-content-gap)
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.style || ''}-${selectedVariants.orientation || ''}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory={dimensionCategory}
            layer={selectedLayer as any}
          />
        )
      }

      // CRITICAL: Component-specific dimension sliders MUST come BEFORE generic handlers
      // This ensures TextField (and other components) dimension props ALWAYS use sliders

      // Use brand dimension slider for label-field-gap (uses dimension tokens, initially set as global ref)
      if (propNameLower === 'label-field-gap') {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="general"
            layer={selectedLayer as any}
          />
        )
      }

      // Use Slider component for TextField dimension properties (MUST use sliders, never DimensionTokenSelector)
      // Special handling for top-bottom-margin: show ALL layout variants (stacked and side-by-side)
      if (propNameLower === 'top-bottom-margin' && prop.isVariantSpecific && prop.variantProp === 'layout') {
        const structure = parseComponentStructure(componentName)
        const allMarginProps = structure.props.filter(p =>
          p.name.toLowerCase() === 'top-bottom-margin' &&
          p.isVariantSpecific &&
          p.variantProp === 'layout'
        )

        return (
          <>
            {allMarginProps.map((marginProp) => {
              const layoutVariant = marginProp.path.find(p => p === 'stacked' || p === 'side-by-side') || 'stacked'
              const layoutLabel = layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'
              const marginCssVars = getCssVarsForProp(marginProp)
              const marginPrimaryVar = marginCssVars[0] || marginProp.cssVar
              const marginLabel = `${label} (${layoutLabel})`

              if (isTextField || isNumberInput) {
                // Use TextField/NumberInput-specific slider
                                  const minValue = 0
                  const maxValue = 32

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )} else {
                // Use BrandDimensionSliderInline for other components
                return (
                  <BrandDimensionSliderInline
                    key={marginProp.cssVar}
                    targetCssVar={marginPrimaryVar}
                    targetCssVars={marginCssVars.length > 0 ? marginCssVars : undefined}
                    label={marginLabel}
                    dimensionCategory="general"
                    layer={selectedLayer as any}
                  />
                )
              }
            })}
          </>
        )
      }

      if ((isTextField || isNumberInput) && (
        propNameLower === 'border-size' ||
        propNameLower === 'horizontal-padding' ||
        propNameLower === 'vertical-padding' ||
        propNameLower === 'min-height' ||
        propNameLower === 'icon-size' ||
        propNameLower === 'icon-text-gap' ||
        propNameLower === 'max-width' ||
        propNameLower === 'min-width' ||
        propNameLower === 'top-bottom-margin'
      )) {
                  let minValue = 0
          let maxValue = 500

          // Set appropriate ranges for each property
          if (propNameLower === 'border-size') {
            minValue = 0
            maxValue = 10
          } else if (propNameLower === 'horizontal-padding' || propNameLower === 'vertical-padding') {
            minValue = 0
            maxValue = 32
          } else if (propNameLower === 'top-bottom-margin') {
            minValue = 0
            maxValue = 32
          } else if (propNameLower === 'min-height') {
            minValue = 20
            maxValue = 80
          } else if (propNameLower === 'icon-size') {
            minValue = 8
            maxValue = 32
          } else if (propNameLower === 'icon-text-gap') {
            minValue = 0
            maxValue = 24
          } else if (propNameLower === 'max-width') {
            minValue = 100
            maxValue = 1000
          } else if (propNameLower === 'min-width') {
            minValue = 0
            maxValue = 500
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use text-size brand tokens slider for text-size and font-size properties
      const isTypographySizeProp = propNameLower === 'text-size' || propNameLower === 'font-size'

      if (isTypographySizeProp) {
        return (
          <TypographySliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            layer="layer-1"
          />
        )
      }

      // Use brand dimension slider for padding-related properties that use general tokens
      // NOTE: TextField padding props are handled above, so this won't catch them
      // NOTE: top-bottom-margin is handled separately above when it's layout-specific
      const isPaddingProp = propNameLower === 'padding' ||
        propNameLower === 'vertical-padding' ||
        propNameLower === 'horizontal-padding' ||
        propNameLower === 'padding-vertical' ||
        propNameLower === 'padding-horizontal' ||
        propNameLower === 'bottom-padding' ||
        propNameLower === 'item-gap' ||
        propNameLower === 'button-node-gap' ||
        propNameLower === 'icon-label-gap' ||
        propNameLower === 'divider-item-gap' ||
        propNameLower === 'track-inner-padding' ||
        propNameLower === 'row-padding' ||
        propNameLower === 'vertical-margin' ||
        (propNameLower === 'top-bottom-margin' && !(prop.isVariantSpecific && prop.variantProp === 'layout'))

      if (isPaddingProp && !isTextField && !isNumberInput) {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="general"
            layer={selectedLayer as any}
          />
        )
      }

      // Use brand dimension slider for border-radius properties
      const isBorderRadiusProp = propNameLower.includes('border-radius') ||
        propNameLower.includes('corner-radius')

      if (isBorderRadiusProp) {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="border-radii"
            layer={selectedLayer as any}
          />
        )
      }

      // Use brand dimension slider for icon-size properties
      const isIconSizeProp = propNameLower.includes('icon-size') ||
        (propNameLower.includes('icon') && propNameLower.includes('size'))

      if (isIconSizeProp && !isTextField && !isNumberInput && !isSlider) {
        return (
          <BrandDimensionSliderInline
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars.length > 0 ? cssVars : undefined}
            label={label}
            dimensionCategory="icons"
            layer={selectedLayer as any}
          />
        )
      }

      // Use pixel slider for label-width (raw pixel values, not tokens)
      // Toolbar sliders ALWAYS use stacked layout
      // When Label is side-by-side, only update CSS var on drag end
      if (propNameLower === 'label-width' && componentName.toLowerCase() === 'label') {
                  const minValue = 0
          const maxValue = 500

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use pixel slider for modal dimensions
      if (componentName.toLowerCase() === 'modal' && (
        propNameLower === 'min-width' ||
        propNameLower === 'max-width' ||
        propNameLower === 'min-height' ||
        propNameLower === 'max-height'
      )) {
                  let minValue = 0
          let maxValue = 1000

          if (propNameLower === 'min-width') {
            minValue = 200
            maxValue = 1000
          } else if (propNameLower === 'max-width') {
            minValue = 200
            maxValue = 2000
          } else if (propNameLower === 'min-height') {
            minValue = 60
            maxValue = 500
          } else if (propNameLower === 'max-height') {
            minValue = 200
            maxValue = 1000
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Chip border-size, min-width, and max-width properties
      if (isChip && (propNameLower === 'border-size' || propNameLower === 'min-width' || propNameLower === 'max-width')) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'border-size') {
            minValue = 0
            maxValue = 10
          } else if (propNameLower === 'min-width') {
            minValue = 0
            maxValue = 500
          } else if (propNameLower === 'max-width') {
            minValue = 0
            maxValue = 1000
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Tree border-size and max-width properties
      if (isTree && (propNameLower === 'border-size' || propNameLower === 'max-width')) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'border-size') {
            minValue = 0
            maxValue = 10
          } else if (propNameLower === 'max-width') {
            minValue = 100
            maxValue = 2000
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Label min-height property (must be before Button check)
      if (componentName.toLowerCase() === 'label' && propNameLower === 'min-height') {
                  const minValue = 0
          const maxValue = 200

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Button width and height properties (must be before isSizeProp check)
      if ((isButton && (propNameLower === 'min-width' || propNameLower === 'max-width' || propNameLower === 'max-label-width' || propNameLower === 'height')) ||
        (isSegmentedControlItem && (propNameLower === 'height' || propNameLower === 'min-width' || propNameLower === 'max-width'))) {
          let minValue = 0
          let maxValue = 500
          if (propNameLower === 'min-width') {
            if (isSegmentedControlItem) {
              minValue = 20
              maxValue = 100
            } else {
              minValue = 20
              maxValue = 150
            }
          } else if (propNameLower === 'max-label-width') {
            minValue = 40
            maxValue = 200
          } else if (propNameLower === 'max-width') {
            if (isSegmentedControlItem) {
              minValue = 80
              maxValue = 300
            } else {
              minValue = 0
              maxValue = 1000
            }
          } else if (propNameLower === 'height') {
            if (isButton) {
              minValue = 20
              maxValue = 100
            } else if (isSegmentedControlItem) {
              minValue = 0
              maxValue = 100
            }
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Switch dimension properties
      if (isSwitch && (
        propNameLower === 'thumb-height' ||
        propNameLower === 'thumb-width' ||
        propNameLower === 'thumb-border-radius' ||
        propNameLower === 'track-width' ||
        propNameLower === 'track-inner-padding' ||
        propNameLower === 'track-border-radius' ||
        propNameLower === 'label-switch-gap' ||
        propNameLower === 'thumb-icon-size'
      )) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'thumb-height') {
            minValue = 10
            maxValue = 40
          } else if (propNameLower === 'thumb-width') {
            minValue = 10
            maxValue = 40
          } else if (propNameLower === 'thumb-border-radius') {
            minValue = 0
            maxValue = 20
          } else if (propNameLower === 'track-width') {
            minValue = 40
            maxValue = 120
          } else if (propNameLower === 'track-inner-padding') {
            minValue = 0
            maxValue = 10
          } else if (propNameLower === 'track-border-radius') {
            minValue = 0
            maxValue = 20
          } else if (propNameLower === 'label-switch-gap') {
            minValue = 0
            maxValue = 32
          } else if (propNameLower === 'thumb-icon-size') {
            minValue = 8
            maxValue = 24
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for SegmentedControl border-size and selected-border-size properties
      if (isSegmentedControl && (propNameLower === 'border-size' || propNameLower === 'selected-border-size')) {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for SegmentedControl divider-size property
      if (isSegmentedControl && propNameLower === 'divider-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Accordion border-size properties
      if (isAccordion && (propNameLower === 'border-size' || propNameLower === 'item-border-size' || propNameLower === 'content-border-size')) {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Accordion divider-size property
      if (isAccordion && propNameLower === 'divider-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Avatar border-size property
      if (isAvatar && propNameLower === 'border-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Button border-size property
      if (isButton && propNameLower === 'border-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Menu border-size property
      if (isMenu && propNameLower === 'border-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Badge border-size property
      if (isBadge && propNameLower === 'border-size') {
                  const minValue = 0
          const maxValue = 10

        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )}

      // Use Slider component for Slider input-width, thumb-size, thumb-border-radius, track-height, track-border-radius, and input-gap properties
      if (isSlider && (
        propNameLower === 'input-width' ||
        propNameLower === 'input-height' ||
        propNameLower === 'thumb-size' ||
        propNameLower === 'thumb-border-radius' ||
        propNameLower === 'track-height' ||
        propNameLower === 'track-border-radius' ||
        propNameLower === 'input-gap' ||
        propNameLower === 'icon-size' ||
        propNameLower === 'input-border-size' ||
        propNameLower === 'input-padding-vertical' ||
        propNameLower === 'input-padding-left' ||
        propNameLower === 'input-padding-right'
      )) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'input-width') {
            minValue = 40
            maxValue = 200
          } else if (propNameLower === 'input-height') {
            minValue = 10
            maxValue = 100
          } else if (propNameLower === 'thumb-size') {
            minValue = 10
            maxValue = 40
          } else if (propNameLower === 'thumb-border-radius') {
            minValue = 0
            maxValue = 20
          } else if (propNameLower === 'track-height') {
            minValue = 2
            maxValue = 20
          } else if (propNameLower === 'track-border-radius') {
            minValue = 0
            maxValue = 20
          } else if (propNameLower === 'input-gap') {
            minValue = 0
            maxValue = 100
          } else if (propNameLower === 'icon-size') {
            minValue = 12
            maxValue = 48
          } else if (propNameLower === 'input-border-size') {
            minValue = 0
            maxValue = 20
          } else if (propNameLower === 'input-padding-vertical' || propNameLower === 'input-padding-left' || propNameLower === 'input-padding-right') {
            minValue = 0
            maxValue = 40
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for Toast size properties (min-width, max-width, min-height)
      const isToast = componentName.toLowerCase() === 'toast'
      if (isToast && (
        propNameLower === 'min-width' ||
        propNameLower === 'max-width' ||
        propNameLower === 'min-height'
      )) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'min-width') {
            minValue = 200
            maxValue = 800
          } else if (propNameLower === 'max-width') {
            minValue = 400
            maxValue = 1200
          } else if (propNameLower === 'min-height') {
            minValue = 32
            maxValue = 200
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for menu-item width and divider properties
      if (isMenuItem && (propNameLower === 'min-width' || propNameLower === 'max-width' || propNameLower === 'divider-height' || propNameLower === 'divider-item-gap')) {
                  let minValue = 0
          let maxValue = 500
          if (propNameLower === 'min-width') {
            minValue = 50
            maxValue = 500
          } else if (propNameLower === 'max-width') {
            minValue = 200
            maxValue = 1000
          } else if (propNameLower === 'divider-height') {
            minValue = 0
            maxValue = 10
          } else if (propNameLower === 'divider-item-gap') {
            minValue = 0
            maxValue = 32
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // Use Slider component for menu width properties
      if (isMenu && (propNameLower === 'min-width' || propNameLower === 'max-width')) {
                  let minValue = 50
          let maxValue = 500
          if (propNameLower === 'min-width') {
            minValue = 50
            maxValue = 500
          } else if (propNameLower === 'max-width') {
            minValue = 200
            maxValue = 1000
          }
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            minPixelValue={minValue}
            maxPixelValue={maxValue}
            label={label}
          />
        )
      }

      // If property uses px (or dimensionType is null/px), use DimensionTokenSelector (which handles both tokens and px)
      let minPixelValue: number | undefined = undefined
      let maxPixelValue: number | undefined = undefined

      // Set custom limits for menu-item and menu width properties
      if ((isMenuItem || isMenu) && propNameLower === 'min-width') {
        minPixelValue = 50
        maxPixelValue = 500
      } else if ((isMenuItem || isMenu) && propNameLower === 'max-width') {
        minPixelValue = 200
        maxPixelValue = 1000
      } else if (isAccordion && propNameLower === 'min-width') {
        minPixelValue = 20
        maxPixelValue = 200
      } else if (isAccordion && propNameLower === 'max-width') {
        minPixelValue = 100
        maxPixelValue = 500
      } else if (isAssistiveElement && propNameLower === 'max-width') {
        minPixelValue = 100
        maxPixelValue = 500
      } else if (isAvatar && (propNameLower === 'width' || propNameLower === 'height')) {
        minPixelValue = 20
        maxPixelValue = 100
      } else if (isLabelWidth) {
        // Default maxPixelValue for label-width
        maxPixelValue = 500
      } else if (isTooltip && (propNameLower === 'beak-size' || propNameLower === 'beak-inset')) {
        minPixelValue = 0
        maxPixelValue = 50
      } else if (isTableCell && propNameLower === 'max-width') {
        minPixelValue = 40
        maxPixelValue = 1000
      }

      if (dimensionType === 'px') {
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            label={label}
            minPixelValue={minPixelValue ?? 0}
            maxPixelValue={maxPixelValue ?? 1000}
          />
        )
      }

      return (
        <DimensionTokenSelector
          key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
          targetCssVar={primaryVar}
          targetCssVars={cssVars}
          label={label}
          propName={propToRender.name}
          minPixelValue={minPixelValue}
          maxPixelValue={maxPixelValue}
        />
      )
    }

    if (propToRender.type === 'elevation') {
      // Ensure primaryVar is mode-specific - it might have been built with the wrong mode
      const modeSpecificPrimaryVar = primaryVar.replace(/themes-(light|dark)-/, `themes-${mode}-`)

      return (
        <ElevationSliderInline
          primaryVar={modeSpecificPrimaryVar}
          label={label}
          elevationOptions={elevationOptions}
          mode={mode}
          layer={selectedLayer as any}
        />
      )
    }

    // For number type properties (like opacity), use OpacitySlider
    if (propToRender.type === 'number') {
      const isOpacityProp = propToRender.name.toLowerCase().includes('opacity')

      if (isOpacityProp) {
        return (
          <OpacitySlider
            key={`${primaryVar}`}
            targetCssVar={primaryVar}
            targetCssVars={cssVars}
            label={label}
            layer="layer-1"
          />
        )
      }

      // For other number properties, show resolved value if available
      const resolvedValue = readCssVarResolved(primaryVar)
      const rawValue = readCssVar(primaryVar) || ''
      return (
        <div className="prop-control-content">
          <label className="prop-control-label">{label}</label>
          <div className="prop-control-readonly">
            {resolvedValue || rawValue || 'Not set'}
          </div>
        </div>
      )
    }

    const currentValue = readCssVar(primaryVar) || ''
    return (
      <div className="prop-control-content">
        <label className="prop-control-label">{label}</label>
        <div className="prop-control-readonly">
          {currentValue || 'Not set'}
        </div>
      </div>
    )
  }

  const baseLabel = (componentName.toLowerCase() === 'toast' &&
    (prop.name.toLowerCase() === 'background' || prop.name.toLowerCase() === 'text'))
    ? 'Color'
    : (componentName.toLowerCase() === 'toast' && prop.name.toLowerCase() === 'icon')
      ? 'Size'
      : toSentenceCase(prop.name)

  // Check if this is a text property group (text, header-text, content-text, label-text, optional-text)
  // Text property groups have nested properties like font-family, font-size, etc.
  // This check MUST happen before grouped props check to ensure text groups are handled correctly
  const propNameLower = prop.name.toLowerCase()
  const textPropertyGroupNames = ['text', 'header-text', 'content-text', 'label-text', 'optional-text', 'supporting-text', 'min-max-label', 'read-only-value', 'placeholder', 'active-text', 'inactive-text', 'description-text', 'title-text', 'timestamp-text', 'selected-text', 'unselected-text', 'step-number-text', 'input-text', 'text-style', 'sorted-text-style', 'unsorted-text-style', 'currency-style']

  // Always check recursica_ui-kit.json structure directly for text property groups, regardless of prop type
  // This ensures we catch text property groups even if they weren't parsed correctly
  const isTextPropertyGroup = textPropertyGroupNames.includes(propNameLower) &&
    (prop.type === 'text-group' || (() => {
      // Fallback: Check recursica_ui-kit.json structure directly
      try {
        const uikitRoot: any = uikitJson
        const components = uikitRoot?.['ui-kit']?.components || {}
        let componentKey = componentName.toLowerCase().replace(/\s+/g, '-')
        if (componentKey === 'switchitem') componentKey = 'switch-item'
        if (componentKey === 'hover-card-/-popover') componentKey = 'hover-card-popover'
        const component = components[componentKey]

        // Try multiple paths to find the text property group
        // Path 1: component.properties.text (component-level)
        let textPropertyGroup = component?.properties?.[propNameLower]

        // Path 2: If not found, check if it's nested under variants (like Button has text under variants.sizes.default.properties.text)
        if (!textPropertyGroup && component?.variants) {
          // Check all size variants for text property groups
          const sizes = component.variants.sizes
          if (sizes) {
            for (const sizeKey in sizes) {
              if (sizes[sizeKey]?.properties?.[propNameLower]) {
                textPropertyGroup = sizes[sizeKey].properties[propNameLower]
                break
              }
            }
          }
        }

        if (textPropertyGroup && typeof textPropertyGroup === 'object' && !('$type' in textPropertyGroup)) {
          // This is an object (not a value), check if it has text properties
          const textPropertyNames = ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-decoration', 'text-transform', 'font-style']
          const hasTextProps = textPropertyNames.some(textPropName =>
            textPropertyGroup[textPropName] !== undefined
          )

          return hasTextProps
        }
      } catch (error) {
        // Error checking text property group
      }
      return false
    })())

  // If this is a text property group, render TextStyleToolbar
  if (isTextPropertyGroup) {
    const textPropConfig = getPropConfig(componentName, prop.name)
    return (
      <TextStyleToolbar
        key={`${componentName}-${prop.name}-${selectedVariants.states || 'default'}`}
        componentName={componentName}
        textElementName={prop.name}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
        allowedProps={textPropConfig?.allowedProps}
      />
    )
  }

  // Check for reusable toolbar modules
  // Note: propNameLower is already declared above, reuse it
  const groupedPropsConfigRaw = getGroupedProps(componentName, prop.name)
  let groupedPropsConfig = groupedPropsConfigRaw || undefined

  if (groupedPropsConfig) {
    const activeState = selectedVariants.states || selectedVariants.state || selectedVariants.__activeState || 'default'
    const currentActiveState = activeState.toLowerCase()

    groupedPropsConfig = Object.fromEntries(
      Object.entries(groupedPropsConfig).filter(([groupedPropName]) => {
        const groupedPropKey = groupedPropName.toLowerCase()
        const isHoverProp = groupedPropKey.includes('hover')
        const isFocusProp = groupedPropKey.includes('focus')
        const isDisabledProp = groupedPropKey.includes('disabled')
        const isErrorProp = groupedPropKey.includes('error')

        if (currentActiveState === 'default' || currentActiveState === 'base') {
          if (isHoverProp || isFocusProp || isDisabledProp || isErrorProp) return false
        } else {
          if (currentActiveState !== 'hover' && isHoverProp) return false
          if (currentActiveState !== 'focus' && isFocusProp) return false
          if (currentActiveState !== 'disabled' && isDisabledProp) return false
          if (currentActiveState !== 'error' && isErrorProp) return false
        }
        return true
      })
    )
  }

  // Border Group Module
  // Skip the BorderGroupToolbar shortcut when the config uses active/inactive border colors
  // (e.g., TimelineBullet) — those need the generic grouped handler to render each color separately
  if (propNameLower === 'border' && groupedPropsConfig) {
    const hasBorderSize = 'border-size' in groupedPropsConfig
    const hasBorderRadius = 'border-radius' in groupedPropsConfig
    const hasBorderColor = 'border-color' in groupedPropsConfig || 'border' in groupedPropsConfig
    const hasActiveBorderColor = 'active-border-color' in groupedPropsConfig
    const hasInactiveBorderColor = 'inactive-border-color' in groupedPropsConfig
    // Determine the actual color prop name from config (could be "border-color" or "border")
    const borderColorPropName = 'border-color' in groupedPropsConfig ? 'border-color' :
      'border' in groupedPropsConfig ? 'border' : 'border-color'

    // Only use BorderGroupToolbar for standard border-color pattern;
    // fall through to generic handler for active/inactive border colors
    if ((hasBorderSize || hasBorderRadius) && !hasActiveBorderColor && !hasInactiveBorderColor) {
      return (
        <BorderGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={groupedPropsConfig}
          config={{
            includeColor: !!hasBorderColor,
            propNameMapping: {
              color: borderColorPropName,
            },
          }}
        />
      )
    }
  }

  // Padding Group Module
  // Handle both single padding prop and grouped padding props
  if (propNameLower === 'padding') {
    const hasGroupedProps = groupedPropsConfig && Object.keys(groupedPropsConfig).length > 0
    const hasHorizontal = groupedPropsConfig && ('horizontal-padding' in groupedPropsConfig || 'padding-horizontal' in groupedPropsConfig)
    const hasVertical = groupedPropsConfig && ('vertical-padding' in groupedPropsConfig || 'padding-vertical' in groupedPropsConfig)

    // Check component structure for padding-horizontal/padding-vertical props
    // This handles cases like Avatar where recursica_ui-kit.json has separate props but toolbar.json doesn't group them
    const structure = parseComponentStructure(componentName)
    const hasPaddingHorizontal = structure.props.some(p =>
      (p.name === 'padding-horizontal' || p.name === 'horizontal-padding') &&
      p.category === 'size'
    )
    const hasPaddingVertical = structure.props.some(p =>
      (p.name === 'padding-vertical' || p.name === 'vertical-padding') &&
      p.category === 'size'
    )

    // Use PaddingGroupToolbar if:
    // 1. Has grouped props (horizontal/vertical) in toolbar config, OR
    // 2. Component structure has padding-horizontal/padding-vertical props (like Avatar), OR
    // 3. No grouped props and single padding prop (like Accordion)
    if (hasGroupedProps && (hasHorizontal || hasVertical)) {
      // Grouped padding props from toolbar config
      return (
        <PaddingGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={groupedPropsConfig}
        />
      )
    } else if (!hasGroupedProps && (hasPaddingHorizontal || hasPaddingVertical)) {
      // Component has separate padding props in recursica_ui-kit.json but toolbar doesn't group them (like Avatar)
      // Create a grouped config from the component structure
      const autoGroupedConfig: Record<string, ToolbarPropConfig> = {}
      if (hasPaddingHorizontal) {
        autoGroupedConfig['padding-horizontal'] = { icon: 'padding', visible: true, label: 'Horizontal padding' }
      }
      if (hasPaddingVertical) {
        autoGroupedConfig['padding-vertical'] = { icon: 'padding', visible: true, label: 'Vertical padding' }
      }
      return (
        <PaddingGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={autoGroupedConfig}
        />
      )
    } else if (!hasGroupedProps && prop.category === 'size') {
      // Single padding prop (no grouped props config)
      return (
        <PaddingGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={undefined}
        />
      )
    }
  }

  // Width Group Module
  if ((propNameLower === 'width' || propNameLower === 'size') && groupedPropsConfig) {
    const hasMinWidth = 'min-width' in groupedPropsConfig
    const hasMaxWidth = 'max-width' in groupedPropsConfig
    const hasMinHeight = 'min-height' in groupedPropsConfig
    const hasMaxHeight = 'max-height' in groupedPropsConfig

    if (hasMinWidth || hasMaxWidth) {
      return (
        <WidthGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={groupedPropsConfig}
          config={{
            includeHeight: !!hasMinHeight,
            includeMaxHeight: !!hasMaxHeight,
          }}
        />
      )
    }
  }

  // Elevation Module
  if (propNameLower === 'elevation' && prop.type === 'number') {
    return (
      <ElevationToolbar
        componentName={componentName}
        prop={prop}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
      />
    )
  }

  // Background Module
  if (propNameLower === 'background' && prop.category === 'colors') {
    const hasSelectedBackground = groupedPropsConfig && ('selected-background' in groupedPropsConfig)
    const hasTextColor = groupedPropsConfig && ('text-color' in groupedPropsConfig)

    return (
      <BackgroundToolbar
        componentName={componentName}
        prop={prop}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
        groupedPropsConfig={groupedPropsConfig || undefined}
        config={{
          includeSelected: !!hasSelectedBackground,
          includeTextColor: !!hasTextColor,
        }}
      />
    )
  }

  // Icon Group Module
  if (propNameLower === 'icon' && groupedPropsConfig) {
    const hasIconSize = 'icon-size' in groupedPropsConfig || 'icon' in groupedPropsConfig
    const hasIconGap = 'icon-text-gap' in groupedPropsConfig || 'spacing' in groupedPropsConfig
    const hasShowIcon = 'showIcon' in groupedPropsConfig
    const hasIconPosition = 'iconPosition' in groupedPropsConfig
    const hasIconName = 'iconName' in groupedPropsConfig
    const hasColors = Object.keys(groupedPropsConfig).some(key =>
      key.includes('color') || key.includes('icon-color')
    )
    const colorProps = hasColors
      ? Object.keys(groupedPropsConfig).filter(key =>
        key.includes('color') || key.includes('icon-color')
      )
      : []

    if (hasIconSize || hasIconGap || hasColors || hasShowIcon || hasIconPosition || hasIconName) {
      return (
        <IconGroupToolbar
          componentName={componentName}
          prop={prop}
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          groupedPropsConfig={groupedPropsConfig}
          config={{
            includeColors: hasColors,
            colorProps: colorProps,
          }}
        />
      )
    }
  }

  // Top-Bottom-Margin Module - Standalone prop for form elements
  if (propNameLower === 'top-bottom-margin') {
    return (
      <TopBottomMarginToolbar
        componentName={componentName}
        prop={prop}
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
        groupedPropsConfig={undefined}
      />
    )
  }

  // Handle grouped props (groupedPropsConfig already declared above)
  if (groupedPropsConfig && prop.borderProps && prop.borderProps.size > 0) {
    const groupedPropEntries = Object.entries(groupedPropsConfig)



    return (
      <>
        {groupedPropEntries.map(([groupedPropName, groupedPropConfig], index) => {
          if (groupedPropConfig.visible === false) {
            return null
          }

          // Filter by showForVariants if specified
          if (groupedPropConfig.showForVariants && groupedPropConfig.showForVariants.length > 0) {
            const anyVariantMatch = groupedPropConfig.showForVariants.some(v =>
              Object.values(selectedVariants).includes(v)
            )
            if (!anyVariantMatch) {
              return null
            }
          }

          const groupedPropKey = groupedPropName.toLowerCase()
          let groupedProp = prop.borderProps!.get(groupedPropKey)

          // CRITICAL FIX for Menu item: When we have nested groups like "selected-item" and "unselected-item",
          // both containing "background" and "text" properties, we need to match by BOTH the prop name
          // AND the parent group name to avoid collisions
          const parentGroupName = prop.name.toLowerCase() // e.g., "selected-item" or "unselected-item"
          const needsParentGroupMatch = (parentGroupName === 'selected-item' || parentGroupName === 'unselected-item') &&
            componentName.toLowerCase() === 'menu item'

          if (needsParentGroupMatch && groupedProp) {
            // Verify that the cached prop actually belongs to this parent group
            const propBelongsToParentGroup = groupedProp.path.includes(parentGroupName)
            if (!propBelongsToParentGroup) {
              // Cached prop is from the wrong group - need to re-find
              groupedProp = undefined
            }
          }

          // If we don't have a grouped prop yet, or it was from the wrong group, find it from structure
          if (!groupedProp && needsParentGroupMatch) {
            const structure = parseComponentStructure(componentName)
            // Find the prop that matches both the prop name AND has the parent group in its path
            const matchingProp = structure.props.find(p =>
              p.name.toLowerCase() === groupedPropKey &&
              p.category === 'colors' &&
              p.path.includes('colors') &&
              p.path.includes(parentGroupName) &&
              p.path.includes(selectedLayer)
            )
            if (matchingProp) {
              groupedProp = matchingProp
              // Cache it with a unique key that includes the parent group
              const uniqueKey = `${parentGroupName}-${groupedPropKey}`
              prop.borderProps!.set(uniqueKey, matchingProp)
            }
          }

          // Special case: interactive-color maps to "color" prop under colors.layer-X.interactive
          // For breadcrumb, ALWAYS re-find to ensure we have the correct prop
          if (groupedPropKey === 'interactive-color' && componentName.toLowerCase() === 'breadcrumb') {
            // Always re-find the prop - ignore what's in the map
            const structure = parseComponentStructure(componentName)
            const interactiveColorProp = structure.props.find(p => {
              const matches = p.name.toLowerCase() === 'color' &&
                p.category === 'colors' &&
                !p.isVariantSpecific &&
                p.path.includes('colors') &&
                p.path.includes('interactive') &&
                !p.path.includes('read-only') && // Explicitly exclude read-only
                p.path.includes(selectedLayer)
              // Validate the CSS variable name matches interactive (not read-only)
              if (matches) {
                if (!p.cssVar.includes('interactive') || p.cssVar.includes('read-only')) {
                  return false
                }
              }
              return matches
            })
            if (interactiveColorProp) {
              groupedProp = interactiveColorProp
              // Always update the borderProps map with the correct prop
              prop.borderProps!.set('interactive-color', interactiveColorProp)
            }
          }
          // Special case: read-only-color maps to "color" prop under colors.layer-X.read-only
          // For breadcrumb, ALWAYS re-find to ensure we have the correct prop
          if (groupedPropKey === 'read-only-color' && componentName.toLowerCase() === 'breadcrumb') {
            // Always re-find the prop - ignore what's in the map
            const structure = parseComponentStructure(componentName)
            const readOnlyColorProp = structure.props.find(p => {
              const matches = p.name.toLowerCase() === 'read-only' &&
                p.category === 'colors' &&
                !p.isVariantSpecific &&
                p.path.includes('colors') &&
                p.path.includes('read-only') &&
                !p.path.includes('interactive') && // Explicitly exclude interactive
                p.path.includes(selectedLayer)
              // Validate the CSS variable name matches read-only (not interactive)
              if (matches) {
                if (!p.cssVar.includes('read-only') || p.cssVar.includes('interactive')) {
                  return false
                }
              }
              return matches
            })
            if (readOnlyColorProp) {
              groupedProp = readOnlyColorProp
              // Always update the borderProps map with the correct prop
              prop.borderProps!.set('read-only-color', readOnlyColorProp)
            }
          }

          // Special case: placeholder-opacity / optional-text-opacity are component-level properties,
          // not variant-level colors — they live directly under properties, not inside colors.{layer}
          if (!groupedProp && (groupedPropKey === 'placeholder-opacity' || groupedPropKey === 'optional-text-opacity')) {
            const structure = parseComponentStructure(componentName)
            groupedProp = structure.props.find(p => {
              const nameMatches = p.name.toLowerCase() === groupedPropKey
              // Must be component-level (not variant-specific)
              const isComponentLevel = !p.isVariantSpecific
              return nameMatches && isComponentLevel
            })
            if (groupedProp) {
              prop.borderProps!.set(groupedPropKey, groupedProp)
            }
          }

          // Special case: label-optional-text-gap is a component-level property
          // It's in the "spacing" group but needs to be found as a component-level property
          if (!groupedProp && groupedPropKey === 'label-optional-text-gap') {
            const structure = parseComponentStructure(componentName)
            groupedProp = structure.props.find(p => {
              const nameMatches = p.name.toLowerCase() === 'label-optional-text-gap'
              // Must be component-level (not variant-specific)
              const isComponentLevel = !p.isVariantSpecific
              return nameMatches && isComponentLevel
            })
            if (groupedProp) {
              prop.borderProps!.set(groupedPropKey, groupedProp)
            }
          }

          // Special case: tab-content-alignment is now orientation-specific for Tabs
          if (!groupedProp && groupedPropKey === 'tab-content-alignment' && componentName.toLowerCase() === 'tabs') {
            const structure = parseComponentStructure(componentName)
            groupedProp = structure.props.find(p => {
              const nameMatches = p.name.toLowerCase() === 'tab-content-alignment'
              const orientationMatches = !selectedVariants.orientation ||
                pathMatchesVariant(p.path, 'orientation', selectedVariants.orientation)
              return nameMatches && orientationMatches
            })
            if (groupedProp) {
              prop.borderProps!.set(groupedPropKey, groupedProp)
            }
          }

          // tabs-content-gap is under both style and orientation; match by both
          // CRITICAL: Always re-find - never use cache. The cache key doesn't include variant,
          // so switching orientation would reuse the wrong prop (e.g. horizontal when vertical selected).
          if (groupedPropKey === 'tabs-content-gap' && componentName.toLowerCase() === 'tabs') {
            const structure = parseComponentStructure(componentName)
            const tabsContentGapProp = structure.props.find(p => {
              const nameMatches = p.name.toLowerCase() === 'tabs-content-gap'
              const styleMatches = !selectedVariants.style || p.path.includes(selectedVariants.style)
              const orientationMatches = !selectedVariants.orientation || p.path.includes(selectedVariants.orientation)
              // Must be from variants.styles.X.orientation.Y, not variants.orientation (component-level)
              const stylesIdx = p.path.indexOf('styles')
              const orientationIdx = p.path.indexOf('orientation')
              const isStyleSpecific = stylesIdx >= 0 && orientationIdx >= 0 && stylesIdx < orientationIdx
              return nameMatches && styleMatches && orientationMatches && isStyleSpecific
            })
            if (tabsContentGapProp) {
              groupedProp = tabsContentGapProp
              prop.borderProps!.set(groupedPropKey, tabsContentGapProp)
            }
          }

          if (!groupedProp && groupedPropKey === 'border-color') {
            groupedProp = prop.borderProps!.get('border')
          }
          if (!groupedProp && groupedPropKey === 'text-color') {
            groupedProp = prop.borderProps!.get('text')
          }
          // Link icon color: discover from state variant path
          // CRITICAL: Always re-find - never use cache. The cache key doesn't include state variant,
          // so switching states would reuse the wrong prop (e.g. default when hover is selected).
          if (groupedPropKey === 'icon-color' && componentName.toLowerCase() === 'link') {
            const structure = parseComponentStructure(componentName)
            const selectedState = selectedVariants?.states || 'default'
            const iconColorProp = structure.props.find(p =>
              p.name.toLowerCase() === 'icon' &&
              p.category === 'colors' &&
              p.path.includes('states') &&
              p.path.includes(selectedState) &&
              p.path.includes(selectedLayer)
            )
            if (iconColorProp) {
              groupedProp = iconColorProp
              prop.borderProps!.set(groupedPropKey, iconColorProp)
            }
          }
          // Link text color: discover from state variant path
          // CRITICAL: Always re-find - never use cache (same reason as icon color above).
          if (groupedPropKey === 'text' && componentName.toLowerCase() === 'link') {
            const structure = parseComponentStructure(componentName)
            const selectedState = selectedVariants?.states || 'default'
            const textColorProp = structure.props.find(p =>
              p.name.toLowerCase() === 'text' &&
              p.category === 'colors' &&
              p.path.includes('states') &&
              p.path.includes(selectedState) &&
              p.path.includes(selectedLayer)
            )
            if (textColorProp) {
              groupedProp = textColorProp
              prop.borderProps!.set(groupedPropKey, textColorProp)
            }
          }
          if (!groupedProp && (groupedPropKey.includes('-min-height') || groupedPropKey.includes('-height'))) {
            groupedProp = prop.borderProps!.get(groupedPropKey)
          }
          if (!groupedProp && (prop.name.toLowerCase() === 'spacing' || prop.name.toLowerCase() === 'layout')) {
            const structure = parseComponentStructure(componentName)
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const matchingProp = structure.props.find(p =>
                p.name.toLowerCase() === groupedPropKey &&
                p.isVariantSpecific &&
                p.variantProp === 'layout' &&
                p.path.includes(layoutVariant)
              )
              if (matchingProp) {
                groupedProp = matchingProp
                prop.borderProps!.set(groupedPropKey, matchingProp)
              }
            }
          }

          if (prop.name.toLowerCase() === 'spacing' && groupedProp) {
            const layoutVariant = selectedVariants['layout']
            if (layoutVariant) {
              const propBelongsToLayout = groupedProp.path.includes(layoutVariant)
              // Component-level props (like label-optional-text-gap) don't have layout in their path, so skip this filter for them
              if (!groupedProp.isVariantSpecific && !propBelongsToLayout) {
                // Don't filter out component-level props - they don't belong to any specific layout
              } else if (groupedProp.isVariantSpecific && !propBelongsToLayout) {
                return null
              }
              // Special case: bottom-padding only belongs to stacked layout, hide it for side-by-side
              if (groupedPropKey === 'bottom-padding' && layoutVariant === 'side-by-side') {
                return null
              }
              // Special case: vertical-padding only belongs to side-by-side layout, hide it for stacked
              if (groupedPropKey === 'vertical-padding' && layoutVariant === 'stacked') {
                return null
              }
              // Note: min-height is now available for both stacked and side-by-side layouts
            }
          }

          // General fallback: For variant-specific grouped props (e.g. active-border-color in the border group
          // when the prop originates from colors under a specific variant), search structure.props by name,
          // selected layer, and selected variant.
          if (!groupedProp) {
            const structure = parseComponentStructure(componentName)
            const matchingProp = structure.props.find(p => {
              const nameMatches = p.name.toLowerCase() === groupedPropKey
              // For color props, filter by selectedLayer
              const layerMatches = !p.path.some(part => part.startsWith('layer-')) || p.path.includes(selectedLayer)
              // For variant-specific props, filter by selected variant
              let variantMatches = true
              if (p.isVariantSpecific && p.variantProp) {
                const selectedVariant = selectedVariants[p.variantProp]
                if (selectedVariant) {
                  variantMatches = pathMatchesVariant(p.path, p.variantProp, selectedVariant)
                } else {
                  variantMatches = false
                }
              }
              return nameMatches && layerMatches && variantMatches
            })
            if (matchingProp) {
              groupedProp = matchingProp
              prop.borderProps!.set(groupedPropKey, matchingProp)
            }
          }

          if (!groupedProp) {
            return null
          }

          // For breadcrumb interactive/read-only colors, ALWAYS re-validate the prop
          // to ensure we have the correct CSS variable
          if (componentName.toLowerCase() === 'breadcrumb' &&
            (groupedPropKey === 'interactive-color' || groupedPropKey === 'read-only-color')) {
            // Always re-find the prop from structure - don't trust anything in the map
            const structure = parseComponentStructure(componentName)
            let correctProp: ComponentProp | undefined = undefined

            if (groupedPropKey === 'read-only-color') {
              // Find the read-only prop - must have read-only in path, NOT interactive
              // AND the CSS variable must contain 'read-only' and NOT 'interactive'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'read-only' &&
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('read-only') &&
                  !p.path.includes('interactive') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })

              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p =>
                p.cssVar.includes('read-only') &&
                !p.cssVar.includes('interactive')
              ) || allMatchingProps[0]
            } else if (groupedPropKey === 'interactive-color') {
              // Find the interactive prop - must have interactive in path, NOT read-only
              // AND the CSS variable must contain 'interactive' and NOT 'read-only'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'interactive' &&
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('interactive') &&
                  !p.path.includes('read-only') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })

              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p =>
                p.cssVar.includes('interactive') &&
                !p.cssVar.includes('read-only')
              ) || allMatchingProps[0]
            }

            // Always use the correct prop if found
            if (correctProp) {
              groupedProp = correctProp
              // Update the map with the correct prop
              prop.borderProps!.set(groupedPropKey, correctProp)
              const correctCssVars = getCssVarsForProp(correctProp)
              const correctPrimaryVar = correctCssVars[0] || correctProp.cssVar

              const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
              return (
                <div
                  key={groupedPropName}
                >
                  {renderControl(correctProp, correctCssVars, correctPrimaryVar, label)}
                </div>
              )
            }
          }

          // For grouped props:
          // - If variant-specific (e.g., border-size for Button variants), always use getCssVarsForProp to get the CSS var matching selected variant
          // - If grouped prop path contains "container" or "selected", use the prop's CSS var directly to ensure we're updating the correct grouped prop
          // - Otherwise (component-level props like Avatar border-radius), always use getCssVarsForProp to ensure correct CSS var resolution
          let cssVars: string[]
          const isGroupedContainerOrSelected = groupedProp.path && (groupedProp.path.includes('container') || groupedProp.path.includes('selected') || groupedProp.path.includes('unselected') || groupedProp.path.includes('active') || groupedProp.path.includes('inactive'))
          if (groupedProp.isVariantSpecific && groupedProp.variantProp) {
            // Variant-specific prop: always resolve based on selected variant
            cssVars = getCssVarsForProp(groupedProp)
          } else if (isGroupedContainerOrSelected) {
            // Container/selected grouped props: use the prop's CSS var directly to ensure we're updating the correct grouped prop
            cssVars = groupedProp.cssVar ? [groupedProp.cssVar] : getCssVarsForProp(groupedProp)
          } else {
            // Component-level props (e.g., Avatar border-radius): always use getCssVarsForProp to ensure correct CSS var resolution
            cssVars = getCssVarsForProp(groupedProp)
          }
          let primaryVar = cssVars[0] || groupedProp.cssVar

          // For breadcrumb interactive/read-only colors, ALWAYS re-validate the prop
          // to ensure we have the correct CSS variable
          if (componentName.toLowerCase() === 'breadcrumb' &&
            (groupedPropKey === 'interactive-color' || groupedPropKey === 'read-only-color')) {
            // Always re-find the prop from structure - don't trust anything in the map
            const structure = parseComponentStructure(componentName)
            let correctProp: ComponentProp | undefined = undefined

            if (groupedPropKey === 'read-only-color') {
              // Find the read-only prop - must have read-only in path, NOT interactive
              // AND the CSS variable must contain 'read-only' and NOT 'interactive'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'read-only' &&
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('read-only') &&
                  !p.path.includes('interactive') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })

              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p =>
                p.cssVar.includes('read-only') &&
                !p.cssVar.includes('interactive')
              ) || allMatchingProps[0]
            } else if (groupedPropKey === 'interactive-color') {
              // Find the interactive prop - must have interactive in path, NOT read-only
              // AND the CSS variable must contain 'interactive' and NOT 'read-only'
              const allMatchingProps = structure.props.filter(p => {
                const pathMatches = p.name.toLowerCase() === 'interactive' &&
                  p.category === 'colors' &&
                  !p.isVariantSpecific &&
                  p.path.includes('colors') &&
                  p.path.includes('interactive') &&
                  !p.path.includes('read-only') &&
                  p.path.includes(selectedLayer)
                return pathMatches
              })

              // Find the one with the correct CSS variable
              correctProp = allMatchingProps.find(p =>
                p.cssVar.includes('interactive') &&
                !p.cssVar.includes('read-only')
              ) || allMatchingProps[0]
            }

            // Always use the correct prop if found
            if (correctProp) {
              groupedProp = correctProp
              // Update the map with the correct prop
              prop.borderProps!.set(groupedPropKey, correctProp)
              const correctCssVars = getCssVarsForProp(correctProp)
              const correctPrimaryVar = correctCssVars[0] || correctProp.cssVar

              const label = groupedPropConfig.label || toSentenceCase(groupedPropName)
              return (
                <div
                  key={groupedPropName}
                >
                  {renderControl(correctProp, correctCssVars, correctPrimaryVar, label)}
                </div>
              )
            }
          }

          const label = groupedPropConfig.label || toSentenceCase(groupedPropName)

          return (
            <div
              key={groupedPropName}
            >
              {renderControl(groupedProp, cssVars, primaryVar, label, groupedPropConfig)}
            </div>
          )
        })}
      </>
    )
  }

  // Handle track prop
  if (prop.name.toLowerCase() === 'track' && (prop.trackSelectedProp || prop.trackUnselectedProp || prop.thumbProps)) {
    const normalizedComponentName = componentName.toLowerCase().replace(/\s+/g, '-')
    const isSwitch = componentName.toLowerCase() === 'switch' || normalizedComponentName === 'switch-item' || normalizedComponentName === 'switch-group-item'
    const trackSelectedCssVars = prop.trackSelectedProp ? getCssVarsForProp(prop.trackSelectedProp) : []
    const trackUnselectedCssVars = prop.trackUnselectedProp ? getCssVarsForProp(prop.trackUnselectedProp) : []
    const trackSelectedPrimaryVar = trackSelectedCssVars[0] || prop.trackSelectedProp?.cssVar
    const trackUnselectedPrimaryVar = trackUnselectedCssVars[0] || prop.trackUnselectedProp?.cssVar

    const trackWidthProp = prop.thumbProps?.get('track-width')
    const trackInnerPaddingProp = prop.thumbProps?.get('track-inner-padding')
    const trackBorderRadiusProp = prop.thumbProps?.get('track-border-radius')

    const structure = parseComponentStructure(componentName)
    const thumbProp = structure.props.find(p =>
      p.name.toLowerCase() === 'thumb' &&
      p.category === 'colors' &&
      (!p.isVariantSpecific || (p.variantProp && selectedVariants[p.variantProp] && p.path.includes(selectedVariants[p.variantProp]))) &&
      (p.category !== 'colors' || !p.path.includes('layer-') || p.path.includes(selectedLayer))
    )
    const thumbCssVars = thumbProp ? getCssVarsForProp(thumbProp) : []
    const thumbVar = thumbCssVars[0]

    return (
      <>
        {prop.trackSelectedProp && trackSelectedPrimaryVar && (
          <PaletteColorControl
            targetCssVar={trackSelectedPrimaryVar}
            targetCssVars={trackSelectedCssVars.length > 1 ? trackSelectedCssVars : undefined}
            currentValueCssVar={trackSelectedPrimaryVar}
            label="Track Selected"
            contrastColorCssVar={thumbVar}
          />
        )}
        {prop.trackUnselectedProp && trackUnselectedPrimaryVar && (
          <div>
            <PaletteColorControl
              targetCssVar={trackUnselectedPrimaryVar}
              targetCssVars={trackUnselectedCssVars.length > 1 ? trackUnselectedCssVars : undefined}
              currentValueCssVar={trackUnselectedPrimaryVar}
              label="Track Unselected"
              contrastColorCssVar={thumbVar}
            />
          </div>
        )}
        {trackWidthProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(trackWidthProp)
              const primaryVar = cssVars[0] || trackWidthProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(trackWidthProp.name, cssVars, primaryVar, "Track Width")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Width"
                  propName={trackWidthProp.name}
                />
              )
            })()}
          </div>
        )}
        {trackInnerPaddingProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(trackInnerPaddingProp)
              const primaryVar = cssVars[0] || trackInnerPaddingProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(trackInnerPaddingProp.name, cssVars, primaryVar, "Track Inner Padding")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Inner Padding"
                  propName={trackInnerPaddingProp.name}
                />
              )
            })()}
          </div>
        )}
        {trackBorderRadiusProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(trackBorderRadiusProp)
              const primaryVar = cssVars[0] || trackBorderRadiusProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(trackBorderRadiusProp.name, cssVars, primaryVar, "Track Border Radius")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Track Border Radius"
                  propName={trackBorderRadiusProp.name}
                />
              )
            })()}
          </div>
        )}
      </>
    )
  }

  // Handle thumb prop
  if (prop.name.toLowerCase() === 'thumb' && prop.thumbProps && prop.thumbProps.size > 0) {
    const normalizedComponentName = componentName.toLowerCase().replace(/\s+/g, '-')
    const isSwitch = componentName.toLowerCase() === 'switch' || normalizedComponentName === 'switch-item' || normalizedComponentName === 'switch-group-item'
    const thumbSelectedProp = prop.thumbProps.get('thumb-selected')
    const thumbUnselectedProp = prop.thumbProps.get('thumb-unselected')
    const thumbHeightProp = prop.thumbProps.get('thumb-height')
    const thumbWidthProp = prop.thumbProps.get('thumb-width')
    const thumbBorderRadiusProp = prop.thumbProps.get('thumb-border-radius')

    return (
      <>
        {thumbSelectedProp && (
          <>
            {(() => {
              const cssVars = getCssVarsForProp(thumbSelectedProp)
              const primaryVar = cssVars[0] || thumbSelectedProp.cssVar
              return (
                <PaletteColorControl
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  currentValueCssVar={primaryVar}
                  label="Thumb Selected"
                />
              )
            })()}
          </>
        )}
        {thumbUnselectedProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(thumbUnselectedProp)
              const primaryVar = cssVars[0] || thumbUnselectedProp.cssVar
              return (
                <PaletteColorControl
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  currentValueCssVar={primaryVar}
                  label="Thumb Unselected"
                />
              )
            })()}
          </div>
        )}
        {thumbHeightProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(thumbHeightProp)
              const primaryVar = cssVars[0] || thumbHeightProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(thumbHeightProp.name, cssVars, primaryVar, "Thumb Height")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Height"
                  propName={thumbHeightProp.name}
                />
              )
            })()}
          </div>
        )}
        {thumbWidthProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(thumbWidthProp)
              const primaryVar = cssVars[0] || thumbWidthProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(thumbWidthProp.name, cssVars, primaryVar, "Thumb Width")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Width"
                  propName={thumbWidthProp.name}
                />
              )
            })()}
          </div>
        )}
        {thumbBorderRadiusProp && (
          <div>
            {(() => {
              const cssVars = getCssVarsForProp(thumbBorderRadiusProp)
              const primaryVar = cssVars[0] || thumbBorderRadiusProp.cssVar
              if (isSwitch) {
                return renderSwitchDimensionSlider(thumbBorderRadiusProp.name, cssVars, primaryVar, "Thumb Border Radius")
              }
              return (
                <DimensionTokenSelector
                  targetCssVar={primaryVar}
                  targetCssVars={cssVars.length > 1 ? cssVars : undefined}
                  label="Thumb Border Radius"
                  propName={thumbBorderRadiusProp.name}
                />
              )
            })()}
          </div>
        )}
      </>
    )
  }

  return renderPropControl(prop)
}

