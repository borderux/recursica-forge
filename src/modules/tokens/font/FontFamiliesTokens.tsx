/**
 * FontFamiliesTokens
 *
 * Editor for font family and typeface tokens. Shows cards with font previews and weight selectors.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { useVars } from '../../vars/VarsContext'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'
import { getStoredFonts, saveStoredFonts, FontEntry } from '../../../core/store/fontStore'
import { genericLayerProperty, genericLayerText, tokenFont } from '../../../core/css/cssVarBuilder'
import { removeCssVar } from '../../../core/css/updateCssVar'
import { getVarsStore } from '../../../core/store/varsStore'
import { clearDeltaByPrefix } from '../../../core/store/cssDelta'
import { CustomFontModal } from '../../type/CustomFontModal'
import { GoogleFontsModal } from './GoogleFontsModal'
import { EditFontVariantsModal } from './EditFontVariantsModal'
import { storeCustomFont, loadFontFromNpm, loadFontFromGit, ensureFontLoaded } from '../../type/fontUtils'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { Chip } from '../../../components/adapters/Chip'
import { Badge } from '../../../components/adapters/Badge'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { getLayerElevationBoxShadow } from '../../../components/utils/brandCssVars'
import { readCssVarResolved } from '../../../core/css/readCssVar'
import tokensImport from '../../../../recursica_tokens.json'

type FamilyRow = { name: string; value: string; position: number }

const ORDER = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary']
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
        return PlusIcon ? <PlusIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
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
  // Uses overrides as source of truth since that's where deletions take effect
  const getCurrentFontCount = (): number => {
    try {
      const overrides = readOverrides()
      const overrideKeys = Object.keys(overrides).filter(k => k.startsWith('font/typeface/'))

      // If we have overrides, they are the source of truth (deletions remove overrides)
      if (overrideKeys.length > 0) {
        return overrideKeys.filter(k => {
          const val = overrides[k]
          return typeof val === 'string' && val.trim()
        }).length
      }

      // Fallback to tokensJson if no overrides exist
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      return Object.keys(typefaces).filter((k) => !k.startsWith('$') && typefaces[k]?.$value).length
    } catch {
      return 0
    }
  }

  // Get list of existing font families to prevent duplicates
  // Uses overrides as source of truth since that's where add/delete operations take effect
  const getExistingFonts = (): string[] => {
    const overrides = readOverrides()
    const existing: string[] = []
    const overrideKeys = Object.keys(overrides).filter(k => k.startsWith('font/typeface/'))

    if (overrideKeys.length > 0) {
      // Overrides exist - use them as source of truth
      overrideKeys.forEach((name) => {
        const value = String(overrides[name] || '').trim()
        if (value && !existing.includes(value)) {
          existing.push(value)
        }
      })
    } else {
      // No overrides - fall back to tokens JSON
      try {
        const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
        const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
        Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
          const val = typefaces[k]?.$value
          if (typeof val === 'string' && val.trim()) {
            existing.push(val.trim())
          }
        })
      } catch { }
    }

    return existing
  }

  const buildRows = (): FamilyRow[] => {
    return getStoredFonts().map((f, index) => ({
      name: `font/typeface/${f.id}`,
      value: f.family,
      position: index
    }))
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
      onAccept={async (fontName, url, variants, sequence, category) => {
        try {
          const fonts = getStoredFonts()

          // Use provided sequence or find next available
          let sequentialName: string
          if (sequence && ORDER.includes(sequence)) {
            sequentialName = sequence

            // If the sequence is already taken, we need to move the existing font
            const existingFontIndex = fonts.findIndex(f => f.id === sequence)
            if (existingFontIndex !== -1) {
              // Find next available position in the ORDER sequence
              const usedSequences = new Set(fonts.map(f => f.id))
              let nextAvailableSequence = ''
              for (const seq of ORDER) {
                if (!usedSequences.has(seq)) {
                  nextAvailableSequence = seq
                  break
                }
              }

              if (!nextAvailableSequence) {
                nextAvailableSequence = `custom-${fonts.length + 1}`
              }

              fonts[existingFontIndex].id = nextAvailableSequence
            }
          } else {
            // Find next available sequence
            const usedSequences = new Set(fonts.map(f => f.id))
            let nextAvailableSequence = ''
            for (const seq of ORDER) {
              if (!usedSequences.has(seq)) {
                nextAvailableSequence = seq
                break
              }
            }

            if (!nextAvailableSequence) {
              nextAvailableSequence = `custom-${fonts.length + 1}`
            }
            sequentialName = nextAvailableSequence
          }

          let cleanFontName = fontName.trim().replace(/^["']|["']$/g, '')
          if (cleanFontName.includes(',')) cleanFontName = cleanFontName.split(',')[0].trim()

          fonts.push({
            id: sequentialName,
            family: cleanFontName,
            url: url || undefined,
            category: category || undefined
          })

          // Re-sort the fonts based on ORDER
          fonts.sort((a, b) => {
            const aIndex = ORDER.indexOf(a.id)
            const bIndex = ORDER.indexOf(b.id)
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1
            return a.id.localeCompare(b.id)
          })

          saveStoredFonts(fonts)
          // Build proper CSS font-family string for the token value
          const quotedName = cleanFontName.includes(' ') ? `"${cleanFontName}"` : cleanFontName
          const fontStack = category ? `${quotedName}, ${category}` : quotedName
          updateToken(`font/typeface/${sequentialName}`, fontStack)

          // Update variants in tokensJson (not part of rf:fonts yet)
          // Variants are handled at the root font level
          if (variants) {
            try {
              const store = getVarsStore()
              const state = store.getState()
              const tokens = state.tokens as any
              const fontRoot = tokens?.tokens?.font || tokens?.font || {}

              // Store variants by font name, not sequence
              if (!fontRoot.fontVariants) {
                fontRoot.fontVariants = {}
              }

              if (variants.length > 0) {
                fontRoot.fontVariants[cleanFontName.toLowerCase()] = variants
              } else {
                delete fontRoot.fontVariants[cleanFontName.toLowerCase()]
              }

              store.setTokensSilent(tokens)
            } catch (err) {
              console.warn('Failed to update variants:', err)
            }
          }

          // Populate fontUrlMap and window.__fontUrlMap with the URL immediately
          // so ensureFontLoaded can find it
          if (url && typeof url === 'string' && url.includes('fonts.googleapis.com')) {
            try {
              const { populateFontUrlMapFromTokens, setFontUrl } = await import('../../type/fontUtils')

              // First, directly set the URL in the map for immediate access
              setFontUrl(cleanFontName, url)
              setFontUrl(fontName.trim(), url)
              setFontUrl(`"${cleanFontName}"`, url)

              // Re-populate the map with the updated tokens
              const store = getVarsStore()
              populateFontUrlMapFromTokens(store.getState().tokens)

              // Also update window.__fontUrlMap directly for immediate access
              if (typeof window !== 'undefined') {
                if (!(window as any).__fontUrlMap) {
                  (window as any).__fontUrlMap = new Map<string, string>()
                }
                const urlMap = (window as any).__fontUrlMap as Map<string, string>

                const fontNameVariations = [
                  cleanFontName,
                  `"${cleanFontName}"`,
                  fontName.trim(),
                  fontName.trim().replace(/^["']|["']$/g, ''),
                ]
                const uniqueVariations = [...new Set(fontNameVariations.filter(v => v))]
                uniqueVariations.forEach(v => {
                  urlMap.set(v, url)
                })
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

          // Now load the font
          await ensureFontLoaded(cleanFontName)
          await new Promise(resolve => setTimeout(resolve, 300))

          const { getActualFontFamilyName } = await import('../../type/fontUtils')
          try {
            await getActualFontFamilyName(cleanFontName)
          } catch (err) {
            console.warn('Failed to get actual font family name:', err)
          }

          setTimeout(() => {
            try {
              const store = getVarsStore()
              clearDeltaByPrefix(tokenFont('typefaces', ''))
              clearDeltaByPrefix(tokenFont('families', ''))
              store.setTokens(store.getState().tokens)
              store.syncFontsToTokens()
            } catch { }
          }, 100)

          try {
            window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { name: `font/typeface/${sequentialName}`, value: fontName, skipRebuild: true } }))
          } catch { }

        } catch (error) {
          console.error('Failed to add Google Font:', error)
          throw error
        }
      }}
    />
  )
}

export default function FontFamiliesTokens() {
  const { tokens: tokensJson, updateToken } = useVars()
  const { mode } = useThemeMode()
  const [fonts, setFonts] = useState<string[]>(["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans 3", "Nunito", "Raleway", "Merriweather", "PT Sans", "Ubuntu", "Noto Sans", "Playfair Display", "Work Sans", "Rubik", "Fira Sans", "Manrope", "Crimson Pro", "Space Grotesk", "Custom..."])
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
    return getStoredFonts().map((f, index) => ({
      name: `font/typeface/${f.id}`,
      value: f.family,
      position: index
    }))
  }

  const [rows, setRows] = useState<FamilyRow[]>(() => buildRows())

  // Update rows when tokensJson changes, but only if the font data actually changed
  useEffect(() => {
    const newRows = buildRows()
    const changed = newRows.length !== rows.length || newRows.some((r, i) => r.name !== rows[i]?.name || r.value !== rows[i]?.value)
    if (changed) {
      setRows(newRows)
    }
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
      } catch { }
    }
  }, [rows.length])

  // Ensure fonts are loaded when rows change
  // Only load fonts that aren't already loaded in the browser
  useEffect(() => {
    if (rows.length > 0) {
      rows.forEach((row) => {
        if (row.value && row.value.trim()) {
          const fontName = row.value.trim().replace(/^["']|["']$/g, '')
          if (fontName) {
            // Check if font is already loaded before triggering async load
            const isLoaded = document.fonts.check(`16px "${fontName}"`)
            if (!isLoaded) {
              ensureFontLoaded(fontName).catch(() => { })
            }
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
          setRows(buildRows())
        } else if (!detail.skipRebuild) {
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
    }).catch(() => { })
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
    } catch { }
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

      store.setTokensSilent(tokens)
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

        store.setTokensSilent(tokens)
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
    } catch { }
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

    const fonts = getStoredFonts()
    const newFonts = [...fonts]
    const [draggedFont] = newFonts.splice(draggedIndex, 1)
    newFonts.splice(dropIndex, 0, draggedFont)

    const updatedFonts = newFonts.map((f, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      if (f.id !== sequentialName) {
        removeCssVar(`--tokens-font-typeface-${f.id}`)
        removeCssVar(tokenFont('typefaces', f.id))
        removeCssVar(tokenFont('families', f.id))
      }
      return { ...f, id: sequentialName }
    })

    saveStoredFonts(updatedFonts)

    // Purge any stale delta entries for font typefaces/families.
    clearDeltaByPrefix(tokenFont('typefaces', ''))
    clearDeltaByPrefix(tokenFont('families', ''))

    // Clear typography font-family CSS vars so they are regenerated with the new mapping
    const typographyPrefixes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle', 'subtitle-small', 'body', 'body-small', 'caption', 'overline']
    typographyPrefixes.forEach((prefix) => {
      const cssVar = `--recursica_brand_typography_${prefix}-font-family`
      if (typeof document !== 'undefined') document.documentElement.style.removeProperty(cssVar)
    })

    // Update rows immediately so the UI reflects the new order without waiting for store round-trip
    setRows(buildRows())
    setDraggedIndex(null)

    // syncFontsToTokens calls setTokens internally which triggers recomputeAndApplyAll once
    const store = getVarsStore()
    store.syncFontsToTokens()
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDelete = (index: number) => {
    const fonts = getStoredFonts()
    if (index === 0) return
    if (fonts.length <= 1) return

    const rowsToKeep = fonts.filter((_, idx) => idx !== index)

    const updatedFonts = rowsToKeep.map((f, newIndex) => {
      const sequentialName = ORDER[newIndex] || `custom-${newIndex + 1}`
      if (f.id !== sequentialName) {
        removeCssVar(`--tokens-font-typeface-${f.id}`)
        removeCssVar(tokenFont('typefaces', f.id))
        removeCssVar(tokenFont('families', f.id))
      }
      return { ...f, id: sequentialName }
    })

    if (index < fonts.length) {
      const deletedKey = fonts[index].id
      removeCssVar(`--tokens-font-typeface-${deletedKey}`)
      removeCssVar(tokenFont('typefaces', deletedKey))
      removeCssVar(tokenFont('families', deletedKey))
    }

    saveStoredFonts(updatedFonts)

    // Purge stale delta entries for font typefaces/families before recompute
    clearDeltaByPrefix(tokenFont('typefaces', ''))
    clearDeltaByPrefix(tokenFont('families', ''))

    // Clean up fontVariants for the deleted font
    const store = getVarsStore()
    const tokens = JSON.parse(JSON.stringify(store.getState().tokens)) as any
    const fontRoot = tokens?.tokens?.font || tokens?.font || {}
    if (fontRoot.fontVariants) {
      const keptFontNames = new Set(updatedFonts.map(r => r.family.trim().replace(/^["']|["']$/g, '').toLowerCase()))
      Object.keys(fontRoot.fontVariants).forEach(name => {
        if (!keptFontNames.has(name)) delete fontRoot.fontVariants[name]
      })
      store.setTokensSilent(tokens)
    }

    // Remove CSS vars for typeface keys that no longer exist
    const keptKeys = new Set(updatedFonts.map(r => r.id))
    const typefaceRoot = fontRoot.typefaces || fontRoot.typeface || {}
    Object.keys(typefaceRoot).filter(k => !k.startsWith('$')).forEach(k => {
      if (!keptKeys.has(k)) {
        removeCssVar(`--tokens-font-typeface-${k}`)
        removeCssVar(tokenFont('typefaces', k))
        removeCssVar(tokenFont('families', k))
      }
    })

    const typographyPrefixes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle', 'subtitle-small', 'body', 'body-small', 'caption', 'overline']
    typographyPrefixes.forEach((prefix) => {
      const cssVar = `--recursica_brand_typography_${prefix}-font-family`
      if (typeof document !== 'undefined') document.documentElement.style.removeProperty(cssVar)
    })

    setRows(buildRows())

    // syncFontsToTokens calls setTokens internally which triggers recomputeAndApplyAll once
    store.syncFontsToTokens()
  }
  const layer1Elevation = getLayerElevationBoxShadow(mode, 'layer-1')
  const interactiveColor = `--recursica_brand_${mode}-palettes-core-interactive`
  const buttonTextBg = getComponentCssVar('Button', 'colors', 'text-background', 'layer-0')
  const buttonTextText = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
  const buttonSolidBg = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
  const buttonSolidText = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
  const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)
  const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
  const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)

  return (
    <div style={{ display: 'grid', gap: 'var(--recursica_brand_dimensions_general_lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--recursica_brand_dimensions_general_lg)' }}>
        {rows.map((r, index) => {
          // Extract the key from the name (e.g., "font/typeface/primary" -> "primary")
          const key = r.name.replace('font/typeface/', '')
          const label = toTitle(key)
          const fontFamilyVar = tokenFont('typefaces', key)
          const selectedWeight = selectedWeights[r.name] || 'regular'

          return (
            <div
              key={r.name}
              draggable
              data-recursica-layer="1"
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
                background: `var(${genericLayerProperty(1, 'surface')})`,
                border: `1px solid ${draggedIndex === index
                  ? `var(--recursica_brand_palettes_core_interactive)`
                  : dragOverIndex === index
                    ? `var(--recursica_brand_palettes_core_interactive)`
                    : `var(${genericLayerProperty(1, 'border-color')})`
                  }`,
                borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
                padding: `var(${genericLayerProperty(1, 'padding')})`,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--recursica_brand_dimensions_general_md)',
                position: 'relative',
                cursor: draggedIndex === index ? 'grabbing' : 'grab',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'all 0.2s',
                transform: dragOverIndex === index ? 'translateY(-4px)' : 'none',
                boxShadow: dragOverIndex === index
                  ? `0 4px 8px rgba(0, 0, 0, 0.1)`
                  : layer1Elevation || undefined,
                minHeight: 0, // Allow flexbox to control height
              }}
            >
              <div style={{
                position: 'absolute',
                top: 'var(--recursica_brand_dimensions_general_md)',
                right: 'var(--recursica_brand_dimensions_general_md)',
                display: 'flex',
                gap: 'var(--recursica_brand_dimensions_general_sm)',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_default)', flexShrink: 0 }}>
                <Badge
                  variant="primary-color"
                  size="small"
                  layer="layer-1"
                >
                  {label}
                </Badge>
                <h2 style={{
                  margin: 0,
                  fontFamily: `var(${fontFamilyVar})`,
                  fontSize: 'var(--recursica_brand_typography_h2-font-size)',
                  fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
                  letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
                  lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
                  color: `var(${genericLayerText(1, 'color')})`,
                  opacity: `var(${genericLayerText(1, 'high-emphasis')})`,
                }}>
                  {r.value || 'Select font'}
                </h2>
              </div>
              <div style={{
                fontFamily: `var(${fontFamilyVar})`,
                fontSize: 'var(--recursica_brand_typography_body-font-size)',
                color: `var(${genericLayerText(1, 'color')})`,
                opacity: `var(${genericLayerText(1, 'high-emphasis')})`,
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
                gap: 'var(--recursica_brand_dimensions_general_default)',
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
                  } catch { }

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
                  } catch { }

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
        {(() => {
          return showInspiration && (
            <div
              data-recursica-layer="1"
              style={{
                background: `var(--recursica_brand_palettes_neutral_100_color_tone)`,
                borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
                padding: `var(${genericLayerProperty(1, 'padding')})`,
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
                      top: 'var(--recursica_brand_dimensions_general_md)',
                      right: 'var(--recursica_brand_dimensions_general_md)',
                    }}
                  />
                ) : null
              })()}
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
                  fontSize: 'var(--recursica_brand_typography_h3-font-size)',
                  fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
                  letterSpacing: 'var(--recursica_brand_typography_h3-font-letter-spacing)',
                  lineHeight: 'var(--recursica_brand_typography_h3-line-height)',
                  color: `var(--recursica_brand_palettes_neutral_100_color_on-tone)`,
                }}>
                  Need inspiration?
                </h3>
                <p style={{
                  margin: 0,
                  marginTop: 'var(--recursica_brand_dimensions_general_md)',
                  fontFamily: 'var(--recursica_brand_typography_body-font-family)',
                  fontSize: 'var(--recursica_brand_typography_body-font-size)',
                  fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
                  letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
                  lineHeight: 'var(--recursica_brand_typography_body-line-height)',
                  color: `var(--recursica_brand_palettes_neutral_100_color_on-tone)`,
                  opacity: `var(--recursica_brand_text-emphasis_high)`,
                }}>
                  Browse the Google Fonts library to find the perfect typeface.
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                layer="layer-1"
                onClick={() => window.open('https://fonts.google.com', '_blank')}
                icon={(() => {
                  const GoogleIcon = iconNameToReactComponent('google-logo')
                  return GoogleIcon ? <GoogleIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
                })()}
                style={{
                  marginTop: 'var(--recursica_brand_dimensions_general_md)',
                  alignSelf: 'flex-start',
                }}
              >
                Explore Google Fonts
              </Button>
            </div>
          )
        })()}
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
                removeCssVar(tokenFont('typefaces', oldKey))
                removeCssVar(`--tokens-font-typeface-${newKey}`)
                removeCssVar(tokenFont('typefaces', newKey))

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
                  removeCssVar(tokenFont('typefaces', oldKey))
                }
              }

              // Update stored fonts (rf:fonts) so the rows array reflects the sequence change
              const fonts = getStoredFonts()
              const oldFontIndex = fonts.findIndex(f => f.id === oldKey)
              const newFontIndex = fonts.findIndex(f => f.id === newKey)

              if (oldFontIndex !== -1 && newFontIndex !== -1) {
                // Swap IDs
                fonts[oldFontIndex].id = newKey
                fonts[newFontIndex].id = oldKey
              } else if (oldFontIndex !== -1) {
                // Just change ID
                fonts[oldFontIndex].id = newKey
              }

              // Re-sort the fonts based on ORDER
              fonts.sort((a, b) => {
                const aIndex = ORDER.indexOf(a.id)
                const bIndex = ORDER.indexOf(b.id)
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                if (aIndex !== -1) return -1
                if (bIndex !== -1) return 1
                return a.id.localeCompare(b.id)
              })

              saveStoredFonts(fonts)
              setRows(buildRows())

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
              store.setTokensSilent(tokens)

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
                  store.syncFontsToTokens()

                  // Dispatch event to trigger rebuild of rows and availableVariants
                  try {
                    const all = readOverrides()
                    window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all, skipRebuild: false } }))
                  } catch { }
                } catch { }
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

            const fonts = getStoredFonts()

            // Use provided sequence or find next available
            let sequentialName: string
            if (sequence && ORDER.includes(sequence)) {
              sequentialName = sequence

              // If the sequence is already taken, we need to move the existing font
              const existingFontIndex = fonts.findIndex(f => f.id === sequence)
              if (existingFontIndex !== -1) {
                // Find next available position in the ORDER sequence
                const usedSequences = new Set(fonts.map(f => f.id))
                let nextAvailableSequence = ''
                for (const seq of ORDER) {
                  if (!usedSequences.has(seq)) {
                    nextAvailableSequence = seq
                    break
                  }
                }

                if (!nextAvailableSequence) {
                  nextAvailableSequence = `custom-${fonts.length + 1}`
                }

                fonts[existingFontIndex].id = nextAvailableSequence
              }
            } else {
              // Find next available sequence
              const usedSequences = new Set(fonts.map(f => f.id))
              let nextAvailableSequence = ''
              for (const seq of ORDER) {
                if (!usedSequences.has(seq)) {
                  nextAvailableSequence = seq
                  break
                }
              }

              if (!nextAvailableSequence) {
                nextAvailableSequence = `custom-${fonts.length + 1}`
              }
              sequentialName = nextAvailableSequence
            }

            const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '')

            fonts.push({
              id: sequentialName,
              family: cleanFontName,
              url: fontSource.type === 'npm' ? fontSource.url : undefined
            })

            // Re-sort the fonts based on ORDER
            fonts.sort((a, b) => {
              const aIndex = ORDER.indexOf(a.id)
              const bIndex = ORDER.indexOf(b.id)
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
              if (aIndex !== -1) return -1
              if (bIndex !== -1) return 1
              return a.id.localeCompare(b.id)
            })

            saveStoredFonts(fonts)
            updateToken(`font/typeface/${sequentialName}`, cleanFontName)

            setRows(buildRows())
            setTimeout(() => {
              try {
                const store = getVarsStore()
                clearDeltaByPrefix(tokenFont('typefaces', ''))
                clearDeltaByPrefix(tokenFont('families', ''))
                store.setTokens(store.getState().tokens)
                store.syncFontsToTokens()
              } catch { }
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
