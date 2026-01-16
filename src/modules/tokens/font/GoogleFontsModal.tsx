import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { iconNameToReactComponent } from '../../components/iconUtils'

export type GoogleFontsModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (fontName: string) => void
  existingFonts?: string[] // Array of existing font family names to prevent duplicates
}

export function GoogleFontsModal({
  open,
  onClose,
  onAccept,
  existingFonts = [],
}: GoogleFontsModalProps) {
  const { mode } = useThemeMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [fonts, setFonts] = useState<Array<{ family: string; category?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedFont, setSelectedFont] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const layer2Base = `--recursica-brand-themes-${mode}-layer-layer-2-property`

  // Fetch Google Fonts
  useEffect(() => {
    if (!open) return
    
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_FONTS_API_KEY as string | undefined
    if (!apiKey) {
      console.warn('Google Fonts API key not found')
      return
    }

    setLoading(true)
    fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error('Failed to fetch fonts')
        }
        const data = await r.json()
        if (data && Array.isArray(data.items)) {
          setFonts(data.items.map((it: any) => ({
            family: String(it.family || ''),
            category: it.category,
          })).filter((f: any) => f.family))
        }
      })
      .catch((error) => {
        console.error('Failed to fetch Google Fonts:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open])

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  const filteredFonts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return fonts.slice(0, 50) // Show top 50 by default
    }
    const query = debouncedSearchQuery.toLowerCase()
    return fonts.filter((font) =>
      font.family.toLowerCase().includes(query)
    ).slice(0, 50)
  }, [fonts, debouncedSearchQuery])

  const handleAccept = () => {
    const fontToAdd = selectedFont || searchQuery.trim()
    
    if (!fontToAdd) {
      setError('Please select or enter a font name')
      return
    }
    
    // Check if font already exists (case-insensitive comparison)
    const fontToAddLower = fontToAdd.toLowerCase().trim()
    const isDuplicate = existingFonts.some(existing => 
      existing.toLowerCase().trim() === fontToAddLower
    )
    
    if (isDuplicate) {
      setError('This font family is already added')
      return
    }
    
    setError('')
    onAccept(fontToAdd)
    setSelectedFont(null)
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }

  const handleClose = () => {
    setSelectedFont(null)
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setError('')
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: `var(${layer2Base}-surface)`,
          color: `var(${layer2Base}-element-text-color)`,
          border: `1px solid var(${layer2Base}-border-color)`,
          borderRadius: 'var(--recursica-brand-dimensions-border-radii-xl)',
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-2-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-2-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-2-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-2-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-2-shadow-color)`,
          padding: `var(${layer2Base}-padding)`,
          display: 'grid',
          gap: 'var(--recursica-brand-dimensions-spacers-lg)',
          width: 600,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--recursica-brand-typography-h5-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h5-font-weight)',
            color: `var(${layer2Base}-element-text-color)`,
            opacity: `var(${layer2Base}-element-text-high-emphasis)`,
          }}>
            Add font family
          </h2>
          <button
            onClick={handleClose}
            style={{
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
              return XIcon ? <XIcon style={{ width: 20, height: 20, color: `var(${layer2Base}-element-text-color)`, opacity: 0.6 }} /> : null
            })()}
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Name or search Google fonts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setError('') // Clear error when typing
            }}
            style={{
              padding: 'var(--recursica-brand-dimensions-spacers-default)',
              border: `1px solid ${error ? `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)` : `var(${layer1Base}-border-color)`}`,
              borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
              background: `var(${layer1Base}-surface)`,
              color: `var(${layer1Base}-element-text-color)`,
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              width: '100%',
            }}
          />
          {error && (
            <div style={{
              marginTop: 'var(--recursica-brand-dimensions-spacers-xs)',
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)`,
            }}>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            overflowY: 'auto',
            maxHeight: '400px',
            display: 'grid',
            gap: 'var(--recursica-brand-dimensions-spacers-xs)',
          }}
        >
          {loading ? (
            <div style={{
              padding: 'var(--recursica-brand-dimensions-spacers-lg)',
              textAlign: 'center',
              color: `var(${layer2Base}-element-text-color)`,
              opacity: `var(${layer2Base}-element-text-low-emphasis)`,
            }}>
              Loading fonts...
            </div>
          ) : filteredFonts.length === 0 ? (
            <div style={{
              padding: 'var(--recursica-brand-dimensions-spacers-lg)',
              textAlign: 'center',
              color: `var(${layer2Base}-element-text-color)`,
              opacity: `var(${layer2Base}-element-text-low-emphasis)`,
            }}>
              No fonts found
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isDuplicate = existingFonts.some(existing => 
                existing.toLowerCase().trim() === font.family.toLowerCase().trim()
              )
              return (
                <button
                  key={font.family}
                  onClick={() => {
                    if (!isDuplicate) {
                      setSelectedFont(font.family)
                      setError('')
                    } else {
                      setError('This font family is already added')
                    }
                  }}
                  disabled={isDuplicate}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-spacers-default)',
                    border: `1px solid var(${layer1Base}-border-color)`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    background: selectedFont === font.family
                      ? `var(${layer1Base}-element-interactive)`
                      : isDuplicate
                      ? `var(${layer1Base}-surface)`
                      : `var(${layer1Base}-surface)`,
                    color: selectedFont === font.family
                      ? `var(${layer1Base}-element-interactive-on-tone)`
                      : isDuplicate
                      ? `var(${layer1Base}-element-text-color)`
                      : `var(${layer1Base}-element-text-color)`,
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    fontFamily: `"${font.family}", sans-serif`,
                    cursor: isDuplicate ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: isDuplicate ? 0.5 : 1,
                  }}
                >
                  {font.family}
                </button>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--recursica-brand-dimensions-spacers-default)' }}>
          <Button
            variant="outline"
            size="default"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            size="default"
            onClick={handleAccept}
            disabled={(!selectedFont && !searchQuery.trim()) || !!error}
          >
            Add Font
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
