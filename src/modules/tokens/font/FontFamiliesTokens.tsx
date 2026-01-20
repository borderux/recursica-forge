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
import { GoogleFontsModal } from './GoogleFontsModal'
import { storeCustomFont, loadFontFromNpm, loadFontFromGit, ensureFontLoaded } from '../../type/fontUtils'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { Chip } from '../../../components/adapters/Chip'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'

type FamilyRow = { name: string; value: string; position: number }

const ORDER = ['primary','secondary','tertiary','quaternary','quinary','senary','septenary','octonary']
const FONT_WEIGHTS = ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black']
const FONT_WEIGHT_MAP: Record<string, number> = {
  'thin': 100,
  'extra-light': 200,
  'light': 300,
  'regular': 400,
  'medium': 500,
  'semi-bold': 600,
  'bold': 700,
  'extra-bold': 800,
  'black': 900,
}
const EXAMPLE_TEXT = "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal."

// Check if a font weight is available for a font family
function isFontWeightAvailable(fontFamily: string, weight: number): boolean {
  if (!fontFamily || typeof document === 'undefined' || !document.fonts) {
    return true // Assume available if we can't check
  }
  
  try {
    // Check if the font is loaded and the weight is available
    const fontFace = Array.from(document.fonts).find(
      (ff) => ff.family.toLowerCase() === fontFamily.toLowerCase()
    )
    
    if (!fontFace) {
      // Font not loaded yet, assume all weights are available
      return true
    }
    
    // For Google Fonts and most web fonts, if the font is loaded, 
    // we assume the weight is available (browsers will synthesize if needed)
    // But we can check the actual weight if available
    return true // Simplified: assume available if font is loaded
  } catch {
    return true // Assume available on error
  }
}

// Export AddButton component for use in header
export function AddButton({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <Button
      variant="outline"
      size="small"
      onClick={onOpenModal}
      icon={(() => {
        const PlusIcon = iconNameToReactComponent('plus')
        return PlusIcon ? <PlusIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
      })()}
    >
      Add font family
    </Button>
  )
}

// Wrapper component to expose AddButton with modal state
export function AddButtonWrapper() {
  const [googleFontsModalOpen, setGoogleFontsModalOpen] = useState(false)
  return (
    <>
      <AddButton onOpenModal={() => setGoogleFontsModalOpen(true)} />
      <GoogleFontsModalWrapper open={googleFontsModalOpen} onClose={() => setGoogleFontsModalOpen(false)} />
    </>
  )
}

// Wrapper to handle font addition from modal
function GoogleFontsModalWrapper({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateToken, tokens: tokensJson } = useVars()
  
  // Get list of existing font families to prevent duplicates
  const getExistingFonts = (): string[] => {
    const overrides = readOverrides()
    const existing: string[] = []
    
    // Get fonts from JSON
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
        const val = typefaces[k]?.$value
        if (typeof val === 'string' && val.trim()) {
          existing.push(val.trim())
        }
      })
    } catch {}
    
    // Get fonts from overrides
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const value = String(overrides[name] || '').trim()
        if (value && !existing.includes(value)) {
          existing.push(value)
        }
      }
    })
    
    return existing
  }
  
  const buildRows = (): FamilyRow[] => {
    const overrides = readOverrides()
    const rows: FamilyRow[] = []
    const typefaceEntries: Array<{ name: string; value: string; key: string }> = []
    
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
        const name = `font/typeface/${k}`
        const val = typefaces[k]?.$value
        const value = typeof val === 'string' && val ? val : ''
        const overrideValue = overrides[name]
        typefaceEntries.push({ 
          name, 
          value: typeof overrideValue === 'string' && overrideValue ? overrideValue : value,
          key: k
        })
      })
    } catch {}
    
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const key = name.replace('font/typeface/', '')
        if (!typefaceEntries.some(e => e.key === key)) {
          const value = String(overrides[name] || '')
          typefaceEntries.push({ name, value, key })
        }
      }
    })
    
    typefaceEntries.sort((a, b) => {
      const aIndex = ORDER.indexOf(a.key)
      const bIndex = ORDER.indexOf(b.key)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.key.localeCompare(b.key)
    })
    
    typefaceEntries.forEach((entry) => {
      const name = `font/typeface/${entry.key}`
      rows.push({
        name: name,
        value: entry.value,
        position: typefaceEntries.indexOf(entry)
      })
    })
    
    return rows
  }
  
  return (
    <GoogleFontsModal
      open={open}
      onClose={onClose}
      existingFonts={getExistingFonts()}
      onAccept={async (fontName) => {
        try {
          // Ensure font is loaded and cached with proper format
          await ensureFontLoaded(fontName)
          
          // Wait a bit for font cache to be populated
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Import getActualFontFamilyName to ensure cache is populated
          const { getActualFontFamilyName } = await import('../../type/fontUtils')
          await getActualFontFamilyName(fontName)
          
          const all = readOverrides()
          const existingKeys = Object.keys(all).filter(k => k.startsWith('font/typeface/'))
          const existingIndices = existingKeys.map(k => {
            const key = k.replace('font/typeface/', '')
            return ORDER.indexOf(key)
          }).filter(idx => idx !== -1)
          
          let nextIndex = 0
          while (existingIndices.includes(nextIndex) && nextIndex < ORDER.length) {
            nextIndex++
          }
          
          const sequentialName = ORDER[nextIndex] || `custom-${nextIndex + 1}`
          const name = `font/typeface/${sequentialName}`
          // Strip any quotes from font name before storing (should be clean name like "Rubik Storm")
          const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '')
          const updated = { ...all, [name]: cleanFontName }
          writeOverrides(updated)
          updateToken(name, cleanFontName)
          
          setTimeout(() => {
            try {
              const store = getVarsStore()
              store.setTokens(store.getState().tokens)
              // Trigger recompute to update CSS variables with cached font name
              store.recomputeAndApplyAll()
            } catch {}
          }, 100)
          
          try {
            window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { name, value: fontName, all: updated } }))
          } catch {}
          
          onClose()
        } catch (error) {
          console.error('Failed to add Google Font:', error)
          alert(`Failed to add font: ${error instanceof Error ? error.message : String(error)}`)
        }
      }}
    />
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
  const [availableWeights, setAvailableWeights] = useState<Record<string, string[]>>({})
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const buildRows = (): FamilyRow[] => {
    const overrides = readOverrides()
    const rows: FamilyRow[] = []
    const typefaceEntries: Array<{ name: string; value: string; key: string }> = []
    
    // First, read from Tokens.json (always read from source of truth)
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      // Check for both plural (typefaces) and singular (typeface) for backwards compatibility
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
        const name = `font/typeface/${k}`
        const val = typefaces[k]?.$value
        const value = typeof val === 'string' && val ? val : ''
        // Check if override exists, otherwise use JSON value
        const overrideValue = overrides[name]
        typefaceEntries.push({ 
          name, 
          value: typeof overrideValue === 'string' && overrideValue ? overrideValue : value,
          key: k
        })
      })
    } catch {}
    
    // Also include any overrides that aren't in the JSON (custom additions)
    Object.keys(overrides).forEach((name) => {
      if (name.startsWith('font/typeface/')) {
        const key = name.replace('font/typeface/', '')
        // Only add if not already in typefaceEntries
        if (!typefaceEntries.some(e => e.key === key)) {
          const value = String(overrides[name] || '')
          typefaceEntries.push({ name, value, key })
        }
      }
    })
    
    typefaceEntries.sort((a, b) => {
      const aIndex = ORDER.indexOf(a.key)
      const bIndex = ORDER.indexOf(b.key)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.key.localeCompare(b.key)
    })
    
    typefaceEntries.forEach((entry, index) => {
      // Use the key from JSON (primary, secondary, tertiary) instead of sequential naming
      const name = `font/typeface/${entry.key}`
      rows.push({
        name: name,
        value: entry.value,
        position: index
      })
    })
    
    return rows
  }

  const [rows, setRows] = useState<FamilyRow[]>(() => buildRows())

  // Update rows when tokensJson changes
  useEffect(() => {
    const newRows = buildRows()
    setRows(newRows)
  }, [tokensJson])

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
          // Keep all non-font/typeface overrides
          Object.keys(allOverrides).forEach((k) => {
            if (!k.startsWith('font/typeface/')) {
              updated[k] = allOverrides[k]
            }
          })
          
          try {
            const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
            // Check for both plural (typefaces) and singular (typeface) for backwards compatibility
            const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
            
            // Collect all typeface entries from JSON
            const typefaceEntries: Array<{ key: string; value: string }> = []
            Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
              const val = typefaces[k]?.$value
              const value = typeof val === 'string' && val ? val : ''
              typefaceEntries.push({ key: k, value })
            })
            
            // Sort by original ORDER to restore sequence
            typefaceEntries.sort((a, b) => {
              const aIndex = ORDER.indexOf(a.key)
              const bIndex = ORDER.indexOf(b.key)
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
              if (aIndex !== -1) return -1
              if (bIndex !== -1) return 1
              return a.key.localeCompare(b.key)
            })
            
            // Reassign to ORDER sequence (primary, secondary, tertiary, etc.)
            // This ensures the sequence is restored even if user reordered them
            typefaceEntries.forEach((entry, index) => {
              const sequentialName = ORDER[index] || `custom-${index + 1}`
              const newName = `font/typeface/${sequentialName}`
              
              // Remove old CSS variables if key changed
              if (entry.key !== sequentialName) {
                removeCssVar(`--tokens-font-typeface-${entry.key}`)
                removeCssVar(`--recursica-tokens-font-typefaces-${entry.key}`)
              }
              
              updated[newName] = entry.value
            })
          } catch {}
          
          writeOverrides(updated)
          
          // Update tokens in store
          setTimeout(() => {
            try {
              const store = getVarsStore()
              // Update each token with its new name
              Object.keys(updated).forEach((name) => {
                if (name.startsWith('font/typeface/')) {
                  updateToken(name, updated[name])
                }
              })
              store.setTokens(store.getState().tokens)
            } catch {}
          }, 0)
          
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

  // Detect available font weights for a font family
  const detectAvailableWeights = async (fontFamily: string): Promise<string[]> => {
    if (!fontFamily) return []
    
    // Try to get weights from Google Fonts API
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_FONTS_API_KEY as string | undefined
    if (apiKey) {
      try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`)
        if (response.ok) {
          const data = await response.json()
          const font = data.items?.find((f: any) => f.family === fontFamily)
          if (font && font.variants) {
            // Map Google Fonts variants to our weight names
            const availableWeights: string[] = []
            font.variants.forEach((variant: string) => {
              if (variant.includes('100') || variant.includes('thin')) {
                if (!availableWeights.includes('thin')) availableWeights.push('thin')
              }
              if (variant.includes('200') || variant.includes('extralight') || variant.includes('extra-light')) {
                if (!availableWeights.includes('extra-light')) availableWeights.push('extra-light')
              }
              if (variant.includes('300') || variant.includes('light')) {
                if (!availableWeights.includes('light')) availableWeights.push('light')
              }
              if (variant.includes('400') || variant.includes('regular')) {
                if (!availableWeights.includes('regular')) availableWeights.push('regular')
              }
              if (variant.includes('500') || variant.includes('medium')) {
                if (!availableWeights.includes('medium')) availableWeights.push('medium')
              }
              if (variant.includes('600') || variant.includes('semibold') || variant.includes('semi-bold')) {
                if (!availableWeights.includes('semi-bold')) availableWeights.push('semi-bold')
              }
              if (variant.includes('700') || variant.includes('bold')) {
                if (!availableWeights.includes('bold')) availableWeights.push('bold')
              }
              if (variant.includes('800') || variant.includes('extrabold') || variant.includes('extra-bold')) {
                if (!availableWeights.includes('extra-bold')) availableWeights.push('extra-bold')
              }
              if (variant.includes('900') || variant.includes('black')) {
                if (!availableWeights.includes('black')) availableWeights.push('black')
              }
            })
            // Return available weights in order, or all if none found
            return availableWeights.length > 0 ? availableWeights : FONT_WEIGHTS
          }
        }
      } catch (error) {
        console.warn('Failed to fetch font weights from Google Fonts API:', error)
      }
    }
    
    // Fallback: check if font is loaded via document.fonts
    if (typeof document !== 'undefined' && document.fonts) {
      const fontFaces = Array.from(document.fonts).filter(
        (ff) => ff.family.toLowerCase() === fontFamily.toLowerCase()
      )
      if (fontFaces.length > 0) {
        // Font is loaded, return all weights (browser will synthesize if needed)
        return FONT_WEIGHTS
      }
    }
    
    // Default: return all weights (they'll be available when loaded or browser will synthesize)
    return FONT_WEIGHTS
  }

  // Update available weights when fonts change
  useEffect(() => {
    const updateWeights = async () => {
      const newAvailableWeights: Record<string, string[]> = {}
      for (const row of rows) {
        if (row.value) {
          newAvailableWeights[row.name] = await detectAvailableWeights(row.value)
        }
      }
      setAvailableWeights(newAvailableWeights)
    }
    updateWeights()
  }, [rows])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-font/typeface overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('font/typeface/')) {
        updated[k] = all[k]
      }
    })
    
    // Create new rows array with reordered items
    const newRows = [...rows]
    const [draggedRow] = newRows.splice(draggedIndex, 1)
    newRows.splice(dropIndex, 0, draggedRow)
    
    // Reassign ORDER names based on new positions
    const reorderedRows = newRows.map((row, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      const newName = `font/typeface/${sequentialName}`
      
      // If the name changed, remove old CSS variables
      if (row.name !== newName) {
        const oldKey = row.name.replace('font/typeface/', '')
        removeCssVar(`--tokens-font-typeface-${oldKey}`)
        removeCssVar(`--recursica-tokens-font-typefaces-${oldKey}`)
      }
      
      // Update override with new name
      updated[newName] = row.value
      
      return {
        name: newName,
        value: row.value,
        position: newIndex
      }
    })
    
    writeOverrides(updated)
    setRows(reorderedRows)
    setDraggedIndex(null)
    
    // Update tokens in store and trigger typography recompute
    setTimeout(() => {
      try {
        const store = getVarsStore()
        // Update each token with its new name
        reorderedRows.forEach((row) => {
          updateToken(row.name, row.value)
        })
        store.setTokens(store.getState().tokens)
        
        // Clear typography font-family CSS variables so they get regenerated with new token assignments
        // This ensures typography updates when token sequence changes
        const typographyPrefixes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle', 'subtitle-small', 'body', 'body-small', 'button', 'caption', 'overline']
        typographyPrefixes.forEach((prefix) => {
          const cssVar = `--recursica-brand-typography-${prefix}-font-family`
          if (typeof document !== 'undefined') {
            document.documentElement.style.removeProperty(cssVar)
          }
        })
        
        // Trigger recompute of all CSS variables (including typography) to pick up new token assignments
        store.recomputeAndApplyAll()
      } catch {}
    }, 0)
    
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, skipRebuild: true } }))
      // Also dispatch cssVarsUpdated to notify components that typography may have changed
      window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [] } }))
    } catch {}
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

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
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--recursica-brand-dimensions-general-lg)' }}>
        {rows.map((r, index) => {
          // Extract the key from the name (e.g., "font/typeface/primary" -> "primary")
          const key = r.name.replace('font/typeface/', '')
          const label = toTitle(key)
          const fontFamilyVar = `--recursica-tokens-font-typefaces-${key}`
          const selectedWeight = selectedWeights[r.name] || 'regular'
          
          return (
            <div
              key={r.name}
              draggable
              onDragStart={(e) => {
                handleDragStart(index)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                handleDrop(e, index)
                setDragOverIndex(null)
              }}
              onDragEnd={handleDragEnd}
              style={{
                background: `var(${layer1Base}-surface)`,
                border: `1px solid ${
                  draggedIndex === index 
                    ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`
                    : dragOverIndex === index
                    ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`
                    : `var(${layer1Base}-border-color)`
                }`,
                borderRadius: 'var(--recursica-brand-dimensions-border-radii-xl)',
                padding: `var(${layer1Base}-padding)`,
                display: 'grid',
                gap: 'var(--recursica-brand-dimensions-general-md)',
                position: 'relative',
                cursor: draggedIndex === index ? 'grabbing' : 'grab',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'all 0.2s',
                transform: dragOverIndex === index ? 'translateY(-4px)' : 'none',
                boxShadow: dragOverIndex === index 
                  ? `0 4px 8px rgba(0, 0, 0, 0.1)`
                  : 'none',
              }}
            >
              {index > 0 && (() => {
                const XIcon = iconNameToReactComponent('x-mark')
                return XIcon ? (
                  <Button
                    variant="text"
                    size="small"
                    layer="layer-1"
                    icon={<XIcon />}
                    onClick={() => handleDelete(index)}
                    style={{
                      position: 'absolute',
                      top: 'var(--recursica-brand-dimensions-general-md)',
                      right: 'var(--recursica-brand-dimensions-general-md)',
                    }}
                  />
                ) : null
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-default)' }}>
                <Chip
                  variant="unselected"
                  size="small"
                  layer="layer-1"
                >
                  {label}
                </Chip>
                <h2 style={{ 
                  margin: 0,
                  fontFamily: `var(${fontFamilyVar})`,
                  fontSize: 'var(--recursica-brand-typography-h2-font-size)',
                  fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
                  letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
                  lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
                  color: `var(${layer1Base}-element-text-color)`,
                  opacity: `var(${layer1Base}-element-text-high-emphasis)`,
                }}>
                  {r.value || 'Select font'}
                </h2>
              </div>
              <div style={{
                fontFamily: `var(${fontFamilyVar})`,
                fontSize: 'var(--recursica-brand-typography-body-font-size)',
                color: `var(${layer1Base}-element-text-color)`,
                opacity: `var(${layer1Base}-element-text-high-emphasis)`,
                lineHeight: 1.5,
                minHeight: '120px',
              }}>
                {EXAMPLE_TEXT}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--recursica-brand-dimensions-general-default)' }}>
                {(availableWeights[r.name] || FONT_WEIGHTS).map((weight) => {
                  return (
                    <Chip
                      key={weight}
                      variant="unselected"
                      size="small"
                      layer="layer-1"
                    >
                      {toTitle(weight)}
                    </Chip>
                  )
                })}
              </div>
            </div>
          )
        })}
        {showInspiration && (
          <div
            style={{
              background: `var(--recursica-brand-themes-${mode}-palettes-palette-2-200-tone)`,
              borderRadius: 'var(--recursica-brand-dimensions-border-radii-xl)',
              padding: `var(${layer1Base}-padding)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              minHeight: '326px',
            }}
          >
            {(() => {
              const XIcon = iconNameToReactComponent('x-mark')
              return XIcon ? (
                <Button
                  variant="text"
                  size="small"
                  layer="layer-1"
                  icon={<XIcon />}
                  onClick={() => setShowInspiration(false)}
                  style={{
                    position: 'absolute',
                    top: 'var(--recursica-brand-dimensions-general-md)',
                    right: 'var(--recursica-brand-dimensions-general-md)',
                  }}
                />
              ) : null
            })()}
            <div>
              <h3 style={{
                margin: 0,
                fontSize: 'var(--recursica-brand-typography-h6-font-size)',
                fontWeight: 'var(--recursica-brand-typography-h6-font-weight)',
                color: `var(--recursica-brand-themes-${mode}-palettes-palette-2-200-on-tone)`,
              }}>
                Need inspiration?
              </h3>
              <p style={{
                margin: 0,
                marginTop: 'var(--recursica-brand-dimensions-general-md)',
                fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                color: `var(--recursica-brand-themes-${mode}-palettes-palette-2-200-on-tone)`,
                opacity: `var(--recursica-brand-themes-${mode}-text-emphasis-high)`,
              }}>
                Browse the Google Fonts library to find the perfect typeface.
              </p>
            </div>
            <Button
              variant="solid"
              size="default"
              layer="layer-1"
              onClick={() => window.open('https://fonts.google.com', '_blank')}
              icon={(() => {
                const LinkIcon = iconNameToReactComponent('arrow-top-right-on-square')
                return LinkIcon ? <LinkIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
              })()}
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
