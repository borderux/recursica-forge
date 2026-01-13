/**
 * DimensionsPage
 *
 * Page for mapping brand dimensions to underlying size tokens.
 */
import { useMemo, useState } from 'react'
import { useVars } from '../vars/VarsContext'
import { useThemeMode } from '../theme/ThemeModeContext'

type DimensionEntry = {
  path: string[]
  label: string
  currentToken: string | null
  cssVar: string
}

export default function DimensionsPage() {
  const { tokens: tokensJson, theme: themeJson, setTheme } = useVars()
  const { mode } = useThemeMode()

  // Get available size tokens
  const availableSizeTokens = useMemo(() => {
    const tokens: Array<{ name: string; value: number; label: string }> = []
    try {
      const src: any = (tokensJson as any)?.tokens?.size || {}
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

  // Extract dimensions from theme JSON
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
          const label = labelPrefix ? `${labelPrefix} ${key}` : key

          if (value && typeof value === 'object' && '$value' in value && '$type' in value) {
            // This is a dimension value
            const tokenRef = value.$value
            let tokenName: string | null = null
            if (typeof tokenRef === 'string') {
              const parsed = parseTokenReference(tokenRef)
              if (parsed && parsed.type === 'token' && parsed.path.length >= 2 && parsed.path[0] === 'size') {
                tokenName = parsed.path.slice(1).join('.')
              }
            }
            const cssVarName = `--recursica-brand-dimensions-${currentPath.join('-')}`
            entries.push({ path: currentPath, label, currentToken: tokenName, cssVar: cssVarName })
          } else if (value && typeof value === 'object') {
            // Continue traversing
            traverse(value, currentPath, label)
          }
        })
      }

      traverse(dims, [], '')
    } catch {}
    return entries
  }, [themeJson])

  const updateDimension = (path: string[], tokenName: string) => {
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
    const tokenRef = `{tokens.size.${tokenName}}`
    node[leaf] = {
      $type: 'number',
      $value: tokenRef,
    }

    setTheme(themeCopy)
  }

  // Group dimensions by category
  const groupedDimensions = useMemo(() => {
    const groups: Record<string, DimensionEntry[]> = {}
    dimensions.forEach((entry) => {
      const category = entry.path[0] || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(entry)
    })
    return groups
  }, [dimensions])

  return (
    <div style={{ padding: 'var(--recursica-brand-dimensions-spacers-lg)' }}>
      <h2 style={{ marginTop: 0 }}>Dimensions</h2>
      <p style={{ color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`, opacity: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-low-emphasis)` }}>
        Map brand dimensions to underlying size tokens. Changes will update CSS variables throughout the application.
      </p>

      {Object.keys(groupedDimensions).sort().map((category) => (
        <div key={category} style={{ marginBottom: 'var(--recursica-brand-dimensions-spacers-xl)' }}>
          <h3 style={{ textTransform: 'capitalize', marginBottom: 'var(--recursica-brand-dimensions-spacers-default)' }}>
            {category.replace('-', ' ')}
          </h3>
          <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
            {groupedDimensions[category].map((entry) => (
              <div
                key={entry.cssVar}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr 200px',
                  gap: 'var(--recursica-brand-dimensions-spacers-default)',
                  alignItems: 'center',
                  padding: 'var(--recursica-brand-dimensions-spacers-default)',
                  backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`,
                  border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                  borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                }}
              >
                <div style={{ fontWeight: 500 }}>{entry.label}</div>
                <div style={{ fontSize: 'var(--recursica-brand-dimensions-sm)', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`, opacity: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-low-emphasis)` }}>
                  {entry.cssVar}
                </div>
                <select
                  value={entry.currentToken || ''}
                  onChange={(e) => {
                    const tokenName = e.target.value
                    if (tokenName) {
                      updateDimension(entry.path, tokenName)
                    }
                  }}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-spacers-sm) var(--recursica-brand-dimensions-spacers-default)',
                    border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                    backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)`,
                    color: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-element-text-color)`,
                    fontSize: 'var(--recursica-brand-dimensions-sm)',
                  }}
                >
                  <option value="">Select token...</option>
                  {availableSizeTokens.map((token) => (
                    <option key={token.name} value={token.name}>
                      {token.label} ({token.value}px)
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

