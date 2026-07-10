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

// Path segments that mark a prop as belonging to a nested "group" (e.g. a switch's
// track/thumb pair, a menu-item's selected/unselected states). Used to decide whether a
// prop's CSS var must be matched by exact path rather than by name alone.
const GROUPED_PROP_PATH_SEGMENTS: readonly string[] = [
  'container', 'selected', 'unselected', 'active', 'inactive',
  'selected-item', 'unselected-item',
  'thumb-selected', 'thumb-unselected', 'track-selected', 'track-unselected',
]
const pathIsGroupedProp = (path: string[]): boolean =>
  path.some(seg => GROUPED_PROP_PATH_SEGMENTS.includes(seg))

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
  type,
  step = 1,
}: {
  primaryVar: string
  cssVars: string[]
  label: string
  minPixelValue: number
  maxPixelValue: number
  type?: 'continuous' | 'discrete'
  step?: number
}) {
  const { uikit } = useVars()
  const globalRef = useGlobalRefControl(primaryVar, uikit)

  const [value, setValue] = useState(() => {
    const currentValue = readCssVar(primaryVar)
    const resolvedValue = readCssVarResolved(primaryVar)
    const valueStr = resolvedValue || currentValue || `${minPixelValue}px`
    const match = valueStr.match(/^(-?\d+(?:\.\d+)?)(?:px)?$/i)
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
      step={step}
      type={type}
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
  customCssVars?: string[]
}

export default function PropControlContent({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
  customCssVars,
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
    if (customCssVars && customCssVars.length > 0) {
      return customCssVars
    }

    // If the prop already has a CSS var and a path, use it directly to avoid mismatching
    // This is especially important for grouped props like "container" vs "selected"
    if (propToCheck.cssVar && propToCheck.path && propToCheck.path.length > 0) {
      // For grouped props, ensure we match the exact path
      // Check if this is a grouped prop by looking for "container" or "selected" in path
      const isGroupedProp = pathIsGroupedProp(propToCheck.path)
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
        const isGroupedProp = pathIsGroupedProp(propToCheck.path)
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
      const bgPropName = propName === 'text-hover' ? 'background-hover' : 'background-color'
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

    if (propName === 'background-color' || propName === 'background-hover') {
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

  // This function is responsible for rendering one or more controls for a given property.
  // It handles "combined" props like border (border-color, border-size, border-radius)
  // as well as any generic groups defined in the toolbar JSON
  const renderPropControl = (prop: ComponentProp) => {
    // ComponentToolbar resolves each config key to a real structure prop and passes its
    // exact CSS var via customCssVars, so we render exactly that one control. Grouping now
    // happens in the accordion layout in ComponentToolbar — not via per-prop expansion here.
    const cssVars = customCssVars && customCssVars.length > 0 ? customCssVars : getCssVarsForProp(prop)
    const primaryCssVar = cssVars[0] || prop.cssVar
    const label = getPropLabel(componentName, prop.name) || toSentenceCase(prop.name)
    const config = getPropConfig(componentName, prop.name) || undefined
    return renderControl(prop, cssVars, primaryCssVar, label, config)
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
            step={step}
            type={config?.sliderType}
            label={label}
          />
        )}

    const propNameLower = propToRender.name.toLowerCase()

    // Only TextField/NumberInput still need a component check here (dual-layout margin below).
    // All the per-component pixel-slider ranges are now data in the toolbar config JSON.
    const isTextField = normalizedComponentName === 'text-field' || normalizedComponentName === 'text field'
    const isNumberInput = normalizedComponentName === 'number-input' || normalizedComponentName === 'number input'



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
      const isSliderOverride = false

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

      // Px dimensions: bounds come from the config `range` (migrated from the old
      // per-component pixel ladder). Token-backed dimensions were handled above.
      const [rangeMin, rangeMax] = propToRender.range ?? []
      if (dimensionType === 'px' || propToRender.range) {
        return (
          <PixelValueSlider
            key={`${primaryVar}-${selectedVariants.layout || ''}-${selectedVariants.size || ''}`}
            primaryVar={primaryVar}
            cssVars={cssVars}
            label={label}
            minPixelValue={rangeMin ?? 0}
            maxPixelValue={rangeMax ?? 1000}
            step={propToRender.step}
            type={config?.sliderType}
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
    (prop.name.toLowerCase() === 'background-color' || prop.name.toLowerCase() === 'text'))
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
  const groupedPropsConfig = getGroupedProps(componentName, prop.name)

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
        autoGroupedConfig['padding-horizontal'] = { icon: 'padding', label: 'Horizontal padding' }
      }
      if (hasPaddingVertical) {
        autoGroupedConfig['padding-vertical'] = { icon: 'padding', label: 'Vertical padding' }
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
  if (propNameLower === 'background-color' && prop.category === 'colors') {
    const hasSelectedBackground = groupedPropsConfig && ('selected-background-color' in groupedPropsConfig)
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

  return renderPropControl(prop)
}

