import { useEffect, useMemo, useState } from 'react'
import tokensJson from '../../vars/Tokens.json'
import { extractCssVarsFromObject, applyCssVars } from '../theme/varsUtil'

type TokenEntry = {
  collection?: string
  mode?: string
  name: string
  type?: string
  value: string | number
}

type ModeName = 'Mode 1' | 'Mode 2' | string

export default function TokensPage() {
  const [values, setValues] = useState<Record<string, string | number>>({})

  const groupedByMode = useMemo(() => {
    const byMode: Record<ModeName, Array<{ key: string; entry: TokenEntry }>> = {}
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([key, entry]) => {
      if (!entry || !entry.name) return
      const mode = entry.mode as ModeName || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = []
      byMode[mode].push({ key, entry })
    })
    // Stable sort by token name
    Object.values(byMode).forEach((arr) => arr.sort((a, b) => a.entry.name.localeCompare(b.entry.name)))
    return byMode
  }, [])

  const colorFamiliesByMode = useMemo(() => {
    const byMode: Record<ModeName, Record<string, Array<{ level: string; entry: TokenEntry }>>> = {}
    Object.values(groupedByMode).forEach(() => {}) // force dependency for TS
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([_, entry]) => {
      if (!entry || entry.type !== 'color') return
      if (!entry.name.startsWith('color/')) return
      const parts = entry.name.split('/')
      if (parts.length < 3) return
      const family = parts[1]
      const level = parts[2]
      if (!/^\d{3,4}$/.test(level)) return
      const mode = (entry.mode as ModeName) || 'Mode 1'
      if (!byMode[mode]) byMode[mode] = {}
      if (!byMode[mode][family]) byMode[mode][family] = []
      byMode[mode][family].push({ level, entry })
    })
    // sort each family numerically descending (e.g., 1000, 900 ... 050, 000)
    const levelToNum = (lvl: string) => Number(lvl)
    Object.values(byMode).forEach((fam) => {
      Object.keys(fam).forEach((k) => {
        fam[k] = fam[k].sort((a, b) => levelToNum(b.level) - levelToNum(a.level))
      })
    })
    return byMode
  }, [groupedByMode])

  useEffect(() => {
    // Initialize form values from tokens JSON
    const init: Record<string, string | number> = {}
    Object.entries(tokensJson as Record<string, TokenEntry>).forEach(([_, entry]) => {
      if (!entry || !entry.name) return
      init[entry.name] = entry.value
    })
    setValues(init)
  }, [])

  const handleChange = (tokenName: string, next: string) => {
    setValues((prev) => ({ ...prev, [tokenName]: next }))
  }

  const handleApply = () => {
    // Convert token map back to CSS variables and apply
    const map: Record<string, any> = {}
    Object.entries(values).forEach(([tokenName, v]) => {
      map[tokenName] = v
    })
    const cssVars = extractCssVarsFromObject(map)
    applyCssVars(cssVars)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Tokens</h2>
      {Object.entries(groupedByMode).map(([mode, items]) => (
        <section key={mode} style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{mode === 'Mode 1' ? 'Color' : mode === 'Mode 2' ? 'Dark Mode' : mode}</h3>
          {/* Color families laid out horizontally (900 -> 050) */}
          {colorFamiliesByMode[mode as ModeName] && (
            <div style={{ display: 'grid', gap: 16 }}>
              {Object.entries(colorFamiliesByMode[mode as ModeName])
                .sort(([a], [b]) => {
                  // Put gray first
                  if (a === 'gray' && b !== 'gray') return -1
                  if (b === 'gray' && a !== 'gray') return 1
                  return a.localeCompare(b)
                })
                .map(([family, levels]) => (
                <div key={family}>
                  <input defaultValue={family} style={{ fontSize: 13, marginBottom: 6, padding: '4px 8px', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, width: 200 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${levels.length}, 1fr)`, gap: 0 }}>
                    {levels.map(({ level }) => (
                      <div key={family + '-' + level + '-label'} style={{ textAlign: 'center', fontSize: 12, opacity: 0.8, paddingBottom: 4 }}>{level}</div>
                    ))}
                    {levels.map(({ level, entry }) => {
                      let inputEl: HTMLInputElement | null = null
                      const current = String(values[entry.name] ?? entry.value)
                      return (
                        <div key={family + '-' + level}>
                          <div
                            onClick={() => inputEl && inputEl.click()}
                            role="button"
                            title={`${entry.name} ${entry.value}`}
                            style={{ height: 72, borderRadius: 0, background: current, cursor: 'pointer' }}
                          />
                          <input
                            ref={(el) => { inputEl = el }}
                            type="color"
                            value={/^#([0-9a-f]{6})$/i.test(current) ? current : '#000000'}
                            onChange={(e) => handleChange(entry.name, e.currentTarget.value)}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Measurements (non-color tokens) */}
          {(() => {
            const measurementItems = items.filter(({ entry }) => entry.type !== 'color' && (typeof entry.value === 'number' || typeof entry.value === 'string'))
            if (!measurementItems.length) return null
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Measurements</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 8, alignItems: 'center' }}>
                  {measurementItems.map(({ entry }) => (
                    <>
                      <label key={entry.name + '-label'} htmlFor={entry.name} style={{ fontSize: 13, opacity: 0.9 }}>{entry.name}</label>
                      <input
                        key={entry.name}
                        id={entry.name}
                        type={typeof entry.value === 'number' ? 'number' : 'text'}
                        value={(values[entry.name] as any) ?? (entry.value as any)}
                        onChange={(e) => handleChange(entry.name, e.currentTarget.value)}
                      />
                    </>
                  ))}
                </div>
              </div>
            )
          })()}
        </section>
      ))}
      <div>
        <button onClick={handleApply} style={{ padding: '6px 12px', borderRadius: 6 }}>Apply tokens</button>
      </div>
    </div>
  )
}


