/**
 * FontFamiliesTokens
 *
 * Editor for font family and typeface tokens. Uses position-based sequential naming:
 * - First row is always "primary" (cannot be deleted)
 * - Second row is always "secondary", third "tertiary", etc.
 * - Deleting a row renumbers all subsequent rows
 * - CSS variables are updated to match the new names
 */
import { useEffect, useMemo, useState } from 'react'
import { useVars } from '../../vars/VarsContext'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'
import { removeCssVar } from '../../../core/css/updateCssVar'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { getVarsStore } from '../../../core/store/varsStore'
import { CustomFontModal } from '../../type/CustomFontModal'
import { storeCustomFont, loadFontFromNpm, loadFontFromGit } from '../../type/fontUtils'

type FamilyRow = { name: string; value: string; position: number }

const ORDER = ['primary','secondary','tertiary','quaternary','quinary','senary','septenary','octonary']

export default function FontFamiliesTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const [fonts, setFonts] = useState<string[]>(["Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Source Sans 3","Nunito","Raleway","Merriweather","PT Sans","Ubuntu","Noto Sans","Playfair Display","Work Sans","Rubik","Fira Sans","Manrope","Crimson Pro","Space Grotesk","Custom..."])
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customModalRowName, setCustomModalRowName] = useState<string | null>(null)

  // Build rows from overrides, falling back to tokens.json if overrides are empty
  const buildRows = (): FamilyRow[] => {
    const overrides = readOverrides()
    const rows: FamilyRow[] = []
    
    // Collect font/typeface entries from overrides
    const typefaceEntries: Array<{ name: string; value: string }> = []
    
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const value = String(overrides[name] || '')
        typefaceEntries.push({ name, value })
      }
    })
    
    // If no overrides exist, initialize from tokens.json (for first load/reset)
    if (typefaceEntries.length === 0) {
      try {
        const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
        const typeface: any = fontRoot?.typeface || {}
        Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => {
          const name = `font/typeface/${k}`
          const val = typeface[k]?.$value
          typefaceEntries.push({ name, value: typeof val === 'string' && val ? val : '' })
        })
        
        // Write to overrides to persist the initialization
        if (typefaceEntries.length > 0) {
          const initialOverrides: Record<string, any> = { ...overrides }
          typefaceEntries.forEach((entry) => {
            initialOverrides[entry.name] = entry.value
          })
          writeOverrides(initialOverrides)
        }
      } catch {}
    }
    
    // Sort entries by their key name to maintain consistent ordering
    typefaceEntries.sort((a, b) => {
      const aKey = a.name.replace('font/typeface/', '')
      const bKey = b.name.replace('font/typeface/', '')
      const aIndex = ORDER.indexOf(aKey)
      const bIndex = ORDER.indexOf(bKey)
      // Known sequential names come first, then others
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return aKey.localeCompare(bKey)
    })
    
    // Assign sequential names based on position
    typefaceEntries.forEach((entry, index) => {
      const sequentialName = ORDER[index] || `custom-${index + 1}`
      const newName = `font/typeface/${sequentialName}`
      rows.push({
        name: newName,
        value: entry.value,
        position: index
      })
    })
    
    return rows
  }

  const [rows, setRows] = useState<FamilyRow[]>(() => buildRows())

  // Ensure at least primary exists
  useEffect(() => {
    if (rows.length === 0) {
      const name = 'font/typeface/primary'
      const all = readOverrides()
      const updated = { ...all, [name]: '' }
      writeOverrides(updated)
      setRows([{ name, value: '', position: 0 }])
      try {
        window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated } }))
      } catch {}
    }
  }, [rows.length])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, reset } = detail
      if (all && typeof all === 'object') {
        // Only rebuild if this event wasn't triggered by our own renumbering
        // Check if the event has a flag indicating it's from renumbering
        if (!detail.skipRebuild) {
          setRows(buildRows())
        }
        if (reset) {
          // On reset, clear all font/typeface overrides and rebuild from tokens.json
          const allOverrides = readOverrides()
          const updated: Record<string, any> = {}
          
          // Keep all non-font entries
          Object.keys(allOverrides).forEach((k) => {
            if (!k.startsWith('font/typeface/')) {
              updated[k] = allOverrides[k]
            }
          })
          
          // Add font/typeface entries from tokens.json (including empty ones)
          try {
            const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
            const typeface: any = fontRoot?.typeface || {}
            Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => {
              const val = typeface[k]?.$value
              updated[`font/typeface/${k}`] = typeof val === 'string' && val ? val : ''
            })
          } catch {}
          
          writeOverrides(updated)
          setRows(buildRows())
        }
      }
    }
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [tokensJson])

  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_FONTS_API_KEY as string | undefined
    if (!apiKey) return
    fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`).then(async (r) => {
      if (!r.ok) return
      const data = await r.json()
      if (data && Array.isArray(data.items)) {
        const names = data.items.map((it: any) => String(it.family)).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b))
        setFonts([...names, 'Custom...'])
      }
    }).catch(() => {})
  }, [])

  const toTitle = (s: string) => (s || '').replace(/[-_/]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()).trim()

  // Renumber rows after deletion - update overrides and CSS variables
  const renumberRows = (deletedIndex: number) => {
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-font entries
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('font/typeface/')) {
        updated[k] = all[k]
      }
    })
    
    // Use current rows state to get the actual values
    const rowsToKeep = rows.filter((_, idx) => idx !== deletedIndex)
    
    // Remove CSS variables for the deleted row
    if (deletedIndex < rows.length) {
      const deletedRow = rows[deletedIndex]
      const deletedKey = deletedRow.name.replace('font/typeface/', '')
      removeCssVar(`--tokens-font-typeface-${deletedKey}`)
      removeCssVar(`--recursica-tokens-font-typeface-${deletedKey}`)
    }
    
    // Remove CSS variables for rows that will be renamed
    rowsToKeep.forEach((row, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      const newName = `font/typeface/${sequentialName}`
      
      // If the name changed, remove old CSS variable
      if (row.name !== newName) {
        const oldKey = row.name.replace('font/typeface/', '')
        removeCssVar(`--tokens-font-typeface-${oldKey}`)
        removeCssVar(`--recursica-tokens-font-typeface-${oldKey}`)
      }
    })
    
    // IMPORTANT: Clear ALL font/typeface entries first, then rebuild with sequential names
    // This prevents duplicates from old entries
    const newRows = rowsToKeep.map((row, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      const newName = `font/typeface/${sequentialName}`
      updated[newName] = row.value
      return {
        name: newName,
        value: row.value,
        position: newIndex
      }
    })
    
    writeOverrides(updated)
    
    // Update state immediately with renumbered rows
    setRows(newRows)
    
    // Trigger recompute to update CSS variables with new names
    setTimeout(() => {
      try {
        const store = getVarsStore()
        store.setTokens(store.getState().tokens)
      } catch {}
    }, 0)
    
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, skipRebuild: true } }))
    } catch {}
  }

  const handleAdd = () => {
    const all = readOverrides()
    const nextIndex = rows.length
    const sequentialName = ORDER[nextIndex] || `custom-${nextIndex + 1}`
    const name = `font/typeface/${sequentialName}`
    const updated = { ...all, [name]: '' }
    writeOverrides(updated)
    setRows(buildRows())
    
    // Update token in store (creates entry in tokens.json structure)
    updateToken(name, '')
    
    // Trigger recompute to create CSS variable
    setTimeout(() => {
      try {
        const store = getVarsStore()
        store.setTokens(store.getState().tokens)
      } catch {}
    }, 0)
    
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { name, value: '', all: updated } }))
    } catch {}
  }

  const handleDelete = (index: number) => {
    if (index === 0) return // Cannot delete primary
    if (rows.length <= 1) return // Must have at least one row
    
    // Renumber all subsequent rows (this will also remove CSS variables)
    renumberRows(index)
  }

  return (
    <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Families</div>
        <button
          type="button"
          onClick={handleAdd}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
        >+Font Family</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(240px, 1fr) auto', gap: 8, alignItems: 'center' }}>
        {rows.map((r, index) => {
          const label = toTitle(ORDER[index] || `custom-${index + 1}`)
          const options = (() => {
            // Exclude families already selected in other rows to prevent duplicates
            const used = new Set(rows.filter((x, idx) => idx !== index).map((x) => x.value).filter((v) => v && v !== 'Custom...'))
            // Union of built-in fonts, token-defined families, and override-only families
            const set = new Set<string>()
            fonts.forEach((f) => { if (f && f !== 'Custom...') set.add(f) })
            try {
              const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
              const fams: any = fontRoot?.family || {}
              const typeface: any = fontRoot?.typeface || {}
              Object.keys(fams).filter((k) => !k.startsWith('$')).forEach((k) => { const v = String(fams[k]?.$value || ''); if (v) set.add(v) })
              Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => { const v = String(typeface[k]?.$value || ''); if (v) set.add(v) })
            } catch {}
            try {
              const ov = readOverrides() as Record<string, any>
              Object.entries(ov || {}).forEach(([name, val]) => {
                if (name.startsWith('font/family/')) { const v = String(val || ''); if (v) set.add(v) }
              })
            } catch {}
            let list = Array.from(set)
              .filter((f) => !used.has(f))
              .sort((a, b) => a.localeCompare(b))
            // Ensure the current value is present so the control shows it
            if (r.value && !list.includes(r.value)) list = [r.value, ...list]
            return [...list, 'Custom...']
          })()
          const isCustom = !options.includes(r.value) && r.value !== '' && r.value !== 'Custom...'
          
          return (
            <span key={r.name} style={{ display: 'contents' }}>
              <label key={r.name + '-label'} htmlFor={r.name} style={{ fontSize: 13, opacity: 0.9 }}>{label}</label>
              {isCustom ? (
                <input
                  key={r.name + '-custom'}
                  id={r.name}
                  type="text"
                  value={r.value}
                  onChange={(ev) => {
                    const next = ev.currentTarget.value
                    const all = readOverrides()
                    const updated = { ...all, [r.name]: next }
                    writeOverrides(updated)
                    setRows(buildRows())
                    
                    // Update token in store (updates tokens.json structure)
                    updateToken(r.name, next)
                    
                    // Trigger recompute to regenerate CSS variables from overrides
                    setTimeout(() => {
                      try {
                        const store = getVarsStore()
                        store.setTokens(store.getState().tokens)
                      } catch {}
                    }, 0)
                  }}
                  placeholder="Enter font family"
                />
              ) : (
                <select
                  key={r.name}
                  id={r.name}
                  value={r.value || ''}
                  onChange={(ev) => {
                    const chosen = ev.currentTarget.value
                    if (chosen === 'Custom...') {
                      // Open custom font modal
                      setCustomModalRowName(r.name)
                      setCustomModalOpen(true)
                      return
                    }
                    const all = readOverrides()
                    const updated = { ...all, [r.name]: chosen }
                    writeOverrides(updated)
                    setRows(buildRows())
                    
                    // Update token in store (updates tokens.json structure)
                    updateToken(r.name, chosen)
                    
                    // Trigger recompute to regenerate CSS variables from overrides
                    setTimeout(() => {
                      try {
                        const store = getVarsStore()
                        store.setTokens(store.getState().tokens)
                      } catch {}
                    }, 0)
                  }}
                  style={{ width: '100%' }}
                >
                  <option value=""></option>
                  {options.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
              <button
                key={r.name + '-delete'}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleDelete(index)
                }}
                title={index === 0 ? "Cannot delete primary" : "Delete"}
                disabled={index === 0 || rows.length <= 1}
                style={{ border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: (index === 0 || rows.length <= 1) ? 'not-allowed' : 'pointer', borderRadius: 6, padding: '6px 8px', opacity: (index === 0 || rows.length <= 1) ? 0.5 : 1 }}
              >🗑️</button>
            </span>
          )
        })}
      </div>
      
      <CustomFontModal
        open={customModalOpen}
        onClose={() => {
          setCustomModalOpen(false)
          setCustomModalRowName(null)
        }}
        onAccept={async (fontName, fontSource) => {
          if (!customModalRowName) return
          
          try {
            // Handle npm/git sources
            if (fontSource.type === 'npm') {
              await loadFontFromNpm(fontName, fontSource.url)
            } else if (fontSource.type === 'git') {
              const [repoUrl, fontPath] = fontSource.url.split('#')
              await loadFontFromGit(fontName, repoUrl, fontPath || 'fonts')
            }
            
            // Store custom font info
            storeCustomFont(fontName, undefined, fontSource)
            
            // Update the row with the font name
            const all = readOverrides()
            const updated = { ...all, [customModalRowName]: fontName }
            writeOverrides(updated)
            setRows(buildRows())
            
            // Update token in store
            updateToken(customModalRowName, fontName)
            
            // Trigger recompute
            setTimeout(() => {
              try {
                const store = getVarsStore()
                store.setTokens(store.getState().tokens)
              } catch {}
            }, 0)
            
            // Close modal
            setCustomModalOpen(false)
            setCustomModalRowName(null)
          } catch (error) {
            console.error('Failed to add custom font:', error)
            alert(`Failed to add custom font: ${error instanceof Error ? error.message : String(error)}`)
          }
        }}
      />
    </section>
  )
}
