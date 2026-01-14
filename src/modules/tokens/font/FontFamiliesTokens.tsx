/**
 * FontFamiliesTokens
 *
 * Editor for font family and typeface tokens. Shows cards with font previews and weight selectors.
 */
import { useEffect, useMemo, useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { useVars } from '../../vars/VarsContext'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'
import { removeCssVar } from '../../../core/css/updateCssVar'
import { getVarsStore } from '../../../core/store/varsStore'
import { CustomFontModal } from '../../type/CustomFontModal'
import { storeCustomFont, loadFontFromNpm, loadFontFromGit, ensureFontLoaded } from '../../type/fontUtils'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'

type FamilyRow = { name: string; value: string; position: number }

const ORDER = ['primary','secondary','tertiary','quaternary','quinary','senary','septenary','octonary']
const FONT_WEIGHTS = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
const EXAMPLE_TEXT = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

// Export AddButton component for use in header
export function AddButton() {
  const { updateToken } = useVars()
  const [rows, setRows] = useState<FamilyRow[]>([])
  const { mode } = useThemeMode()
  
  const buildRows = (): FamilyRow[] => {
    const overrides = readOverrides()
    const rows: FamilyRow[] = []
    const typefaceEntries: Array<{ name: string; value: string }> = []
    
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const value = String(overrides[name] || '')
        typefaceEntries.push({ name, value })
      }
    })
    
    typefaceEntries.sort((a, b) => {
      const aKey = a.name.replace('font/typeface/', '')
      const bKey = b.name.replace('font/typeface/', '')
      const aIndex = ORDER.indexOf(aKey)
      const bIndex = ORDER.indexOf(bKey)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return aKey.localeCompare(bKey)
    })
    
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

  useEffect(() => {
    setRows(buildRows())
    const handler = () => setRows(buildRows())
    window.addEventListener('tokenOverridesChanged', handler)
    return () => window.removeEventListener('tokenOverridesChanged', handler)
  }, [])

  const handleAdd = () => {
    const all = readOverrides()
    const nextIndex = rows.length
    const sequentialName = ORDER[nextIndex] || `custom-${nextIndex + 1}`
    const name = `font/typeface/${sequentialName}`
    const updated = { ...all, [name]: '' }
    writeOverrides(updated)
    setRows(buildRows())
    updateToken(name, '')
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

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const interactiveColor = `--recursica-brand-${mode}-palettes-core-interactive`

  return (
    <Button
      variant="solid"
      size="default"
      onClick={handleAdd}
      icon={(() => {
        const PlusIcon = iconNameToReactComponent('plus')
        return PlusIcon ? <PlusIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
      })()}
      style={{
        backgroundColor: `var(${interactiveColor})`,
        color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`,
      }}
    >
      Add font family
    </Button>
  )
}

export default function FontFamiliesTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const { mode } = useThemeMode()
  const [fonts, setFonts] = useState<string[]>(["Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Source Sans 3","Nunito","Raleway","Merriweather","PT Sans","Ubuntu","Noto Sans","Playfair Display","Work Sans","Rubik","Fira Sans","Manrope","Crimson Pro","Space Grotesk","Custom..."])
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customModalRowName, setCustomModalRowName] = useState<string | null>(null)
  const [showInspiration, setShowInspiration] = useState(true)
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({})

  const buildRows = (): FamilyRow[] => {
    const overrides = readOverrides()
    const rows: FamilyRow[] = []
    const typefaceEntries: Array<{ name: string; value: string }> = []
    
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const value = String(overrides[name] || '')
        typefaceEntries.push({ name, value })
      }
    })
    
    if (typefaceEntries.length === 0) {
      try {
        const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
        const typeface: any = fontRoot?.typeface || {}
        Object.keys(typeface).filter((k) => !k.startsWith('$')).forEach((k) => {
          const name = `font/typeface/${k}`
          const val = typeface[k]?.$value
          typefaceEntries.push({ name, value: typeof val === 'string' && val ? val : '' })
        })
        if (typefaceEntries.length > 0) {
          const initialOverrides: Record<string, any> = { ...overrides }
          typefaceEntries.forEach((entry) => {
            initialOverrides[entry.name] = entry.value
          })
          writeOverrides(initialOverrides)
        }
      } catch {}
    }
    
    typefaceEntries.sort((a, b) => {
      const aKey = a.name.replace('font/typeface/', '')
      const bKey = b.name.replace('font/typeface/', '')
      const aIndex = ORDER.indexOf(aKey)
      const bIndex = ORDER.indexOf(bKey)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return aKey.localeCompare(bKey)
    })
    
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
        if (!detail.skipRebuild) {
          setRows(buildRows())
        }
        if (reset) {
          const allOverrides = readOverrides()
          const updated: Record<string, any> = {}
          Object.keys(allOverrides).forEach((k) => {
            if (!k.startsWith('font/typeface/')) {
              updated[k] = allOverrides[k]
            }
          })
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

  const handleDelete = (index: number) => {
    if (index === 0) return
    if (rows.length <= 1) return
    
    const all = readOverrides()
    const updated: Record<string, any> = {}
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('font/typeface/')) {
        updated[k] = all[k]
      }
    })
    
    const rowsToKeep = rows.filter((_, idx) => idx !== index)
    if (index < rows.length) {
      const deletedRow = rows[index]
      const deletedKey = deletedRow.name.replace('font/typeface/', '')
      removeCssVar(`--tokens-font-typeface-${deletedKey}`)
      removeCssVar(`--recursica-tokens-font-typefaces-${deletedKey}`)
    }
    
    rowsToKeep.forEach((row, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      const newName = `font/typeface/${sequentialName}`
      if (row.name !== newName) {
        const oldKey = row.name.replace('font/typeface/', '')
        removeCssVar(`--tokens-font-typeface-${oldKey}`)
        removeCssVar(`--recursica-tokens-font-typefaces-${oldKey}`)
      }
    })
    
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
    setRows(newRows)
    
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

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const interactiveColor = `--recursica-brand-${mode}-palettes-core-interactive`
  const buttonTextBg = getComponentCssVar('Button', 'color', 'text-background', 'layer-0')
  const buttonTextText = getComponentCssVar('Button', 'color', 'text-text', 'layer-0')
  const buttonSolidBg = getComponentCssVar('Button', 'color', 'solid-background', 'layer-0')
  const buttonSolidText = getComponentCssVar('Button', 'color', 'solid-text', 'layer-0')
  const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
  const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--recursica-brand-dimensions-spacers-lg)' }}>
        {rows.map((r, index) => {
          const label = toTitle(ORDER[index] || `custom-${index + 1}`)
          const fontFamilyVar = `--recursica-tokens-font-typefaces-${ORDER[index] || `custom-${index + 1}`}`
          const selectedWeight = selectedWeights[r.name] || 'regular'
          
          return (
            <div
              key={r.name}
              style={{
                background: `var(${layer0Base}-surface)`,
                border: `1px solid var(${layer1Base}-border-color)`,
                borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                padding: 'var(--recursica-brand-dimensions-spacers-lg)',
                display: 'grid',
                gap: 'var(--recursica-brand-dimensions-spacers-md)',
                position: 'relative',
              }}
            >
              {index > 0 && (
                <button
                  onClick={() => handleDelete(index)}
                  style={{
                    position: 'absolute',
                    top: 'var(--recursica-brand-dimensions-spacers-md)',
                    right: 'var(--recursica-brand-dimensions-spacers-md)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 'var(--recursica-brand-dimensions-spacers-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    const XIcon = iconNameToReactComponent('x-mark')
                    return XIcon ? <XIcon style={{ width: 20, height: 20, color: `var(${layer0Base}-element-text-color)`, opacity: 0.6 }} /> : null
                  })()}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
                <h3 style={{ 
                  margin: 0,
                  fontSize: 'var(--recursica-brand-typography-h6-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-h6-font-weight)',
                  color: `var(${layer0Base}-element-text-color)`,
                  opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                }}>
                  {r.value || 'Select font'}
                </h3>
                <span style={{
                  padding: `calc(var(--recursica-brand-dimensions-spacers-xs) / 2) var(--recursica-brand-dimensions-spacers-default)`,
                  borderRadius: `var(${buttonBorderRadius})`,
                  background: `var(${interactiveColor})`,
                  color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`,
                  fontSize: 'var(--recursica-brand-typography-caption-font-size)',
                  fontWeight: 600,
                }}>
                  {label}
                </span>
              </div>
              <div style={{
                fontFamily: `var(${fontFamilyVar})`,
                fontSize: 'var(--recursica-brand-typography-body-font-size)',
                color: `var(${layer0Base}-element-text-color)`,
                opacity: `var(${layer0Base}-element-text-high-emphasis)`,
                lineHeight: 1.5,
              }}>
                {EXAMPLE_TEXT}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--recursica-brand-dimensions-spacers-xs)' }}>
                {FONT_WEIGHTS.map((weight) => {
                  const isSelected = selectedWeight === weight
                  return (
                    <button
                      key={weight}
                      onClick={() => setSelectedWeights({ ...selectedWeights, [r.name]: weight })}
                      style={{
                        height: `var(${buttonHeight})`,
                        paddingLeft: `var(${buttonPadding})`,
                        paddingRight: `var(${buttonPadding})`,
                        border: 'none',
                        background: isSelected ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
                        color: isSelected ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
                        borderRadius: `var(${buttonBorderRadius})`,
                        cursor: 'pointer',
                        fontSize: 'var(--recursica-brand-typography-button-font-size)',
                        fontWeight: isSelected ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {toTitle(weight)}
                    </button>
                  )
                })}
              </div>
                <select
                  value={r.value || ''}
                  onChange={async (ev) => {
                    const chosen = ev.currentTarget.value
                    if (chosen === 'Custom...') {
                      setCustomModalRowName(r.name)
                      setCustomModalOpen(true)
                      return
                    }
                    const all = readOverrides()
                    const updated = { ...all, [r.name]: chosen }
                    writeOverrides(updated)
                    setRows(buildRows())
                    updateToken(r.name, chosen)
                    if (chosen && chosen.trim()) {
                      ensureFontLoaded(chosen).catch((error) => {
                        console.warn(`Failed to load font ${chosen}:`, error)
                      })
                    }
                    setTimeout(() => {
                      try {
                        const store = getVarsStore()
                        store.setTokens(store.getState().tokens)
                      } catch {}
                    }, 0)
                  }}
                style={{
                  padding: 'var(--recursica-brand-dimensions-spacers-default)',
                  border: `1px solid var(${layer1Base}-border-color)`,
                  borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
                  background: `var(${layer0Base}-surface)`,
                  color: `var(${layer0Base}-element-text-color)`,
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                }}
              >
                <option value="">Select font...</option>
                {fonts.filter(f => f !== 'Custom...' || rows.filter((x, idx) => idx !== index).every(x => x.value !== f)).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                <option value="Custom...">Custom...</option>
                </select>
            </div>
          )
        })}
        {showInspiration && (
          <div
            style={{
              background: `var(${interactiveColor})`,
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
              padding: 'var(--recursica-brand-dimensions-spacers-lg)',
              display: 'grid',
              gap: 'var(--recursica-brand-dimensions-spacers-md)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowInspiration(false)}
              style={{
                position: 'absolute',
                top: 'var(--recursica-brand-dimensions-spacers-md)',
                right: 'var(--recursica-brand-dimensions-spacers-md)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 'var(--recursica-brand-dimensions-spacers-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {(() => {
                const XIcon = iconNameToReactComponent('x-mark')
                return XIcon ? <XIcon style={{ width: 20, height: 20, color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)` }} /> : null
              })()}
            </button>
            <h3 style={{
              margin: 0,
              fontSize: 'var(--recursica-brand-typography-h6-font-size)',
              fontWeight: 'var(--recursica-brand-typography-h6-font-weight)',
              color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`,
            }}>
              Need inspiration?
            </h3>
            <p style={{
              margin: 0,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`,
              opacity: 0.9,
            }}>
              Browse the Google Fonts library to find the perfect typeface.
            </p>
            <Button
              variant="solid"
              size="default"
              onClick={() => window.open('https://fonts.google.com', '_blank')}
              icon={(() => {
                const LinkIcon = iconNameToReactComponent('arrow-top-right-on-square')
                return LinkIcon ? <LinkIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
              })()}
              style={{
                backgroundColor: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-on-tone)`,
                color: `var(${interactiveColor})`,
              }}
            >
              Explore Google Fonts
            </Button>
          </div>
        )}
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
            if (fontSource.type === 'npm') {
              await loadFontFromNpm(fontName, fontSource.url)
            } else if (fontSource.type === 'git') {
              const [repoUrl, fontPath] = fontSource.url.split('#')
              await loadFontFromGit(fontName, repoUrl, fontPath || 'fonts')
            }
            
            storeCustomFont(fontName, undefined, fontSource)
            const all = readOverrides()
            const updated = { ...all, [customModalRowName]: fontName }
            writeOverrides(updated)
            setRows(buildRows())
            updateToken(customModalRowName, fontName)
            setTimeout(() => {
              try {
                const store = getVarsStore()
                store.setTokens(store.getState().tokens)
              } catch {}
            }, 0)
            setCustomModalOpen(false)
            setCustomModalRowName(null)
          } catch (error) {
            console.error('Failed to add custom font:', error)
            alert(`Failed to add custom font: ${error instanceof Error ? error.message : String(error)}`)
          }
        }}
      />
    </div>
  )
}
