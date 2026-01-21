import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar as updateCssVarFn } from '../../core/css/updateCssVar'
import brandDefault from '../../vars/Brand.json'
import { iconNameToReactComponent } from '../components/iconUtils'
import { parseTokenReference, type TokenReferenceContext } from '../../core/utils/tokenReferenceParser'
import { buildTokenIndex } from '../../core/resolvers/tokens'

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

// Inline brand dimension slider for LayerStylePanel
function BrandDimensionSliderInline({
  targetCssVar,
  label,
  dimensionCategory,
  layer = 'layer-1',
  onUpdate,
}: {
  targetCssVar: string
  label: string
  dimensionCategory: 'border-radii' | 'general'
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
  onUpdate?: (cssVar: string, tokenValue: string) => void
}) {
  const { theme } = useVars()
  const { mode } = useThemeMode()
  
  const tokens = useMemo(() => {
    const options: Array<{ name: string; value: number; label: string; key: string }> = []
    
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const dimensions = root?.dimensions || {}
      const dimensionCategoryData = dimensions[dimensionCategory] || {}
      
      Object.keys(dimensionCategoryData).forEach(dimensionKey => {
        const dimensionValue = dimensionCategoryData[dimensionKey]
        if (dimensionValue && typeof dimensionValue === 'object' && '$value' in dimensionValue) {
          const cssVar = `--recursica-brand-dimensions-${dimensionCategory}-${dimensionKey}`
          const cssValue = readCssVar(cssVar)
          
          if (cssValue) {
            const resolvedValue = readCssVarResolved(cssVar)
            let numericValue: number | undefined
            
            if (resolvedValue) {
              const match = resolvedValue.match(/^(-?\d+(?:\.\d+)?)/)
              if (match) {
                numericValue = parseFloat(match[1])
              }
            }
            
            const displayLabel = formatDimensionLabel(dimensionKey)
            
            options.push({
              name: cssVar,
              value: numericValue ?? 0,
              label: displayLabel,
              key: dimensionKey,
            })
          }
        }
      })
      
      const sortedTokens = options.sort((a, b) => {
        if (a.key === 'none') return -1
        if (b.key === 'none') return 1
        if (a.value !== undefined && b.value !== undefined) {
          return a.value - b.value
        }
        if (a.value !== undefined) return -1
        if (b.value !== undefined) return 1
        return a.label.localeCompare(b.label)
      })
      
      return sortedTokens
    } catch (error) {
      console.error(`Error loading ${dimensionCategory} tokens:`, error)
      return []
    }
  }, [theme, mode, dimensionCategory])
  
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const justSetValueRef = useRef<string | null>(null)
  
  const readInitialValue = useCallback(() => {
    // Don't read if we just set a value ourselves
    if (justSetValueRef.current !== null) {
      return
    }
    
    const inlineValue = typeof document !== 'undefined' 
      ? document.documentElement.style.getPropertyValue(targetCssVar).trim()
      : ''
    
    const currentValue = inlineValue || readCssVar(targetCssVar)
    
    if (!currentValue || currentValue === 'null' || currentValue === '') {
      const noneIndex = tokens.findIndex(t => t.key === 'none')
      setSelectedIndex(noneIndex >= 0 ? noneIndex : 0)
      return
    }
    
    if (currentValue.trim().startsWith('var(--recursica-')) {
      const matchingIndex = tokens.findIndex(t => {
        const dimensionName = t.name.replace(`--recursica-brand-dimensions-${dimensionCategory}-`, '')
        return currentValue.includes(`${dimensionCategory}-${dimensionName}`) || currentValue.includes(`dimensions-${dimensionCategory}-${dimensionName}`)
      })
      
      if (matchingIndex >= 0) {
        setSelectedIndex(matchingIndex)
        return
      }
      
      const resolved = readCssVarResolved(targetCssVar)
      if (resolved) {
        const match = resolved.match(/^(-?\d+(?:\.\d+)?)px/i)
        if (match) {
          const pxValue = parseFloat(match[1])
          if (pxValue === 0) {
            const noneIndex = tokens.findIndex(t => t.key === 'none')
            if (noneIndex >= 0) {
              setSelectedIndex(noneIndex)
              return
            }
          }
          
          const matchingIndex = tokens
            .map((t, idx) => ({ token: t, index: idx, diff: Math.abs((t.value ?? 0) - pxValue) }))
            .reduce((closest, current) => {
              if (!closest) return current
              return current.diff < closest.diff ? current : closest
            }, undefined as { token: typeof tokens[0]; index: number; diff: number } | undefined)
          
          if (matchingIndex && matchingIndex.diff < 1) {
            setSelectedIndex(matchingIndex.index)
            return
          }
        }
      }
    }
    
    setSelectedIndex(0)
  }, [targetCssVar, tokens, dimensionCategory])
  
  useEffect(() => {
    readInitialValue()
  }, [readInitialValue])
  
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    
    const handleCssVarUpdate = (event: CustomEvent) => {
      const updatedVars = event.detail?.cssVars
      // Only process if this specific CSS var was updated
      if (!Array.isArray(updatedVars) || !updatedVars.includes(targetCssVar)) {
        return
      }
      
      // Don't process if we just set this value ourselves
      if (justSetValueRef.current !== null) {
        return
      }
      
      // Debounce to prevent excessive reads
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        // Double-check we're not in the middle of our own update
        if (justSetValueRef.current === null) {
          readInitialValue()
        }
      }, 50) // Longer delay to ensure CSS var is fully processed
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [readInitialValue, targetCssVar])
  
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      const tokenValue = `var(${selectedToken.name})`
      updateCssVarFn(targetCssVar, tokenValue)
      // Set a flag to prevent the listener from reverting our change
      justSetValueRef.current = tokenValue
      // Keep the flag longer to ensure CSS var is fully processed
      setTimeout(() => {
        justSetValueRef.current = null
      }, 200)
      
      if (onUpdate) {
        onUpdate(targetCssVar, tokenValue)
      }
      
      // Don't dispatch event immediately - let the CSS var update naturally
      // Only dispatch if needed for other components, but with a longer delay
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Only dispatch if we're not in the middle of our own update
          if (justSetValueRef.current === tokenValue) {
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: [targetCssVar] }
            }))
          }
        }, 50) // Longer delay to ensure CSS var is processed
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
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={currentToken?.label || (currentToken?.key ? formatDimensionLabel(currentToken.key) : String(safeSelectedIndex))}
      minLabel={minLabel}
      maxLabel={maxLabel}
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
    readInitialValue()
  }, [readInitialValue])
  
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    
    const handleCssVarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const updatedVars = detail?.cssVars
      // Only process if this specific CSS var was updated
      if (!Array.isArray(updatedVars) || !updatedVars.includes(primaryVar)) {
        return
      }
      
      // Don't process if we just set this value ourselves
      if (justSetValueRef.current !== null) {
        return
      }
      
      // Debounce to prevent excessive reads
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = setTimeout(() => {
        // Double-check we're not in the middle of our own update
        if (justSetValueRef.current === null) {
          readInitialValue()
        }
      }, 50) // Longer delay to ensure CSS var is fully processed
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
    }
  }, [readInitialValue, primaryVar])
  
  const handleSliderChange = (value: number | [number, number]) => {
    const numValue = typeof value === 'number' ? value : value[0]
    const clampedIndex = Math.max(0, Math.min(tokens.length - 1, Math.round(numValue)))
    setSelectedIndex(clampedIndex)
    
    const selectedToken = tokens[clampedIndex]
    if (selectedToken) {
      // The CSS variable should contain just the elevation name (e.g., "elevation-0"),
      // not the full token reference. The resolver extracts this during build.
      // For direct updates, we set it to just the elevation name.
      const elevationName = selectedToken.name // e.g., "elevation-0"
      const tokenReference = `{brand.themes.${mode}.elevations.${selectedToken.name}}`
      
      // Set the CSS variable to just the elevation name (as the resolver would do)
      updateCssVarFn(primaryVar, elevationName)
      
      // Set a flag to prevent the listener from reverting our change
      justSetValueRef.current = tokenReference
      // Keep the flag longer to ensure CSS var is fully processed
      setTimeout(() => {
        justSetValueRef.current = null
      }, 200)
      
      if (onUpdate) {
        // Pass the token reference for JSON updates
        onUpdate(['properties', 'elevation'], tokenReference)
      }
      
      // Dispatch event to notify other components
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Only dispatch if we're not in the middle of our own update
          if (justSetValueRef.current === tokenReference) {
            window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
              detail: { cssVars: [primaryVar] }
            }))
          }
        }, 50)
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
      min={0}
      max={tokens.length - 1}
      step={1}
      layer={layer}
      layout="stacked"
      showInput={false}
      showValueLabel={true}
      valueLabel={getValueLabel}
      tooltipText={(() => {
        if (!currentToken) return 'None'
        const match = currentToken.name.match(/elevation-(\d+)/)
        const elevationNum = match ? parseInt(match[1], 10) : 0
        return elevationNum === 0 ? 'None' : String(elevationNum)
      })()}
      minLabel={minLabel}
      maxLabel={maxLabel}
      label={<Label layer={layer} layout="stacked">{label}</Label>}
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
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
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
    } catch {}
    return out
  }, [tokensJson])
  const opacityOptions = useMemo(() => {
    const out: Array<{ label: string; value: string }> = []
    try {
      const rec: any = (tokensJson as any)?.tokens?.opacity || {}
      Object.keys(rec).forEach((k) => out.push({ label: k, value: `{tokens.opacity.${k}}` }))
    } catch {}
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
      ;['palette-1','palette-2'].forEach((pk) => {
        const group: any = light?.[pk] || {}
        Object.keys(group || {}).forEach((lvl) => {
          if (/^\d{2,4}|000$/.test(lvl)) out.push({ label: `${pk}/${lvl}`, value: `{brand.themes.light.palettes.${pk}.${lvl}.color.tone}` })
        })
        if (group?.default?.['$value']) out.push({ label: `${pk}/default`, value: `{brand.themes.light.palettes.${pk}.default.color.tone}` })
      })
    } catch {}
    return out
  }, [themeJson])
  const elevationOptions = useMemo(() => {
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      // Support both old structure (brand.light.*) and new structure (brand.themes.light.*)
      const themes = root?.themes || root
      const elev: any = themes?.light?.elevations || root?.light?.elevations || {}
      const names = Object.keys(elev).filter((k) => /^elevation-\d+$/.test(k)).sort((a,b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      return names.map((n) => {
        const idx = Number(n.split('-')[1])
        const label = idx === 0 ? 'Elevation 0 (No elevation)' : `Elevation ${idx}`
        return { name: n, label }
      })
    } catch {
      return []
    }
  }, [themeJson])
  const isOnlyLayer0 = selectedLevels.length === 1 && selectedLevels[0] === 0
  
  // Compute CSS vars at top level for useEffect hooks
  const paddingCssVar = useMemo(() => {
    return selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-padding`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-padding`
  }, [selectedLevels, mode, layerKey])
  
  const borderRadiusCssVar = useMemo(() => {
    if (isOnlyLayer0) return ''
    return selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-border-radius`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-border-radius`
  }, [selectedLevels, mode, layerKey, isOnlyLayer0])
  
  const borderThicknessCssVar = useMemo(() => {
    if (isOnlyLayer0) return ''
    return selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-border-thickness`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-border-thickness`
  }, [selectedLevels, mode, layerKey, isOnlyLayer0])
  
  // Consolidated listener for CSS variable updates with debouncing
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const pendingUpdates = new Set<string>()
    
    const handleCssVarUpdate = (e: CustomEvent) => {
      const updatedVars = e.detail?.cssVars || []
      if (!Array.isArray(updatedVars)) return
      
      // Check if any of our CSS vars were updated
      const relevantVars = [paddingCssVar, borderRadiusCssVar, borderThicknessCssVar].filter(Boolean)
      const hasRelevantUpdate = relevantVars.some(v => updatedVars.includes(v))
      
      if (!hasRelevantUpdate) return
      
      // Debounce updates to prevent excessive processing
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      updatedVars.forEach(v => {
        if (relevantVars.includes(v)) {
          pendingUpdates.add(v)
        }
      })
      
      debounceTimer = setTimeout(() => {
        // Process all pending updates at once
        pendingUpdates.forEach(cssVar => {
          if (cssVar === paddingCssVar) {
            const cssValue = readCssVar(paddingCssVar)
            if (cssValue && cssValue.trim().startsWith('var(')) {
              const match = cssValue.match(/--recursica-brand-dimensions-general-([^)]+)/)
              if (match) {
                const generalName = match[1]
                const tokenRef = `{brand.dimensions.general.${generalName}}`
                onUpdate((layerSpec: any) => {
                  const next = JSON.parse(JSON.stringify(layerSpec || {}))
                  if (!next.properties) next.properties = {}
                  next.properties.padding = { $type: 'number', $value: tokenRef }
                  return next
                })
              }
            }
          } else if (cssVar === borderRadiusCssVar) {
            const cssValue = readCssVar(borderRadiusCssVar)
            if (cssValue && cssValue.trim().startsWith('var(')) {
              const match = cssValue.match(/--recursica-brand-dimensions-border-radii-([^)]+)/)
              if (match) {
                const radiusName = match[1]
                const tokenRef = `{brand.dimensions.border-radii.${radiusName}}`
                onUpdate((layerSpec: any) => {
                  const next = JSON.parse(JSON.stringify(layerSpec || {}))
                  if (!next.properties) next.properties = {}
                  next.properties['border-radius'] = { $type: 'number', $value: tokenRef }
                  return next
                })
              }
            }
          } else if (cssVar === borderThicknessCssVar) {
            const cssValue = readCssVar(borderThicknessCssVar)
            if (cssValue) {
              const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/)
              if (match) {
                const pxValue = parseFloat(match[1])
                onUpdate((layerSpec: any) => {
                  const next = JSON.parse(JSON.stringify(layerSpec || {}))
                  if (!next.properties) next.properties = {}
                  next.properties['border-thickness'] = { $type: 'number', $value: pxValue }
                  return next
                })
              }
            }
          }
        })
        pendingUpdates.clear()
      }, 50) // 50ms debounce
    }
    
    window.addEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      window.removeEventListener('cssVarsUpdated', handleCssVarUpdate as EventListener)
    }
  }, [paddingCssVar, borderRadiusCssVar, borderThicknessCssVar, onUpdate])
  
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
    const isSize = typeHint === 'number' && /(padding|border-radius|border-thickness)$/.test(pathKey)
    const options = isColor ? colorOptions : isOpacity ? opacityOptions : isSize ? sizeOptions : []
    const isSelect = options.length > 0
    
    // Build CSS variable name for this field
    const fieldCssVar = selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-${pathKey.replace(/\./g, '-')}`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-${pathKey.replace(/\./g, '-')}`
    
    // For element-text-color, check contrast against surface
    // For surface, check contrast against element-text-color
    let contrastColorCssVar: string | undefined
    // Check if this is element-text-color (pathKey might be "element.text.color" with dots)
    const isElementTextColor = pathKey.includes('element-text-color') || pathKey.includes('element.text.color')
    if (isColor && isElementTextColor) {
      const surfaceVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-surface`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-surface`
      contrastColorCssVar = surfaceVar
    } else if (isColor && (pathKey === 'surface' || pathKey.includes('surface'))) {
      const textColorVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-element-text-color`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-element-text-color`
      contrastColorCssVar = textColorVar
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
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        {isSelect ? (
          <select
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 6 }}
          >
            <option value="">-- select --</option>
            {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        ) : (
          <input
            type={(typeof val === 'number') ? 'number' : 'text'}
            value={val ?? ''}
            onChange={(e) => updateValue(path, e.currentTarget.value)}
            style={{ padding: '6px 8px', border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 6 }}
          />
        )}
      </label>
    )
  }
  const renderPaletteButton = (target: 'surface' | 'border-color', title: string) => {
    // Build CSS variables for all selected layers
    const targetCssVar = selectedLevels.length > 0
      ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-${target}`
      : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-${target}`
    const targetCssVars = selectedLevels.map(level => 
        `--recursica-brand-themes-${mode}-layer-layer-${level}-property-${target}`
      )
    
    // For surface color, check contrast against element-text-color (the label text color)
    // For element-text-color, check contrast against surface
    let contrastColorCssVar: string | undefined
    if (target === 'surface') {
      const textColorVar = selectedLevels.length > 0
        ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-element-text-color`
        : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-element-text-color`
      contrastColorCssVar = textColorVar
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
  const title = selectedLevels.length === 1 ? `Layer ${selectedLevels[0]}` : `Layers ${selectedLevels.join(', ')}`
  const CloseIcon = iconNameToReactComponent('x-mark')
  
  return (
    <div aria-hidden={!open} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '320px', background: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-surface)`, color: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-element-text-color)`, borderLeft: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-thickness) solid var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-color)`, borderRadius: `0 var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-radius) var(--recursica-brand-themes-${mode}-layer-layer-2-property-border-radius) 0`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-3-x-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-y-axis, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-blur, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-spread, 0px) var(--recursica-brand-themes-${mode}-elevations-elevation-3-shadow-color, rgba(0, 0, 0, 0.1))`, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 10000, padding: `var(--recursica-brand-themes-${mode}-layer-layer-2-property-padding)`, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
        }}>{title}</h2>
        <Button 
          onClick={onClose} 
          variant="text" 
          layer="layer-2" 
          aria-label="Close"
          icon={CloseIcon ? <CloseIcon /> : undefined}
        />
      </div>
      <div style={{ display: 'grid', gap: 'var(--recursica-ui-kit-globals-form-properties-vertical-item-gap)' }}>
        {/* Palette color pickers: Surface (all layers, including 0) and Border Color (non-0 layers) */}
        {renderPaletteButton('surface', 'Surface Color')}
        {!isOnlyLayer0 && renderPaletteButton('border-color', 'Border Color')}
        {!isOnlyLayer0 && (() => {
          const elevationCssVar = selectedLevels.length > 0
            ? `--recursica-brand-themes-${mode}-layer-layer-${selectedLevels[0]}-property-elevation`
            : `--recursica-brand-themes-${mode}-layer-layer-${layerKey}-property-elevation`
          
          return (
            <ElevationSliderInline
              primaryVar={elevationCssVar}
              label="Elevation"
              elevationOptions={elevationOptions}
              mode={mode}
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
            onUpdate={(cssVar, tokenValue) => {
              // Sync to theme JSON when CSS var updates
              const cssValue = readCssVar(cssVar)
              if (cssValue && cssValue.trim().startsWith('var(')) {
                const match = cssValue.match(/--recursica-brand-dimensions-general-([^)]+)/)
                if (match) {
                  const generalName = match[1]
                  const tokenRef = `{brand.dimensions.general.${generalName}}`
                  onUpdate((layerSpec: any) => {
                    const next = JSON.parse(JSON.stringify(layerSpec || {}))
                    if (!next.properties) next.properties = {}
                    next.properties.padding = { $type: 'number', $value: tokenRef }
                    return next
                  })
                }
              }
            }}
          />
        )}
        {!isOnlyLayer0 && borderRadiusCssVar && (
          <BrandDimensionSliderInline
            targetCssVar={borderRadiusCssVar}
            label="Border Radius"
            dimensionCategory="border-radii"
            layer="layer-1"
            onUpdate={(cssVar, tokenValue) => {
              // Sync to theme JSON when CSS var updates
              const cssValue = readCssVar(cssVar)
              if (cssValue && cssValue.trim().startsWith('var(')) {
                const match = cssValue.match(/--recursica-brand-dimensions-border-radii-([^)]+)/)
                if (match) {
                  const radiusName = match[1]
                  const tokenRef = `{brand.dimensions.border-radii.${radiusName}}`
                  onUpdate((layerSpec: any) => {
                    const next = JSON.parse(JSON.stringify(layerSpec || {}))
                    if (!next.properties) next.properties = {}
                    next.properties['border-radius'] = { $type: 'number', $value: tokenRef }
                    return next
                  })
                }
              }
            }}
          />
        )}
        {!isOnlyLayer0 && borderThicknessCssVar && (() => {
          const currentValue = (() => {
            const v = (spec as any)?.properties?.['border-thickness']?.$value
            return typeof v === 'number' ? v : 0
          })()
          
          return (
            <Slider
              value={currentValue}
              onChange={(value) => {
                const numValue = typeof value === 'number' ? value : value[0]
                updateValue(['properties','border-thickness'], String(Number.isFinite(numValue) ? numValue : 0))
                // Also update CSS var directly
                updateCssVarFn(borderThicknessCssVar, `${numValue}px`, tokensJson)
              }}
              min={0}
              max={20}
              step={1}
              layer="layer-3"
              layout="stacked"
              showInput={false}
              showValueLabel={true}
              valueLabel={(val) => `${val}px`}
              label={<Label layer="layer-3" layout="stacked">Border Thickness</Label>}
            />
          )
        })()}
        <div>
          <Button
            variant="outline"
            onClick={() => {
              const root: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
              // Support both old structure (brand.light.layer) and new structure (brand.themes.light.layers)
              const themes = root?.themes || root
              
              // For regular layers
              const defaults: any = themes?.[mode]?.layers || themes?.[mode]?.layer || root?.[mode]?.layers || root?.[mode]?.layer || {}
              const levels = selectedLevels.slice()
              
              // Clear CSS variables for surface, border-color, and text-color so they regenerate from theme defaults
              // This is necessary because varsStore preserves existing CSS variables
              const rootEl = document.documentElement
              levels.forEach((lvl) => {
                const surfaceVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-surface`
                const borderVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-border-color`
                const textColorVar = `--recursica-brand-themes-${mode}-layer-layer-${lvl}-property-element-text-color`
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
            layer="layer-2"
          >
            Revert
          </Button>
        </div>
      </div>
    </div>
  )
}

