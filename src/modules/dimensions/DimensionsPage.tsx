/**
 * DimensionsPage
 *
 * Page for mapping brand dimensions to underlying size tokens.
 */
import { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import { parseTokenReference } from '../../core/utils/tokenReferenceParser'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { Slider } from '../../components/adapters/Slider'
import { Label } from '../../components/adapters/Label'
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'
import brandDefault from '../../vars/Brand.json'

type DimensionEntry = {
  path: string[]
  label: string
  currentToken: string | null
  cssVar: string
  currentValue: number // Current pixel value
}

function toTitleCase(str: string): string {
  return (str || '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .trim()
}

function getSizeOrder(label: string): number {
  const normalized = label.toLowerCase()
  
  // Define size order from smallest to largest
  const sizeOrder: Record<string, number> = {
    'none': 0,
    'xs': 1,
    'sm': 2,
    'default': 3,
    'md': 4,
    'lg': 5,
    'xl': 6,
    '2xl': 7,
    '3xl': 8,
    '4xl': 9,
    '5xl': 10,
    '6xl': 11,
  }
  
  // Check if it's a known size name
  if (sizeOrder.hasOwnProperty(normalized)) {
    return sizeOrder[normalized]
  }
  
  // For unknown names (like "horizontal", "vertical"), put them after known sizes
  // Use a large base number + alphabetical order
  return 1000 + normalized.charCodeAt(0)
}

export default function DimensionsPage() {
  const { tokens: tokensJson, theme: themeJson, setTheme, updateToken } = useVars()
  const { mode } = useThemeMode()

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  const layer1Base = `--recursica-brand-themes-${mode}-layers-layer-1-properties`

  // Get available size tokens (exclude elevation tokens - those are only in brand, not tokens)
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$') && !k.startsWith('elevation-')).forEach((k) => {
        const raw = src[k]?.$value
        const v = (raw && typeof raw === 'object' && typeof raw.value !== 'undefined') ? raw.value : raw
        const num = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(num)) {
          const baseLabel = k.replace('-', '.')
          const label = baseLabel === 'none' ? 'None' : baseLabel === 'default' ? 'Default' : baseLabel.endsWith('x') ? baseLabel : `${baseLabel}x`
          tokens.push({ name: k, value: num, label })
        }
      })
    } catch {}
    return tokens.sort((a, b) => {
      // Sort by numeric value only (lowest to highest) so slider stops are in increasing order
      return a.value - b.value
    })
  }, [tokensJson])

  // Extract dimensions from theme JSON and read current values
  const dimensions = useMemo(() => {
    const entries: DimensionEntry[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const dims = root?.dimensions
      if (!dims || typeof dims !== 'object') return entries

      const traverse = (obj: any, path: string[], labelPrefix: string) => {
        Object.keys(obj).forEach((key) => {
          if (key.startsWith('$')) return
          const value = obj[key]
          const currentPath = [...path, key]

          if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
            // This is a dimension value - use just the key as the label (not the full path)
            const tokenRef = value.$value
            let tokenName: string | null = null
            if (typeof tokenRef === 'string') {
              const parsed = parseTokenReference(tokenRef)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'size') {
                tokenName = parsed.path.slice(1).join('.')
              }
            }
            const cssVarName = `--recursica-brand-dimensions-${currentPath.join('-')}`
            
            // Read current pixel value from CSS variable
            let currentValue = 0
            try {
              const cssValue = readCssVarResolved(cssVarName)
              if (cssValue) {
                const match = cssValue.match(/^(-?\d+(?:\.\d+)?)/)
                if (match) {
                  currentValue = parseFloat(match[1])
                }
              }
            } catch {}
            
            entries.push({ path: currentPath, label: toTitleCase(key), currentToken: tokenName, cssVar: cssVarName, currentValue })
          } else if (value && typeof value === 'object') {
            // Continue traversing (don't pass labelPrefix to avoid prefixing)
            traverse(value, currentPath, '')
          }
        })
      }

      traverse(dims, [], '')
    } catch {}
    return entries
  }, [themeJson])

  // Local state to track slider values during drag (token indices)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})

  // Find the closest size token index for a given pixel value
  const findClosestTokenIndex = (pixelValue: number): number => {
    let closestIndex = 0
    let minDiff = Infinity
    
    availableSizeTokens.forEach((token, index) => {
      const diff = Math.abs(token.value - pixelValue)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = index
      }
    })
    
    return closestIndex
  }

  const updateDimension = (path: string[], tokenIndex: number) => {
    const token = availableSizeTokens[tokenIndex]
    if (!token) return

    const themeCopy = JSON.parse(JSON.stringify(themeJson))
    const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    let node = root.dimensions
    if (!node) {
      root.dimensions = {}
      node = root.dimensions
    }

    // Navigate to the parent of the target
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i]
      if (!node[p] || typeof node[p] !== 'object') node[p] = {}
      node = node[p]
    }

    const leaf = path[path.length - 1]
    const tokenRef = `{tokens.size.${token.name}}`
    node[leaf] = {
      $type: 'number',
      $value: tokenRef,
    }

    setTheme(themeCopy)
  }

  // Group dimensions by category and sort each group by label (alphabetically)
  const groupedDimensions = useMemo(() => {
    const groups: Record<string, DimensionEntry[]> = {}
    dimensions.forEach((entry) => {
      const category = entry.path[0] || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(entry)
    })
    // Sort each group by semantic size order (none → xs → sm → default → md → lg → xl → 2xl, etc.)
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => {
        const orderA = getSizeOrder(a.label)
        const orderB = getSizeOrder(b.label)
        if (orderA !== orderB) {
          return orderA - orderB
        }
        // If same order, fall back to alphabetical
        return a.label.localeCompare(b.label)
      })
    })
    return groups
  }, [dimensions])

  // Define section order (matching actual category names from dimensions)
  // Note: 'text-size' is excluded as users cannot change text sizes
  const sectionOrder = ['general', 'icons', 'gutters', 'border-radii']
  
  // Sort category keys according to section order, then alphabetically for any not in the order
  // Filter out 'text-size' category completely
  const categoryKeys = useMemo(() => {
    const ordered: (string | undefined)[] = new Array(sectionOrder.length).fill(undefined)
    const unordered: string[] = []
    
    Object.keys(groupedDimensions).forEach((key) => {
      // Hide text-size category completely
      if (key.toLowerCase() === 'text-size') {
        return
      }
      
      const normalizedKey = key.toLowerCase()
      const orderIndex = sectionOrder.findIndex(orderedKey => normalizedKey === orderedKey.toLowerCase())
      if (orderIndex !== -1) {
        ordered[orderIndex] = key
      } else {
        unordered.push(key)
      }
    })
    
    return [...ordered.filter((k): k is string => k !== undefined), ...unordered.sort()]
  }, [groupedDimensions])

  const handleReset = (category: string) => {
    // Reset all dimensions in this category to their default token references from Brand.json
    const themeCopy = JSON.parse(JSON.stringify(themeJson))
    const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    const dims = root?.dimensions
    if (!dims) return

    // Get default dimensions from Brand.json
    const defaultRoot: any = (brandDefault as any)?.brand ? (brandDefault as any).brand : brandDefault
    const defaultDims = defaultRoot?.dimensions
    if (!defaultDims) return

    groupedDimensions[category].forEach((entry) => {
      // Navigate to the dimension in the default Brand.json
      let defaultNode = defaultDims
      for (let i = 0; i < entry.path.length; i++) {
        if (!defaultNode[entry.path[i]]) {
          // If default doesn't exist, skip this entry
          return
        }
        defaultNode = defaultNode[entry.path[i]]
      }

      // Get the default token reference
      const defaultTokenRef = defaultNode?.$value
      if (!defaultTokenRef || typeof defaultTokenRef !== 'string') {
        return
      }

      // Navigate to the dimension in the current theme
      let node = dims
      for (let i = 0; i < entry.path.length - 1; i++) {
        if (!node[entry.path[i]]) {
          node[entry.path[i]] = {}
        }
        node = node[entry.path[i]]
      }
      const leaf = entry.path[entry.path.length - 1]

      // Reset to the default token reference
      node[leaf] = {
        $type: 'number',
        $value: defaultTokenRef,
      }
    })

    setTheme(themeCopy)
    
    // Clear slider values for this category to force re-computation
    setSliderValues((prev) => {
      const next = { ...prev }
      groupedDimensions[category].forEach((entry) => {
        delete next[entry.cssVar]
      })
      return next
    })
  }

  return (
    <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
      <h1 style={{
        margin: 0,
        marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
        fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
        fontSize: 'var(--recursica-brand-typography-h1-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
        color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
        opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`,
      }}>
        Dimensions
      </h1>

      {/* Grid layout: 2 columns, tiling sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--recursica-brand-dimensions-general-lg)',
        alignItems: 'start',
      }}>
        {categoryKeys.map((category) => {
          const categoryEntries = groupedDimensions[category]
          if (categoryEntries.length === 0) return null

          return (
            <section
              key={category}
              style={{
                background: `var(${layer0Base}-surface)`,
                border: `1px solid var(${layer1Base}-border-color)`,
                borderRadius: 'var(--recursica-brand-dimensions-border-radii-xl)',
                padding: 'var(--recursica-brand-dimensions-general-xl)',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
              }}>
                <h2 style={{
                  margin: 0,
                  fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
                  fontSize: 'var(--recursica-brand-typography-h2-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
                  letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
                  lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
                  color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                  opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-high-emphasis)`,
                }}>
                  {category.toLowerCase() === 'border-radii' ? 'Border Radius' : toTitleCase(category)}
                </h2>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleReset(category)}
                  icon={(() => {
                    const RefreshIcon = iconNameToReactComponent('arrow-path')
                    return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
                  })()}
                >
                  Reset all
                </Button>
              </div>

              {/* Rows */}
              <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
                {categoryEntries.map((entry, index) => {
                  const isNone = entry.label.toLowerCase() === 'none'
                  
                  // Find current token index based on pixel value - always ensure it's an integer
                  const baseTokenIndex = sliderValues[entry.cssVar] ?? findClosestTokenIndex(entry.currentValue)
                  const currentTokenIndex = Math.round(baseTokenIndex)
                  const clampedTokenIndex = Math.max(0, Math.min(availableSizeTokens.length - 1, currentTokenIndex))
                  const currentToken = availableSizeTokens[clampedTokenIndex]
                  
                  // Get value label function - always round to get discrete token
                  const getValueLabel = (value: number) => {
                    const roundedIdx = Math.round(value)
                    const clampedIdx = Math.max(0, Math.min(availableSizeTokens.length - 1, roundedIdx))
                    const token = availableSizeTokens[clampedIdx]
                    return token?.label || '—'
                  }
                  
                  const minToken = availableSizeTokens[0]
                  const maxToken = availableSizeTokens[availableSizeTokens.length - 1]
                  
                  // Get tooltip text - show token name (key) in tooltip
                  // availableSizeTokens have a 'name' property which is the token key (e.g., 'sm', 'md', 'lg')
                  // Extract just the key part if it's in format "size/key"
                  const tokenKey = currentToken?.name?.includes('/') 
                    ? currentToken.name.split('/').pop() || currentToken.name
                    : currentToken?.name || ''
                  const tooltipText = tokenKey || currentToken?.label || '—'
                  
                  return (
                    <Slider
                      key={entry.cssVar}
                      value={clampedTokenIndex}
                      onChange={(val) => {
                        const rawIdx = typeof val === 'number' ? val : val[0]
                        // Round to nearest integer to ensure we only use discrete token indices
                        const idx = Math.round(rawIdx)
                        // Clamp to valid range
                        const clampedIdx = Math.max(0, Math.min(availableSizeTokens.length - 1, idx))
                        setSliderValues((prev) => ({ ...prev, [entry.cssVar]: clampedIdx }))
                      }}
                      onChangeCommitted={(val) => {
                        const rawIdx = typeof val === 'number' ? val : val[0]
                        // Round to nearest integer to ensure we only use discrete token indices
                        const idx = Math.round(rawIdx)
                        // Clamp to valid range
                        const clampedIdx = Math.max(0, Math.min(availableSizeTokens.length - 1, idx))
                        updateDimension(entry.path, clampedIdx)
                        setSliderValues((prev) => {
                          const next = { ...prev }
                          delete next[entry.cssVar]
                          return next
                        })
                      }}
                      min={0}
                      max={availableSizeTokens.length - 1}
                      step={1}
                      layer="layer-0"
                      layout="side-by-side"
                      tooltipText={tooltipText}
                      label={<Label layer="layer-0" layout="side-by-side" size="small">{toTitleCase(entry.label)}</Label>}
                      showInput={false}
                      showValueLabel={true}
                      valueLabel={getValueLabel}
                      minLabel={minToken?.label || 'None'}
                      maxLabel={maxToken?.label || 'Xl'}
                      disabled={isNone}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
