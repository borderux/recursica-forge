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
import { EditFontVariantsModal } from './EditFontVariantsModal'
import { storeCustomFont, loadFontFromNpm, loadFontFromGit, ensureFontLoaded } from '../../type/fontUtils'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { Chip } from '../../../components/adapters/Chip'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { readCssVarResolved } from '../../../core/css/readCssVar'
import tokensImport from '../../../vars/Tokens.json'

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
  
  // Get current font count to determine available sequences
  const getCurrentFontCount = (): number => {
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      return Object.keys(typefaces).filter((k) => !k.startsWith('$') && typefaces[k]?.$value).length
    } catch {
      return 0
    }
  }
  
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
  
  // Calculate available sequences: current font count + 1 (for the new font)
  const currentFontCount = getCurrentFontCount()
  const availableSequences = ORDER.slice(0, currentFontCount + 1)
  const defaultSequence = availableSequences[availableSequences.length - 1] || ORDER[0]
  
  return (
    <GoogleFontsModal
      open={open}
      onClose={onClose}
      existingFonts={getExistingFonts()}
      availableSequences={availableSequences}
      currentSequence={defaultSequence}
      onAccept={async (fontName, url, variants, sequence) => {
        try {
          const all = readOverrides()
          
          // Use provided sequence or find next available
          let sequentialName: string
          if (sequence && ORDER.includes(sequence)) {
            sequentialName = sequence
            // If the sequence is already taken, we need to move the existing font
            const existingKey = `font/typeface/${sequence}`
            if (all[existingKey]) {
              // Find next available position for the existing font
              const existingKeys = Object.keys(all).filter(k => k.startsWith('font/typeface/'))
              const existingIndices = existingKeys.map(k => {
                const key = k.replace('font/typeface/', '')
                return ORDER.indexOf(key)
              }).filter(idx => idx !== -1)
              
              let nextIndex = 0
              while (existingIndices.includes(nextIndex) && nextIndex < ORDER.length) {
                nextIndex++
              }
              
              // Move existing font to next available position
              const existingValue = all[existingKey]
              const newName = `font/typeface/${ORDER[nextIndex] || `custom-${nextIndex + 1}`}`
              delete all[existingKey]
              all[newName] = existingValue
              
              // Also update the token in the store
              const store = getVarsStore()
              const state = store.getState()
              const tokens = state.tokens as any
              const fontRoot = tokens?.tokens?.font || tokens?.font || {}
              const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
              
              if (typefaces[sequence]) {
                const existingTypeface = typefaces[sequence]
                delete typefaces[sequence]
                typefaces[ORDER[nextIndex] || `custom-${nextIndex + 1}`] = existingTypeface
                store.setTokens(tokens)
              }
            }
          } else {
            // Find next available sequence
            const existingKeys = Object.keys(all).filter(k => k.startsWith('font/typeface/'))
            const existingIndices = existingKeys.map(k => {
              const key = k.replace('font/typeface/', '')
              return ORDER.indexOf(key)
            }).filter(idx => idx !== -1)
            
            let nextIndex = 0
            while (existingIndices.includes(nextIndex) && nextIndex < ORDER.length) {
              nextIndex++
            }
            
            sequentialName = ORDER[nextIndex] || `custom-${nextIndex + 1}`
          }
          
          const name = `font/typeface/${sequentialName}`
          // Strip any quotes from font name before storing (should be clean name like "Rubik Storm")
          const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '')
          const updated = { ...all, [name]: cleanFontName }
          writeOverrides(updated)
          updateToken(name, cleanFontName)
          
          // Update token extensions with URL and variants FIRST, before loading font
          // This ensures ensureFontLoaded can find the custom URL
          if (url || variants) {
            try {
              const store = getVarsStore()
              const state = store.getState()
              const tokens = state.tokens as any
              const fontRoot = tokens?.tokens?.font || tokens?.font || {}
              const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
              
              // Create the typeface entry if it doesn't exist
              if (!typefaces[sequentialName]) {
                typefaces[sequentialName] = {}
              }
              
              // Ensure $value is set to the font name (populateFontUrlMapFromTokens reads from $value)
              // Always set it to ensure it matches what we're looking up
              typefaces[sequentialName].$value = cleanFontName
                
                if (!typefaces[sequentialName].$extensions) {
                  typefaces[sequentialName].$extensions = {}
                }
                if (!typefaces[sequentialName].$extensions['com.google.fonts']) {
                  typefaces[sequentialName].$extensions['com.google.fonts'] = {}
                }
                
                if (url) {
                  typefaces[sequentialName].$extensions['com.google.fonts'].url = url
                }
                
                // Store variants by font name, not sequence
                if (variants) {
                  if (!fontRoot.fontVariants) {
                    fontRoot.fontVariants = {}
                  }
                  
                  if (variants.length > 0) {
                    fontRoot.fontVariants[cleanFontName.toLowerCase()] = variants
                  } else {
                    delete fontRoot.fontVariants[cleanFontName.toLowerCase()]
                  }
                }
                
                store.setTokens(tokens)
                
                // Populate fontUrlMap and window.__fontUrlMap with the URL immediately
                // so ensureFontLoaded can find it
                if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
                  const { populateFontUrlMapFromTokens, setFontUrl } = await import('../../type/fontUtils')
                  
                  // First, directly set the URL in the map for immediate access
                  // This ensures the URL is available even if populateFontUrlMapFromTokens has issues
                  setFontUrl(cleanFontName, url)
                  setFontUrl(fontName.trim(), url)
                  
                  // Also set with quoted version
                  setFontUrl(`"${cleanFontName}"`, url)
                  
                  // Re-populate the map with the updated tokens (this will also set it, but direct set is faster)
                  populateFontUrlMapFromTokens(tokens)
                  
                  // Also update window.__fontUrlMap directly for immediate access
                  // and ensure all font name variations are mapped
                  if (typeof window !== 'undefined') {
                    if (!(window as any).__fontUrlMap) {
                      (window as any).__fontUrlMap = new Map<string, string>()
                    }
                    const urlMap = (window as any).__fontUrlMap as Map<string, string>
                    
                    // Set with all variations to ensure lookup works
                    const fontNameVariations = [
                      cleanFontName,
                      `"${cleanFontName}"`,
                      fontName.trim(),
                      fontName.trim().replace(/^["']|["']$/g, ''),
                    ]
                    // Remove duplicates
                    const uniqueVariations = [...new Set(fontNameVariations.filter(v => v))]
                    uniqueVariations.forEach(v => {
                      urlMap.set(v, url)
                    })
                  }
                }
            } catch (err) {
              console.warn('Failed to update token extensions:', err)
            }
          }
          
          // Remove any existing link for this font before loading with new URL
          const cleanFontNameForId = cleanFontName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const linkId = `gf-${cleanFontNameForId}`
          const existingLink = document.getElementById(linkId)
          if (existingLink) {
            existingLink.remove()
          }
          
          // Now load the font - it will use the custom URL from fontUrlMap
          // Use cleanFontName to ensure consistent lookup
          await ensureFontLoaded(cleanFontName)
          
          // Wait a bit for font cache to be populated
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Import getActualFontFamilyName to ensure cache is populated
          const { getActualFontFamilyName } = await import('../../type/fontUtils')
          try {
            await getActualFontFamilyName(cleanFontName)
          } catch (err) {
            console.warn('Failed to get actual font family name:', err)
          }
          
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
          
          // Don't close here - let the modal handle closing after onAccept completes
        } catch (error) {
          console.error('Failed to add Google Font:', error)
          // Re-throw the error so the modal can display it
          throw error
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
  const [availableVariants, setAvailableVariants] = useState<Record<string, Array<{ weight: string; style: string }>>>({})
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalRow, setEditModalRow] = useState<FamilyRow | null>(null)

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
        // Handle array values (e.g., ["Lexend", "sans-serif"]) - take first element
        let value = ''
        if (Array.isArray(val) && val.length > 0) {
          value = typeof val[0] === 'string' ? val[0] : ''
        } else if (typeof val === 'string') {
          value = val
        }
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

  // Ensure fonts are loaded when rows change
  useEffect(() => {
    if (rows.length > 0) {
      rows.forEach((row) => {
        if (row.value && row.value.trim()) {
          const fontName = row.value.trim().replace(/^["']|["']$/g, '')
          if (fontName) {
            ensureFontLoaded(fontName).catch(() => {})
          }
        }
      })
    }
  }, [rows])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail
      if (!detail) return
      const { all, reset } = detail
      if (all && typeof all === 'object') {
        if (reset) {
          // Handle reset FIRST, before rebuilding rows
          const allOverrides = readOverrides()
          const updated: Record<string, any> = {}
          // Keep all non-font/typeface overrides
          Object.keys(allOverrides).forEach((k) => {
            if (!k.startsWith('font/typeface/')) {
              updated[k] = allOverrides[k]
            }
          })
          
          try {
            // Use original tokensImport instead of tokensJson which might be stale
            // tokensJson comes from the store which is updated asynchronously by resetAll()
            const fontRoot: any = (tokensImport as any)?.tokens?.font || (tokensImport as any)?.font || {}
            // Check for both plural (typefaces) and singular (typeface) for backwards compatibility
            const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
            
            // Collect all typeface entries from JSON
            const typefaceEntries: Array<{ key: string; value: string }> = []
            Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
              const val = typefaces[k]?.$value
              // Handle array values (e.g., ["Lexend", "sans-serif"]) - take first element
              let value = ''
              if (Array.isArray(val) && val.length > 0) {
                value = typeof val[0] === 'string' ? val[0].trim() : ''
              } else if (typeof val === 'string') {
                value = val.trim()
              }
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
          
          // Rebuild rows after reset is complete
          setRows(buildRows())
        } else if (!detail.skipRebuild) {
          // Non-reset event - just rebuild rows
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

  // Get variants from JSON extensions for a font by its value (font name)
  // This works even when fonts are resequenced because we look up by font value, not row name
  // Helper function to get variants by font name (not sequence)
  // This is a read-only function - migration happens in useEffect
  const getVariantsByFontName = (fontName: string): Array<{ weight: string; style: string }> | null => {
    try {
      if (!fontName || !fontName.trim()) return null
      
      const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '').toLowerCase()
      const store = getVarsStore()
      const state = store.getState()
      const tokens = state.tokens as any
      const fontRoot = tokens?.tokens?.font || tokens?.font || {}
      
      // Check new fontVariants structure
      const fontVariants = fontRoot.fontVariants || {}
      const variants = fontVariants[cleanFontName]
      
      if (variants && Array.isArray(variants) && variants.length > 0) {
        // Resolve token references in variants to get weight and style keys
        const resolvedVariants: Array<{ weight: string; style: string }> = []
        variants.forEach((variant: any) => {
          if (variant && typeof variant === 'object') {
            let weight = ''
            let style = ''
            
            // Extract weight key from token reference like {tokens.font.weights.regular}
            if (typeof variant.weight === 'string') {
              const weightMatch = variant.weight.match(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i)
              if (weightMatch && weightMatch[1]) {
                weight = weightMatch[1]
              }
            }
            
            // Extract style key from token reference like {tokens.font.styles.normal}
            if (typeof variant.style === 'string') {
              const styleMatch = variant.style.match(/\{tokens?\.font\.styles?\.([a-z0-9\-_]+)\}/i)
              if (styleMatch && styleMatch[1]) {
                style = styleMatch[1]
              }
            }
            
            if (weight && style) {
              resolvedVariants.push({ weight, style })
            }
          }
        })
        return resolvedVariants.length > 0 ? resolvedVariants : null
      }
    } catch {}
    return null
  }
  
  // Helper function to set variants by font name (not sequence)
  const setVariantsByFontName = (fontName: string, variants: Array<{ weight: string; style: string }> | null): void => {
    try {
      if (!fontName || !fontName.trim()) return
      
      const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '').toLowerCase()
      const store = getVarsStore()
      const state = store.getState()
      const tokens = JSON.parse(JSON.stringify(state.tokens)) as any // Deep clone
      const fontRoot = tokens?.tokens?.font || tokens?.font || {}
      
      if (!fontRoot.fontVariants) {
        fontRoot.fontVariants = {}
      }
      
      if (variants && variants.length > 0) {
        fontRoot.fontVariants[cleanFontName] = variants
      } else {
        delete fontRoot.fontVariants[cleanFontName]
      }
      
      store.setTokens(tokens)
    } catch (err) {
      console.warn('Failed to set variants by font name:', err)
    }
  }

  // Migrate variants from old structure (typefaces[sequence].$extensions.variants) to new structure (fontVariants[fontName])
  useEffect(() => {
    try {
      const store = getVarsStore()
      const state = store.getState()
      const tokens = JSON.parse(JSON.stringify(state.tokens)) as any // Deep clone
      const fontRoot = tokens?.tokens?.font || tokens?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      
      let needsMigration = false
      const migrations: Array<{ fontName: string; variants: any[] }> = []
      
      // Check for variants in old structure
      for (const key of Object.keys(typefaces).filter(k => !k.startsWith('$'))) {
        const def = typefaces[key]
        if (!def) continue
        
        if (def?.$extensions?.variants && Array.isArray(def.$extensions.variants) && def.$extensions.variants.length > 0) {
          // Get the font value
          let fontValue = ''
          const rawValue = def?.$value
          if (Array.isArray(rawValue) && rawValue.length > 0) {
            fontValue = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
          } else if (typeof rawValue === 'string') {
            fontValue = rawValue.trim().replace(/^["']|["']$/g, '')
          }
          
          if (fontValue) {
            const cleanFontName = fontValue.toLowerCase()
            // Check if already migrated
            const fontVariants = fontRoot.fontVariants || {}
            if (!fontVariants[cleanFontName]) {
              migrations.push({ fontName: cleanFontName, variants: def.$extensions.variants })
              needsMigration = true
            }
          }
        }
      }
      
      // Perform migration if needed
      if (needsMigration) {
        if (!fontRoot.fontVariants) {
          fontRoot.fontVariants = {}
        }
        
        migrations.forEach(({ fontName, variants }) => {
          fontRoot.fontVariants[fontName] = variants
        })
        
        // Remove variants from old locations
        migrations.forEach(({ fontName }) => {
          for (const key of Object.keys(typefaces).filter(k => !k.startsWith('$'))) {
            const def = typefaces[key]
            if (!def) continue
            
            let fontValue = ''
            const rawValue = def?.$value
            if (Array.isArray(rawValue) && rawValue.length > 0) {
              fontValue = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
            } else if (typeof rawValue === 'string') {
              fontValue = rawValue.trim().replace(/^["']|["']$/g, '')
            }
            
            if (fontValue && fontValue.toLowerCase() === fontName && def?.$extensions?.variants) {
              delete def.$extensions.variants
            }
          }
        })
        
        store.setTokens(tokens)
      }
    } catch (err) {
      console.warn('Failed to migrate variants:', err)
    }
  }, [tokensJson])
  
  // Legacy function for backwards compatibility - now uses font name lookup
  const getVariantsFromJson = (fontValue: string): Array<{ weight: string; style: string }> | null => {
    return getVariantsByFontName(fontValue)
  }
  
  // Get all available styles from tokens
  const getAllStyles = (): string[] => {
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const styles: any = fontRoot?.styles || {}
      return Object.keys(styles).filter(k => !k.startsWith('$'))
    } catch {}
    return ['normal', 'italic'] // Default fallback
  }

  // Update available variants when fonts change
  useEffect(() => {
    const updateVariants = async () => {
      const newAvailableVariants: Record<string, Array<{ weight: string; style: string }>> = {}
      const newAvailableWeights: Record<string, string[]> = {}
      const allStyles = getAllStyles()
      
      for (const row of rows) {
        // Get variants by font value (not row name) so it works after resequencing
        const jsonVariants = getVariantsFromJson(row.value)
        
        if (jsonVariants && jsonVariants.length > 0) {
          // Use variants from JSON
          newAvailableVariants[row.name] = jsonVariants
          // Also populate weights for backwards compatibility
          const uniqueWeights = [...new Set(jsonVariants.map(v => v.weight))]
          newAvailableWeights[row.name] = uniqueWeights
        } else {
          // No variants specified - all weights and styles are allowed
          // Generate all combinations
          const allVariants: Array<{ weight: string; style: string }> = []
          FONT_WEIGHTS.forEach(weight => {
            allStyles.forEach(style => {
              allVariants.push({ weight, style })
            })
          })
          newAvailableVariants[row.name] = allVariants
          newAvailableWeights[row.name] = FONT_WEIGHTS
        }
      }
      setAvailableVariants(newAvailableVariants)
      setAvailableWeights(newAvailableWeights)
    }
    updateVariants()
  }, [rows, tokensJson])

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
    
    // Get tokens before resequencing to preserve extensions
    const store = getVarsStore()
    const state = store.getState()
    const tokens = state.tokens as any
    const fontRoot = tokens?.tokens?.font || tokens?.font || {}
    const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
    
    // Reassign ORDER names based on new positions
    const reorderedRows = newRows.map((row, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      const newName = `font/typeface/${sequentialName}`
      const oldKey = row.name.replace('font/typeface/', '')
      const newKey = sequentialName
      
      // If the name changed, remove old CSS variables
      if (row.name !== newName) {
        removeCssVar(`--tokens-font-typeface-${oldKey}`)
        removeCssVar(`--recursica-tokens-font-typefaces-${oldKey}`)
      }
      
      // Update override with new name
      updated[newName] = row.value
      
      return {
        name: newName,
        value: row.value,
        position: newIndex,
        oldKey, // Track original key to preserve extensions
        newKey
      }
    })
    
    writeOverrides(updated)
    setRows(reorderedRows.map(({ oldKey, newKey, ...rest }) => rest))
    setDraggedIndex(null)
    
    // Update tokens in store and trigger typography recompute
    setTimeout(() => {
      try {
        // Get fresh state after overrides are written
        const freshState = store.getState()
        const freshTokens = JSON.parse(JSON.stringify(freshState.tokens)) as any // Deep clone
        const freshFontRoot = freshTokens?.tokens?.font || freshTokens?.font || {}
        const freshTypefaces = freshFontRoot.typefaces || freshFontRoot.typeface || {}
        
        // Collect Google Fonts URLs by font value (not sequence) before resequencing
        const fontUrlMap: Record<string, string> = {}
        reorderedRows.forEach((row) => {
          const oldToken = typefaces[row.oldKey]
          if (oldToken && oldToken.$extensions?.['com.google.fonts']?.url) {
            const fontValue = Array.isArray(row.value) ? row.value[0] : row.value
            if (fontValue) {
              fontUrlMap[fontValue] = oldToken.$extensions['com.google.fonts'].url
            }
          }
        })
        
        // Now update each token with its new name
        // Variants are stored by font name, so they don't need to be moved
        reorderedRows.forEach((row) => {
          // Ensure the new key exists
          if (!freshTypefaces[row.newKey]) {
            freshTypefaces[row.newKey] = {}
          }
          
          // Set the value
          freshTypefaces[row.newKey].$value = Array.isArray(row.value) ? row.value : row.value
          
          // Preserve Google Fonts URL extension if it exists for this font
          const fontValue = Array.isArray(row.value) ? row.value[0] : row.value
          if (fontValue && fontUrlMap[fontValue]) {
            if (!freshTypefaces[row.newKey].$extensions) {
              freshTypefaces[row.newKey].$extensions = {}
            }
            if (!freshTypefaces[row.newKey].$extensions['com.google.fonts']) {
              freshTypefaces[row.newKey].$extensions['com.google.fonts'] = {}
            }
            freshTypefaces[row.newKey].$extensions['com.google.fonts'].url = fontUrlMap[fontValue]
          }
          
          // Also update via updateToken for CSS var updates
          updateToken(row.name, row.value)
        })
        
        // Final update to ensure everything is synced
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
  const buttonTextBg = getComponentCssVar('Button', 'colors', 'text-background', 'layer-0')
  const buttonTextText = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
  const buttonSolidBg = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
  const buttonSolidText = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
  const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
  const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--recursica-brand-dimensions-general-lg)' }}>
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
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--recursica-brand-dimensions-general-md)',
                position: 'relative',
                cursor: draggedIndex === index ? 'grabbing' : 'grab',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'all 0.2s',
                transform: dragOverIndex === index ? 'translateY(-4px)' : 'none',
                boxShadow: dragOverIndex === index 
                  ? `0 4px 8px rgba(0, 0, 0, 0.1)`
                  : 'none',
                minHeight: 0, // Allow flexbox to control height
              }}
            >
              <div style={{
                position: 'absolute',
                top: 'var(--recursica-brand-dimensions-general-md)',
                right: 'var(--recursica-brand-dimensions-general-md)',
                display: 'flex',
                gap: 'var(--recursica-brand-dimensions-general-sm)',
                zIndex: 1,
              }}>
                {(() => {
                  // Always show edit button on every card
                  const PencilIcon = iconNameToReactComponent('pencil')
                  return PencilIcon ? (
                    <Button
                      variant="text"
                      size="small"
                      layer="layer-1"
                      icon={<PencilIcon />}
                      onClick={() => {
                        setEditModalRow(r)
                        setEditModalOpen(true)
                      }}
                    />
                  ) : null
                })()}
                {index > 0 && (() => {
                  const TrashIcon = iconNameToReactComponent('trash')
                  return TrashIcon ? (
                    <Button
                      variant="text"
                      size="small"
                      layer="layer-1"
                      icon={<TrashIcon />}
                      onClick={() => handleDelete(index)}
                    />
                  ) : null
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-general-default)', flexShrink: 0 }}>
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
                flexShrink: 0,
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'flex-start',
              }}>
                {EXAMPLE_TEXT}
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 'var(--recursica-brand-dimensions-general-default)',
                flexShrink: 0,
                alignSelf: 'stretch',
              }}>
                {(availableVariants[r.name] || []).map((variant, idx) => {
                  // Get the actual style value from tokens (e.g., "normal" or "italic")
                  let fontStyle = 'normal'
                  try {
                    const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
                    const styles: any = fontRoot?.styles || {}
                    const styleDef = styles[variant.style]
                    if (styleDef?.$value && typeof styleDef.$value === 'string') {
                      fontStyle = styleDef.$value
                    }
                  } catch {}
                  
                  // Get the actual weight value from tokens (numeric value like 400, 700, 900)
                  let fontWeight: number | string = 400 // Default fallback
                  try {
                    const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
                    const weights: any = fontRoot?.weights || {}
                    const weightDef = weights[variant.weight]
                    if (weightDef?.$value && typeof weightDef.$value === 'number') {
                      fontWeight = weightDef.$value
                    } else {
                      // Fallback: try to parse common weight names
                      const weightMap: Record<string, number> = {
                        'thin': 100,
                        'extra-light': 200,
                        'light': 300,
                        'regular': 400,
                        'medium': 500,
                        'semi-bold': 600,
                        'bold': 700,
                        'extra-bold': 800,
                        'black': 900
                      }
                      fontWeight = weightMap[variant.weight] || 400
                    }
                  } catch {}
                  
                  const chipLabel = variant.style === 'normal' 
                    ? toTitle(variant.weight)
                    : `${toTitle(variant.weight)} ${toTitle(variant.style)}`
                  
                  return (
                    <Chip
                      key={`${variant.weight}-${variant.style}-${idx}`}
                      variant="unselected"
                      size="small"
                      layer="layer-1"
                      style={{
                        '--chip-font-weight': String(fontWeight),
                        fontFamily: `var(${fontFamilyVar})`,
                        fontStyle: fontStyle,
                        fontWeight: String(fontWeight),
                        height: 'auto',
                        minHeight: 'unset',
                        maxHeight: 'none',
                        lineHeight: '1.2',
                      } as React.CSSProperties}
                    >
                      {chipLabel}
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
              background: `var(--recursica-brand-themes-${mode}-palettes-palette-1-primary-tone)`,
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
                fontFamily: 'var(--recursica-brand-typography-h3-font-family)',
                fontSize: 'var(--recursica-brand-typography-h3-font-size)',
                fontWeight: 'var(--recursica-brand-typography-h3-font-weight)',
                letterSpacing: 'var(--recursica-brand-typography-h3-font-letter-spacing)',
                lineHeight: 'var(--recursica-brand-typography-h3-line-height)',
                color: `var(--recursica-brand-themes-${mode}-palettes-palette-1-primary-on-tone)`,
              }}>
                Need inspiration?
              </h3>
              <p style={{
                margin: 0,
                marginTop: 'var(--recursica-brand-dimensions-general-md)',
                fontFamily: 'var(--recursica-brand-typography-body-font-family)',
                fontSize: 'var(--recursica-brand-typography-body-font-size)',
                fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                letterSpacing: 'var(--recursica-brand-typography-body-font-letter-spacing)',
                lineHeight: 'var(--recursica-brand-typography-body-line-height)',
                color: `var(--recursica-brand-themes-${mode}-palettes-palette-1-primary-on-tone)`,
                opacity: `var(--recursica-brand-themes-${mode}-text-emphasis-high)`,
              }}>
                Browse the Google Fonts library to find the perfect typeface.
              </p>
            </div>
            <Button
              variant="ghost"
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
      
      <EditFontVariantsModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditModalRow(null)
        }}
        fontName={editModalRow?.value || ''}
        currentUrl={(() => {
          if (!editModalRow) return undefined
          try {
            const key = editModalRow.name.replace('font/typeface/', '')
            const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
            const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
            const typefaceDef = typefaces[key]
            return typefaceDef?.$extensions?.['com.google.fonts']?.url
          } catch {
            return undefined
          }
        })()}
        currentVariants={(() => {
          if (!editModalRow || !editModalRow.value) return undefined
          try {
            // Get variants by font name, not sequence
            const variants = getVariantsByFontName(editModalRow.value)
            return variants ?? undefined
          } catch {
            return undefined
          }
        })()}
        currentSequence={(() => {
          if (!editModalRow) return undefined
          return editModalRow.name.replace('font/typeface/', '')
        })()}
        availableSequences={rows.map(r => r.name.replace('font/typeface/', ''))}
        onAccept={async (url, variants, sequence) => {
          if (!editModalRow) return
          
          try {
            const oldKey = editModalRow.name.replace('font/typeface/', '')
            const newKey = sequence || oldKey
            const store = getVarsStore()
            const state = store.getState()
            const tokens = state.tokens as any
            const fontRoot = tokens?.tokens?.font || tokens?.font || {}
            const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
            
            // Handle sequence change if needed
            if (newKey !== oldKey && typefaces[oldKey]) {
              const all = readOverrides()
              const oldName = `font/typeface/${oldKey}`
              const newName = `font/typeface/${newKey}`
              
              // Check if new sequence is already taken
              if (typefaces[newKey]) {
                // Swap: move existing font at newKey to oldKey
                const tempTypeface = JSON.parse(JSON.stringify(typefaces[newKey])) // Deep clone with extensions
                const tempValue = all[newName]
                
                // Move current font to newKey (with all extensions)
                typefaces[newKey] = JSON.parse(JSON.stringify(typefaces[oldKey])) // Deep clone with extensions
                if (all[oldName] !== undefined) {
                  all[newName] = all[oldName]
                  updateToken(newName, all[oldName])
                }
                
                // Move existing font to oldKey (with all extensions)
                typefaces[oldKey] = tempTypeface
                if (tempValue !== undefined) {
                  all[oldName] = tempValue
                  updateToken(oldName, tempValue)
                }
                
                // Remove old CSS variables
                removeCssVar(`--tokens-font-typeface-${oldKey}`)
                removeCssVar(`--recursica-tokens-font-typefaces-${oldKey}`)
                removeCssVar(`--tokens-font-typeface-${newKey}`)
                removeCssVar(`--recursica-tokens-font-typefaces-${newKey}`)
                
                writeOverrides(all)
              } else {
                // Move font to new sequence (no conflict)
                typefaces[newKey] = JSON.parse(JSON.stringify(typefaces[oldKey])) // Deep clone with extensions
                delete typefaces[oldKey]
                
                // Update overrides
                const value = all[oldName]
                if (value !== undefined) {
                  delete all[oldName]
                  all[newName] = value
                  writeOverrides(all)
                  updateToken(newName, value)
                  
                  // Remove old CSS variables
                  removeCssVar(`--tokens-font-typeface-${oldKey}`)
                  removeCssVar(`--recursica-tokens-font-typefaces-${oldKey}`)
                }
              }
              
              // Update store with resequenced tokens
              store.setTokens(tokens)
            }
            
            const key = newKey
            if (typefaces[key]) {
              if (!typefaces[key].$extensions) {
                typefaces[key].$extensions = {}
              }
              
              // Only update URL if provided (custom fonts don't have URLs)
              if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
                if (!typefaces[key].$extensions['com.google.fonts']) {
                  typefaces[key].$extensions['com.google.fonts'] = {}
                }
                typefaces[key].$extensions['com.google.fonts'].url = url
              }
              
              // Store variants by font name, not sequence
              const fontName = editModalRow?.value || ''
              if (fontName) {
                const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '').toLowerCase()
                
                // Update variants in the tokens object before saving
                if (!fontRoot.fontVariants) {
                  fontRoot.fontVariants = {}
                }
                
                if (variants && variants.length > 0) {
                  fontRoot.fontVariants[cleanFontName] = variants
                } else {
                  delete fontRoot.fontVariants[cleanFontName]
                }
              }
              
              // Save all changes (URL and variants) at once
              store.setTokens(tokens)
              
              // Update fontUrlMap with the new URL
              if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
                const { populateFontUrlMapFromTokens } = await import('../../type/fontUtils')
                populateFontUrlMapFromTokens(tokens)
                
                // Also update window.__fontUrlMap directly
                if (typeof window !== 'undefined') {
                  if (!(window as any).__fontUrlMap) {
                    (window as any).__fontUrlMap = new Map<string, string>()
                  }
                  const urlMap = (window as any).__fontUrlMap as Map<string, string>
                  const cleanFontName = editModalRow.value.trim().replace(/^["']|["']$/g, '')
                  urlMap.set(cleanFontName, url)
                  // Also set with variations
                  const fontNameVariations = [
                    cleanFontName,
                    `"${cleanFontName}"`,
                    editModalRow.value.trim(),
                    editModalRow.value.trim().replace(/^["']|["']$/g, ''),
                  ]
                  fontNameVariations.forEach(v => {
                    if (v && v !== cleanFontName) {
                      urlMap.set(v, url)
                    }
                  })
                }
              }
              
              // Reload font with new URL (only if URL was provided)
              if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
                const fontName = editModalRow.value.trim().replace(/^["']|["']$/g, '')
                if (fontName) {
                  // Remove old link
                  const linkId = `gf-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  const oldLink = document.getElementById(linkId)
                  if (oldLink) {
                    oldLink.remove()
                  }
                  
                  // Load font with new URL
                  await ensureFontLoaded(fontName)
                }
              }
              
              setTimeout(() => {
                try {
                  store.setTokens(store.getState().tokens)
                  store.recomputeAndApplyAll()
                  
                  // Dispatch event to trigger rebuild of rows and availableVariants
                  try {
                    const all = readOverrides()
                    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all, skipRebuild: false } }))
                  } catch {}
                } catch {}
              }, 100)
              
              setEditModalOpen(false)
              setEditModalRow(null)
            }
          } catch (error) {
            console.error('Failed to update font variants:', error)
            alert(`Failed to update font variants: ${error instanceof Error ? error.message : String(error)}`)
          }
        }}
      />
      
      <CustomFontModal
        open={customModalOpen}
        onClose={() => {
          setCustomModalOpen(false)
          setCustomModalRowName(null)
        }}
        currentSequence={customModalRowName ? customModalRowName.replace('font/typeface/', '') : undefined}
        availableSequences={rows.map(r => r.name.replace('font/typeface/', ''))}
        onAccept={async (fontName, fontSource, sequence) => {
          try {
            if (fontSource.type === 'npm') {
              await loadFontFromNpm(fontName, fontSource.url)
            } else if (fontSource.type === 'git') {
              const [repoUrl, fontPath] = fontSource.url.split('#')
              await loadFontFromGit(fontName, repoUrl, fontPath || 'fonts')
            }
            
            storeCustomFont(fontName, undefined, fontSource)
            const all = readOverrides()
            
            // Use provided sequence or fall back to customModalRowName
            const targetSequence = sequence || (customModalRowName ? customModalRowName.replace('font/typeface/', '') : 'primary')
            const targetName = `font/typeface/${targetSequence}`
            
            // If sequence is already taken, swap fonts
            const store = getVarsStore()
            const state = store.getState()
            const tokens = state.tokens as any
            const fontRoot = tokens?.tokens?.font || tokens?.font || {}
            const typefaces = fontRoot.typefaces || fontRoot.typeface || {}
            
            if (typefaces[targetSequence] && customModalRowName && customModalRowName !== targetName) {
              // Swap: move existing font at targetSequence to customModalRowName's sequence
              const existingValue = all[targetName]
              const oldKey = customModalRowName.replace('font/typeface/', '')
              
              if (existingValue !== undefined) {
                all[customModalRowName] = existingValue
                updateToken(customModalRowName, existingValue)
              }
            }
            
            const updated = { ...all, [targetName]: fontName }
            writeOverrides(updated)
            setRows(buildRows())
            updateToken(targetName, fontName)
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
