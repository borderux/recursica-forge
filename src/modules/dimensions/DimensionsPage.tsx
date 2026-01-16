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
import { Button } from '../../components/adapters/Button'
import { iconNameToReactComponent } from '../components/iconUtils'

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

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`

  // Get available size tokens
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.sizes || (tokensJson as any)?.tokens?.size || {}
      Object.keys(src).filter((k) => !k.startsWith('$')).forEach((k) => {
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
      // Sort: none first, then default, then numeric order
      if (a.name === 'none') return -1
      if (b.name === 'none') return 1
      if (a.name === 'default') return -1
      if (b.name === 'default') return 1
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

  // Local state to track slider values during drag
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})

  const updateDimension = (path: string[], value: number) => {
    // Find the closest size token to the value
    let closestToken = availableSizeTokens[0]?.name || 'default'
    let minDiff = Infinity
    
    availableSizeTokens.forEach((token) => {
      const diff = Math.abs(token.value - value)
      if (diff < minDiff) {
        minDiff = diff
        closestToken = token.name
      }
    })

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
    const tokenRef = `{tokens.size.${closestToken}}`
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
  const sectionOrder = ['general', 'spacers', 'icons', 'gutters', 'border-radii']
  
  // Sort category keys according to section order, then alphabetically for any not in the order
  const categoryKeys = useMemo(() => {
    const ordered: (string | undefined)[] = new Array(sectionOrder.length).fill(undefined)
    const unordered: string[] = []
    
    Object.keys(groupedDimensions).forEach((key) => {
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
    // Reset all dimensions in this category to their original token references
    const themeCopy = JSON.parse(JSON.stringify(themeJson))
    const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
    const dims = root?.dimensions
    if (!dims) return

    groupedDimensions[category].forEach((entry) => {
      let node = dims
      for (let i = 0; i < entry.path.length - 1; i++) {
        if (!node[entry.path[i]]) return
        node = node[entry.path[i]]
      }
      const leaf = entry.path[entry.path.length - 1]
      if (entry.currentToken) {
        const tokenRef = `{tokens.size.${entry.currentToken}}`
        node[leaf] = {
          $type: 'number',
          $value: tokenRef,
        }
      }
    })

    setTheme(themeCopy)
  }

  return (
    <div style={{ padding: 'var(--recursica-brand-dimensions-spacers-lg)' }}>
      <h1 style={{
        margin: 0,
        marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)',
        fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
        fontSize: 'var(--recursica-brand-typography-h1-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
        color: `var(${layer0Base}-element-text-color)`,
        opacity: `var(${layer0Base}-element-text-high-emphasis)`,
      }}>
        Dimensions
      </h1>

      {/* Grid layout: 2 columns, tiling sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--recursica-brand-dimensions-spacers-lg)',
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
                padding: 'var(--recursica-brand-dimensions-spacers-xl)',
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
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-high-emphasis)`,
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
              <div style={{ display: 'grid', gap: 0 }}>
                {categoryEntries.map((entry, index) => {
                  const isLast = index === categoryEntries.length - 1
                  const currentValue = sliderValues[entry.cssVar] ?? entry.currentValue
                  const isNone = entry.label.toLowerCase() === 'none'
                  
                  return (
                    <div
                      key={entry.cssVar}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto',
                        gap: 'var(--recursica-brand-dimensions-spacers-md)',
                        alignItems: 'center',
                        paddingTop: 0,
                        paddingBottom: isLast ? 0 : 'var(--recursica-brand-dimensions-gutters-vertical)',
                      }}
                    >
                      <label htmlFor={entry.cssVar} style={{
                        fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        color: `var(${layer0Base}-element-text-color)`,
                        opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                        minWidth: 80,
                      }}>
                        {toTitleCase(entry.label)}
                      </label>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Slider
                          value={currentValue}
                          onChange={(val) => {
                            const num = typeof val === 'number' ? val : val[0]
                            setSliderValues((prev) => ({ ...prev, [entry.cssVar]: num }))
                          }}
                          onChangeCommitted={(val) => {
                            const num = typeof val === 'number' ? val : val[0]
                            updateDimension(entry.path, num)
                            setSliderValues((prev) => {
                              const next = { ...prev }
                              delete next[entry.cssVar]
                              return next
                            })
                          }}
                          min={0}
                          max={64}
                          step={1}
                          layer="layer-0"
                          disabled={isNone}
                        />
                      </div>
                      <input
                        type="number"
                        value={Math.round(currentValue)}
                        onChange={(e) => {
                          if (isNone) return
                          const next = Number(e.currentTarget.value)
                          if (Number.isFinite(next) && next >= 0 && next <= 64) {
                            setSliderValues((prev) => ({ ...prev, [entry.cssVar]: next }))
                            updateDimension(entry.path, next)
                          }
                        }}
                        onBlur={() => {
                          if (isNone) return
                          setSliderValues((prev) => {
                            const next = { ...prev }
                            delete next[entry.cssVar]
                            return next
                          })
                        }}
                        disabled={isNone}
                        readOnly={isNone}
                        style={{
                          width: 60,
                          padding: 'var(--recursica-brand-dimensions-spacers-xs) var(--recursica-brand-dimensions-spacers-sm)',
                          border: `1px solid var(${layer1Base}-border-color)`,
                          borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                          background: `var(${layer0Base}-surface)`,
                          color: `var(${layer0Base}-element-text-color)`,
                          fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                          textAlign: 'center',
                        }}
                      />
                      <span style={{
                        fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        color: `var(${layer0Base}-element-text-color)`,
                        opacity: `var(${layer0Base}-element-text-medium-emphasis)`,
                        minWidth: 20,
                      }}>
                        px
                      </span>
                    </div>
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
