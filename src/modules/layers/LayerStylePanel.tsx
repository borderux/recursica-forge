import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Button } from '../../components/adapters/Button'
import { Panel } from '../../components/adapters/Panel'
import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar as updateCssVarFn } from '../../core/css/updateCssVar'
import brandDefault from '../../../recursica_brand.json'
import { iconNameToReactComponent } from '../components/iconUtils'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { genericLayerProperty, genericLayerText, layerProperty, layerText } from '../../core/css/cssVarBuilder'

// Helper to format dimension label from key
const formatDimensionLabel = (key: string): string => {
  if (key === 'default') return 'Default'
  if (key === 'none') return 'None'
  if (key === '2xl') return '2Xl'
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

// Extract the last segment from a token reference like "{brand.dimensions.general.xl}" -> "xl"
const extractDimensionKey = (tokenRef: any): string | undefined => {
  if (!tokenRef) return undefined
  const val = typeof tokenRef === 'object' && '$value' in tokenRef ? tokenRef.$value : tokenRef
  if (typeof val !== 'string') return undefined
  const match = val.match(/\{[^}]*\.([^.}]+)\}$/)
  return match ? match[1] : undefined
}

// Inline brand dimension slider for LayerStylePanel
function BrandDimensionSliderInline({
  targetCssVar,
  label,
  dimensionCategory,
  layer = 'layer-1',
  onUpdate,
  initialKey,
}: {
  targetCssVar: string
  label: string
  dimensionCategory: 'border-radii' | 'general'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
  onUpdate?: (cssVar: string, tokenValue: string) => void
  initialKey?: string
}) {
  const { theme } = useVars()
  const { mode } = useThemeMode()

  // Stabilize: only recompute when dimension keys change, not on every theme render
  const dimensionKeys = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const dimensionCategoryData = dimensions[dimensionCategory] || {}
      return Object.keys(dimensionCategoryData).filter(k => {
        const v = dimensionCategoryData[k]
        return v && typeof v === 'object' && '$value' in v
      }).sort().join(',')
    } catch { return '' }
  }, [theme, dimensionCategory])

  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string; key: string }> = []

    try {
      const keys = dimensionKeys.split(',').filter(Boolean)
      keys.forEach(dimensionKey => {
        const cssVar = `--recursica_brand_dimensions_${dimensionCategory}_${dimensionKey}`
        let numericValue: number | undefined
        if (typeof document !== 'undefined') {
          const computed = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
          if (computed) {
            const match = computed.match(/^(-?\d+(?:\.\d+)?)/)
            if (match) numericValue = parseFloat(match[1])
          }
        }
        if (numericValue !== undefined || dimensionKey === 'none') {
          options.push({
            name: cssVar,
            value: numericValue ?? 0,
            label: formatDimensionLabel(dimensionKey),
            key: dimensionKey,
          })
        }
      })

      return options.sort((a, b) => {
        if (a.key === 'none') return -1
        if (b.key === 'none') return 1
        return (a.value ?? 0) - (b.value ?? 0)
      })
    } catch (error) {
      return []
    }
  }, [dimensionKeys, dimensionCategory])

  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    // Initialize from JSON-derived key if available
    if (initialKey && tokens.length > 0) {
      const idx = tokens.findIndex(t => t.key === initialKey)
      if (idx >= 0) return idx
    }
    return 0
  })
  const justSetValueRef = useRef<string | null>(null)
  const hasInteractedRef = useRef(false)

  // Re-sync when initialKey or tokens change (handles async token loading and layer switching)
  // but not after the user has started interacting
  useEffect(() => {
    if (hasInteractedRef.current) return
    if (initialKey && tokens.length > 0) {
      const idx = tokens.findIndex(t => t.key === initialKey)
      if (idx >= 0) setSelectedIndex(idx)
    }
  }, [initialKey, tokens])

  // Reset interaction flag when switching to a different layer/control
  useEffect(() => {
    hasInteractedRef.current = false
  }, [initialKey])


  const readInitialValue = useCallback(() => {
    // Don't read if we just set a value ourselves
    if (justSetValueRef.current !== null) {
      return
    }

    const currentValue = readCssVar(targetCssVar)

    if (!currentValue || currentValue === 'null' || currentValue === '') {
      const noneIndex = tokens.findIndex(t => t.key === 'none')
      setSelectedIndex(noneIndex >= 0 ? noneIndex : 0)
      return
    }

    // Try to match by dimension var name in the value string
    if (currentValue.trim().startsWith('var(--recursica_')) {
      const matchingIndex = tokens.findIndex(t => {
        const dimensionName = t.name.replace(`--recursica_brand_dimensions_${dimensionCategory}_`, '')
        return currentValue.includes(`${dimensionCategory}_${dimensionName}`) || currentValue.includes(`dimensions_${dimensionCategory}_${dimensionName}`)
      })
      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
    }

    // Fallback: resolve to pixel value and match by closest token
    if (typeof document !== 'undefined') {
      const computedValue = getComputedStyle(document.documentElement).getPropertyValue(targetCssVar).trim()
      if (computedValue) {
        const match = computedValue.match(/^(-?\d+(?:\.\d+)?)px/i)
        if (match) {
          const pxValue = parseFloat(match[1])
          if (pxValue === 0) {
            const noneIndex = tokens.findIndex(t => t.key === 'none')
            if (noneIndex >= 0) {
              setSelectedIndex(noneIndex)
              return
            }
          }
          // Resolve each token's actual pixel value at match time
          const closest = tokens
            .map((t, idx) => {
              const tokenComputed = getComputedStyle(document.documentElement).getPropertyValue(t.name).trim()
              const tokenMatch = tokenComputed.match(/^(-?\d+(?:\.\d+)?)/)
              const tokenPx = tokenMatch ? parseFloat(tokenMatch[1]) : (t.value ?? 0)
              return { token: t, index: idx, diff: Math.abs(tokenPx - pxValue) }
            })
            .reduce((best, cur) => (!best || cur.diff < best.diff) ? cur : best, undefined as { token: typeof tokens[0]; index: number; diff: number } | undefined)
          if (closest && closest.diff < 1) {
            setSelectedIndex(closest.index)
            return
          }
        }
      }
    }

    setSelectedIndex(0)
  }, [targetCssVar, tokens, dimensionCategory])

  useEffect(() => {
    // Defer to next frame to ensure browser CSS is fully resolved
    const frameId = requestAnimationFrame(() => readInitialValue())
    return () => cancelAnimationFrame(frameId)
  }, [readInitialValue])
  // Derive scoped var for live preview (LayerModule reads scoped vars, not themed)
  // Themed: --recursica_brand_themes_light_layers_layer-1_properties_padding
  // Scoped: --recursica_brand_layer_1_properties_padding
  const scopedVar = useMemo(() => {
    const m = targetCssVar.match(/layer-(\d+)_properties_(.+)$/)
    if (m) return `--recursica_brand_layer_${m[1]}_properties_${m[2]}`
    return ''
  }, [targetCssVar])

  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    hasInteractedRef.current = true
    // Direct CSS var write for live preview
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const tokenValue = `var(${selectedToken.name})`
      document.documentElement.style.setProperty(targetCssVar, tokenValue)
      if (scopedVar) {
        document.documentElement.style.setProperty(scopedVar, tokenValue)
      }
    }
  }

  const handleSliderCommit = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)

    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const tokenValue = `var(${selectedToken.name})`
      updateCssVarFn(targetCssVar, tokenValue, undefined, true)
      justSetValueRef.current = tokenValue
      setTimeout(() => {
        justSetValueRef.current = null
      }, 500)

      if (onUpdate) {
        onUpdate(targetCssVar, tokenValue)
      }
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
  const minLabel = minToken?.label || 'None'
  const maxLabel = maxToken?.label || 'Xl'

  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    if (token) {
      return token.label || (token.key ? formatDimensionLabel(token.key) : String(index))
    }
    return String(index)
  }, [tokens])

  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      onChangeCommitted={handleSliderCommit}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      showMinMaxLabels={false}
      valueLabel={getValueLabel}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}

// Inline elevation slider for LayerStylePanel
function ElevationSliderInline({
  primaryVar,
  label,
  elevationOptions,
  mode,
  onUpdate,
  layer = 'layer-1',
}: {
  primaryVar: string
  label: string
  elevationOptions: Array<{ name: string; label: string }>
  mode: 'light' | 'dark'
  onUpdate?: (path: string[], value: string) => void
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)

  const tokens = useMemo(() => {
    return elevationOptions.map((opt, index) => ({
      name: opt.name,
      label: opt.label,
      index,
    }))
  }, [elevationOptions])

  const readInitialValue = useCallback(() => {
    // Don't read if we just set a value ourselves
    if (justSetValueRef.current !== null) {
      return
    }

    const inlineValue = typeof document !== 'undefined'
      ? document.documentElement.style.getPropertyValue(primaryVar).trim()
      : ''

    const currentValue = inlineValue || readCssVar(primaryVar)

    if (!currentValue) {
      setSelectedIndex(0)
      return
    }

    let elevationName = 'elevation-0'
    if (currentValue) {
      // The CSS variable should contain just the elevation name (e.g., "elevation-0")
      // but it might also contain a token reference string, so check both formats
      if (/^elevation-\d+$/.test(currentValue.trim())) {
        // Direct elevation name format
        elevationName = currentValue.trim()
      } else {
        // Token reference format - extract elevation name
        const match = currentValue.match(/elevations?\.(elevation-\d+)/i)
        if (match) {
          elevationName = match[1]
        }
      }
    }

    const matchingIndex = tokens.findIndex(t => t.name === elevationName)
    setSelectedIndex(matchingIndex >= 0 ? matchingIndex : 0)
  }, [primaryVar, tokens])

  useEffect(() => {
    const frameId = requestAnimationFrame(() => readInitialValue())
    return () => cancelAnimationFrame(frameId)
  }, [readInitialValue])


  // Derive the scoped CSS var (read by LayerModule) from the themed primaryVar
  // Themed: --recursica_brand_themes_light_layers_layer-1_properties_elevation
  // Scoped: --recursica_brand_layer_1_properties_elevation
  const scopedElevationVar = useMemo(() => {
    const m = primaryVar.match(/layer-(\d+)_properties_elevation/)
    if (m) return `--recursica_brand_layer_${m[1]}_properties_elevation`
    return ''
  }, [primaryVar])

  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    // Direct CSS var write for live preview
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      // Set both themed and scoped vars for immediate preview
      document.documentElement.style.setProperty(primaryVar, selectedToken.name)
      if (scopedElevationVar) {
        document.documentElement.style.setProperty(scopedElevationVar, selectedToken.name)
      }
    }
  }

  const handleSliderCommit = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)

    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const elevationName = selectedToken.name
      const tokenReference = `{brand.themes.${mode}.elevations.${selectedToken.name}}`

      updateCssVarFn(primaryVar, elevationName, undefined, true)
      if (scopedElevationVar) {
        document.documentElement.style.setProperty(scopedElevationVar, elevationName)
      }

      justSetValueRef.current = tokenReference
      setTimeout(() => {
        justSetValueRef.current = null
      }, 500)

      if (onUpdate) {
        onUpdate(['properties', 'elevation'], tokenReference)
      }
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

  // Extract elevation number from token name (e.g., "elevation-0" -> 0, "elevation-4" -> 4)
  const getElevationNumber = (token: typeof tokens[0] | undefined): number => {
    if (!token) return 0
    const match = token.name.match(/elevation-(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Min label: "None" for elevation-0, otherwise the number
  const minElevationNum = getElevationNumber(minToken)
  const minLabel = minElevationNum === 0 ? 'None' : String(minElevationNum)

  // Max label: just the number
  const maxElevationNum = getElevationNumber(maxToken)
  const maxLabel = String(maxElevationNum)

  const getValueLabel = useCallback((value: number) => {
    const index = Math.max(0, Math.min(Math.round(value), tokens.length - 1))
    const token = tokens[index]
    if (!token) return 'None'
    const elevationNum = getElevationNumber(token)
    return elevationNum === 0 ? 'None' : String(elevationNum)
  }, [tokens])

  return (
    <Slider
      value={safeSelectedIndex}
      onChange={handleSliderChange}
      onChangeCommitted={handleSliderCommit}
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      showMinMaxLabels={false}
      valueLabel={getValueLabel}
      tooltipText={(() => {
        if (!currentToken) return 'None'
        const match = currentToken.name.match(/elevation-(\d+)/)
        const elevationNum = match ? parseInt(match[1], 10) : 0
        return elevationNum === 0 ? 'None' : String(elevationNum)
      })()}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
    />
  )
}

// Separate component for border size to use local state (avoids controlled value bounce)
function BorderSizeSlider({
  borderSizeCssVar,
  initialValue,
  updateValue,
  tokensJson,
}: {
  borderSizeCssVar: string
  initialValue: number
  updateValue: (path: string[], raw: string) => void
  tokensJson: any
}) {
  const [localValue, setLocalValue] = useState(initialValue)


  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])

  // Derive scoped var for live preview
  const scopedBorderSizeVar = useMemo(() => {
    const m = borderSizeCssVar.match(/layer-(\d+)_properties_(.+)$/)
    if (m) return `--recursica_brand_layer_${m[1]}_properties_${m[2]}`
    return ''
  }, [borderSizeCssVar])

  return (
    <Slider
      value={localValue}
      onChange={(value) => {
        const numValue = typeof value === 'number' ? value : value[0]
        const safeValue = Number.isFinite(numValue) ? numValue : 0
        setLocalValue(safeValue)
        // Direct CSS var write for live preview
        document.documentElement.style.setProperty(borderSizeCssVar, `${safeValue}px`)
        if (scopedBorderSizeVar) {
          document.documentElement.style.setProperty(scopedBorderSizeVar, `${safeValue}px`)
        }
      }}
      onChangeCommitted={(value) => {
        const numValue = typeof value === 'number' ? value : value[0]
        const safeValue = Number.isFinite(numValue) ? numValue : 0
        setLocalValue(safeValue)
        updateCssVarFn(borderSizeCssVar, `${safeValue}px`, tokensJson)
        updateValue(['properties', 'border-size'], String(safeValue))
      }}
      min={0}
      max={20}
      step={1}
      layer="layer-3"
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      showMinMaxLabels={false}
      valueLabel={(val) => `${val}px`}
      label={<Label layer="layer-3" layout="stacked">Border Size</Label>}
    />
  )
}

type Json = any

function toTitleCase(str: string): string {
  return str.replace(/[-_/]+/g, ' ').replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

export default function LayerStylePanel({
  open,
  selectedLevels,
  theme,
  onClose,
  onUpdate,
}: {
  open: boolean
  selectedLevels: number[]
  theme: Json
  onClose: () => void
  onUpdate: (updater: (layerSpec: any) => any) => void
}) {
  const { tokens: tokensJson, theme: themeJson } = useVars()
  const { mode } = useThemeMode()
  const layerKey = useMemo(() => (selectedLevels.length ? `layer-${selectedLevels[0]}` : ''), [selectedLevels])
  const spec = useMemo(() => {
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
      const themes = root?.themes || root
      // For regular layers
      return themes?.[mode]?.layers?.[layerKey] || themes?.[mode]?.layer?.[layerKey] || root?.[mode]?.layers?.[layerKey] || root?.[mode]?.layer?.[layerKey] || {}
    } catch {
      return {}
    }
  }, [theme, layerKey, mode])
  const sizeOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const rec: any = (tokensJson as any)?.tokens?.size || {}
      // Exclude elevation tokens - those are only in brand, not tokens
      Object.keys(rec).filter((k) => !k.startsWith('elevation-')).forEach((k) => out.push({ label: k, value: `{tokens.size.${k}}` }))
    } catch { }
    return out
  }, [tokensJson])
  const opacityOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const rec: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(rec).forEach((k) => out.push({ label: k, value: `{tokens.opacity.${k}}` }))
    } catch { }
    return out
  }, [tokensJson])
  const colorOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const light: any = themes?.light?.palettes || root?.light?.palettes || {}
      const core: any = light?.['core-colors']?.['$value'] || light?.['core-colors'] || light?.['core']?.['$value'] || light?.['core'] || {}
      Object.keys(core || {}).forEach((name) => {
        // Skip interactive since it has nested structure
        if (name === 'interactive' && typeof core[name] === 'object' && !core[name].$value) return
        out.push({ label: `core/${name}`, value: `{brand.themes.light.palettes.core-colors.${name}}` })
      })
      const neutral: any = light?.neutral || {}
      Object.keys(neutral || {}).forEach((lvl) => {
        if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `neutral/${lvl}`, value: `{brand.themes.light.palettes.neutral.${lvl}.color.tone}` })
      })
        ;['palette-1', 'palette-2'].forEach((pk) => {
          const group: any = light?.[pk] || {}
          Object.keys(group || {}).forEach((lvl) => {
            if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `${pk}/${lvl}`, value: `{brand.themes.light.palettes.${pk}.${lvl}.color.tone}` })
          })
          if (group?.default?.['$value']) out.push({ label: `${pk}/default`, value: `{brand.themes.light.palettes.${pk}.default.color.tone}` })
        })
    } catch { }
    return out
  }, [themeJson])
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
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
  const isOnlyLayer0 = selectedLevels.length === 1 && selectedLevels[0] === 0

  // Compute CSS vars at top level for useEffect hooks
  const paddingCssVar = useMemo(() => {
    const lvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
    return `${layerProperty(mode, lvl, 'padding')}`
  }, [selectedLevels, mode, layerKey])

  const borderRadiusCssVar = useMemo(() => {
    if (isOnlyLayer0) return ''
    const lvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
    return `${layerProperty(mode, lvl, 'border-radius')}`
  }, [selectedLevels, mode, layerKey, isOnlyLayer0])

  const borderSizeCssVar = useMemo(() => {
    if (isOnlyLayer0) return ''
    const lvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
    return `${layerProperty(mode, lvl, 'border-size')}`
  }, [selectedLevels, mode, layerKey, isOnlyLayer0])

  const updateValue = (path: string[], raw: string) => {
    const value: any = (() => {
      if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
      return raw
    })()
    onUpdate((layerSpec: any) => {
      const next = JSON.parse(JSON.stringify(layerSpec || {}))
      let node = next as any
      for (let i = 0; i < path.length - 1; i += 1) {
        const p = path[i]
        if (!node[p] || typeof node[p] !== 'object') node[p] = {}
        node = node[p]
      }
      const leaf = path[path.length - 1]
      const cur = node[leaf]
      if (cur && typeof cur === 'object' && ('$value' in cur)) {
        node[leaf] = { ...cur, $value: value }
      } else {
        node[leaf] = { $value: value }
      }
      return next
    })
  }
  const Field: React.FC<{ label: string; path: string[]; current: any }> = ({ label, path, current }) => {
    const val = (typeof current === 'object' && current && ('$value' in current)) ? current.$value : current
    const typeHint = (typeof current === 'object' && current && ('$type' in current)) ? String(current.$type) : undefined
    const pathKey = path.join('.')
    const isColor = typeHint === 'color' || /(color|hover-color)$/.test(pathKey)
    const isOpacity = typeHint === 'number' && /(high-emphasis|low-emphasis)$/.test(pathKey)
    const isSize = typeHint === 'number' && /(padding|border-radius|border-size)$/.test(pathKey)
    const options = isColor ? colorOptions : isOpacity ? opacityOptions : isSize ? sizeOptions : []
    const isSelect = options.length > 0

    // Build CSS variable name for this field
    const fieldLvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
    const fieldCssVar = `${layerProperty(mode, fieldLvl, pathKey.replace(/\./g, '-'))}`

    // For element-text-color, check contrast against surface
    // For surface, check contrast against element-text-color
    let contrastColorCssVar: string | undefined
    // Check if this is element-text-color (pathKey might be "element.text.color" with dots)
    const isElementTextColor = pathKey.includes('element-text-color') || pathKey.includes('element.text.color')
    if (isColor && isElementTextColor) {
      contrastColorCssVar = `${layerProperty(mode, fieldLvl, 'surface')}`
    } else if (isColor && (pathKey === 'surface' || pathKey.includes('surface'))) {
      contrastColorCssVar = `${layerText(mode, fieldLvl, 'color')}`
    }

    // For color fields, use PaletteColorControl instead of select
    if (isColor && !isSelect) {
      return (
        <PaletteColorControl
          label={label}
          targetCssVar={fieldCssVar}
          currentValueCssVar={fieldCssVar}
          swatchSize={14}
          fontSize={13}
          contrastColorCssVar={contrastColorCssVar}
        />
      )
    }

    return (
      <div style={{ display: 'grid', gap: 4 }}>
        {isSelect ? (
          <Dropdown
            label={label}
            items={options}
            value={typeof val === 'string' ? val : ''}
            onChange={(v) => updateValue(path, v)}
            placeholder="-- select --"
            layer="layer-1"
            layout="stacked"
            disableTopBottomMargin={true}
          />
        ) : (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
            <input
              type={(typeof val === 'number') ? 'number' : 'text'}
              value={val ?? ''}
              onChange={(e) => updateValue(path, e.currentTarget.value)}
              style={{
                padding: '6px 8px',
                border: `1px solid var(${genericLayerProperty(1, 'border-color')})`,
                borderRadius: 6,
                backgroundColor: `var(${genericLayerProperty(1, 'surface')})`,
                color: `var(${genericLayerText(1, 'color')})`,
                fontSize: 14,
              }}
            />
          </label>
        )}
      </div>
    )
  }
  const renderPaletteButton = (target: 'surface' | 'border-color', title: string) => {
    // Build CSS variables for all selected layers
    const paletteLvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
    const targetCssVar = `${layerProperty(mode, paletteLvl, target)}`
    const targetCssVars = selectedLevels.map(level =>
      `${layerProperty(mode, level, target)}`
    )

    // For surface color, check contrast against element-text-color (the label text color)
    // For element-text-color, check contrast against surface
    let contrastColorCssVar: string | undefined
    if (target === 'surface') {
      contrastColorCssVar = `${layerText(mode, paletteLvl, 'color')}`
    }

    return (
      <PaletteColorControl
        label={title}
        targetCssVar={targetCssVar}
        targetCssVars={targetCssVars.length > 1 ? targetCssVars : undefined}
        currentValueCssVar={targetCssVar}
        swatchSize={14}
        fontSize={13}
        contrastColorCssVar={contrastColorCssVar}
      />
    )
  }
  const RenderGroup: React.FC<{ basePath: string[]; obj: any; title?: string }> = ({ basePath, obj, title }) => {
    if (!obj || typeof obj !== 'object') return null
    const entries = Object.entries(obj)
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {title ? <div style={{ fontWeight: 600, marginTop: 4 }}>{title}</div> : null}
        {entries.map(([k, v]) => {
          if (v && typeof v === 'object' && !('$value' in (v as any))) {
            return <RenderGroup key={k} basePath={[...basePath, k]} obj={v} title={k} />
          }
          return <Field key={k} label={k} path={[...basePath, k]} current={v} />
        })}
      </div>
    )
  }
  const panelTitle = selectedLevels.length === 1 ? `Layer ${selectedLevels[0]}` : `Layers ${selectedLevels.join(', ')}`

  const panelFooter = (
    <Button
      variant="outline"
      size="small"
      onClick={() => {
        const root: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
        // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
        const themes = root?.themes || root

        // For regular layers
        const defaults: any = themes?.[mode]?.layers || themes?.[mode]?.layer || root?.[mode]?.layers || root?.[mode]?.layer || {}
        const levels = selectedLevels.slice()

        // Clear CSS variables for surface, border-color, and text-color so they regenerate from theme defaults
        const rootEl = document.documentElement
        levels.forEach((lvl) => {
          const surfaceVar = `${layerProperty(mode, lvl, 'surface')}`
          const borderVar = `${layerProperty(mode, lvl, 'border-color')}`
          const textColorVar = `${layerText(mode, lvl, 'color')}`
          rootEl.style.removeProperty(surfaceVar)
          rootEl.style.removeProperty(textColorVar)
          if (lvl > 0) {
            rootEl.style.removeProperty(borderVar)
          }
        })

        // Update theme JSON with defaults
        levels.forEach((lvl) => {
          const key = `layer-${lvl}`
          const def = defaults[key]
          if (def) {
            onUpdate(() => JSON.parse(JSON.stringify(def)))
          }
        })
      }}
      icon={(() => {
        const ResetIcon = iconNameToReactComponent('arrow-path')
        return ResetIcon ? <ResetIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
      })()}
      layer="layer-0"
    >
      Reset all
    </Button>
  )

  return (
    <Panel
      overlay
      position="right"
      title={panelTitle}
      onClose={onClose}
      footer={panelFooter}
      width="400px"
      zIndex={10000}
      layer="layer-0"
      style={{
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})` }}>
        {/* Palette color pickers: Surface (all layers, including 0) and Border Color (non-0 layers) */}
        {renderPaletteButton('surface', 'Surface Color')}
        {!isOnlyLayer0 && renderPaletteButton('border-color', 'Border Color')}
        {!isOnlyLayer0 && (() => {
          const elevLvl = selectedLevels.length > 0 ? selectedLevels[0] : layerKey.replace('layer-', '')
          const elevationCssVar = `${layerProperty(mode, elevLvl, 'elevation')}`

          return (
            <ElevationSliderInline
              primaryVar={elevationCssVar}
              label="Elevation"
              elevationOptions={elevationOptions}
              mode={mode}
              onUpdate={updateValue}
              layer="layer-2"
            />
          )
        })()}
        {paddingCssVar && (
          <BrandDimensionSliderInline
            targetCssVar={paddingCssVar}
            label="Padding"
            dimensionCategory="general"
            layer="layer-1"
            onUpdate={(_cssVar, tokenValue) => {
              const match = tokenValue.match(/--recursica_brand_dimensions_general_([^)]+)/)
              if (match) {
                const tokenRef = `{brand.dimensions.general.${match[1]}}`
                onUpdate((layerSpec: any) => {
                  const next = JSON.parse(JSON.stringify(layerSpec || {}))
                  if (!next.properties) next.properties = {}
                  next.properties.padding = { $type: 'number', $value: tokenRef }
                  return next
                })
              }
            }}
            initialKey={extractDimensionKey(spec?.properties?.padding)}
          />
        )}
        {!isOnlyLayer0 && borderRadiusCssVar && (
          <BrandDimensionSliderInline
            targetCssVar={borderRadiusCssVar}
            label="Border Radius"
            dimensionCategory="border-radii"
            layer="layer-1"
            onUpdate={(_cssVar, tokenValue) => {
              const match = tokenValue.match(/--recursica_brand_dimensions_border-radii_([^)]+)/)
              if (match) {
                const tokenRef = `{brand.dimensions.border-radii.${match[1]}}`
                onUpdate((layerSpec: any) => {
                  const next = JSON.parse(JSON.stringify(layerSpec || {}))
                  if (!next.properties) next.properties = {}
                  next.properties['border-radius'] = { $type: 'number', $value: tokenRef }
                  return next
                })
              }
            }}
            initialKey={extractDimensionKey(spec?.properties?.['border-radius'])}
          />
        )}
        {!isOnlyLayer0 && borderSizeCssVar && (() => {
          return (
            <BorderSizeSlider
              borderSizeCssVar={borderSizeCssVar}
              initialValue={typeof (spec as any)?.properties?.['border-size']?.$value === 'number' ? (spec as any).properties['border-size'].$value : 0}
              updateValue={updateValue}
              tokensJson={tokensJson}
            />
          )
        })()}
      </div>
    </Panel>
  )
}
