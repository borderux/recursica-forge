import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { ensureFontLoaded, getActualFontFamilyName, getCachedFontFamilyName } from '../../type/fontUtils'

export type GoogleFontsModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (fontName: string) => void
  existingFonts?: string[] // Array of existing font family names to prevent duplicates
}

type Tab = 'google' | 'url'

export function GoogleFontsModal({
  open,
  onClose,
  onAccept,
  existingFonts = [],
}: GoogleFontsModalProps) {
  const { mode } = useThemeMode()
  const [activeTab, setActiveTab] = useState<Tab>('google')
  const [googleFontsUrl, setGoogleFontsUrl] = useState('')
  const [fontFaceUrl, setFontFaceUrl] = useState('')
  const [fontName, setFontName] = useState('')
  const [availableFonts, setAvailableFonts] = useState<string[]>([])
  const [selectedFontIndex, setSelectedFontIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const layer2Base = `--recursica-brand-themes-${mode}-layer-layer-2-property`
  const layer3Base = `--recursica-brand-themes-${mode}-layer-layer-3-property`

  // Extract font family names from Google Fonts URL
  const extractFontNamesFromGoogleUrl = (url: string): string[] => {
    try {
      const urlObj = new URL(url)
      // Get all 'family' parameters (URL can have multiple)
      const familyParams = urlObj.searchParams.getAll('family')
      if (familyParams.length === 0) return []
      
      const fontNames: string[] = []
      for (const familyParam of familyParams) {
        // Extract font name (before : or &)
        // Examples: "Lexend:wght@100..900" -> "Lexend", "Rubik+Storm" -> "Rubik Storm"
        const fontName = familyParam.split(':')[0].split('&')[0]
        // Decode and replace + with spaces
        const decoded = decodeURIComponent(fontName).replace(/\+/g, ' ')
        if (decoded && !fontNames.includes(decoded)) {
          fontNames.push(decoded)
        }
      }
      return fontNames
    } catch {
      return []
    }
  }

  // Load font from Google Fonts URL
  const loadGoogleFontFromUrl = async (url: string, selectedFontName?: string): Promise<string> => {
    const extractedNames = extractFontNamesFromGoogleUrl(url)
    if (extractedNames.length === 0) {
      throw new Error('Could not extract font family name from URL')
    }

    // Use selected font name if provided, otherwise use the first one
    const fontNameToLoad = selectedFontName || extractedNames[0]
    
    // Use the same ID format that ensureFontLoaded expects so it recognizes the font as already loaded
    // Format: gf-{font-name-lowercase-with-dashes}
    const linkId = `gf-${fontNameToLoad.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    let existingLink = document.getElementById(linkId) as HTMLLinkElement | null

    if (!existingLink) {
      existingLink = document.createElement('link')
      existingLink.id = linkId
      existingLink.rel = 'stylesheet'
      existingLink.href = url
      document.head.appendChild(existingLink)
    } else {
      // Update href in case URL changed
      existingLink.href = url
    }

    // Wait for stylesheet to load
    await new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (existingLink!.sheet) {
        resolve()
        return
      }
      
      // Set up load/error handlers
      const timeout = setTimeout(() => {
        // If sheet is available after timeout, consider it loaded
        if (existingLink!.sheet) {
          resolve()
        } else {
          reject(new Error('Timeout waiting for Google Fonts stylesheet to load'))
        }
      }, 5000) // 5 second timeout
      
      existingLink!.onload = () => {
        clearTimeout(timeout)
        resolve()
      }
      existingLink!.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Failed to load Google Fonts stylesheet'))
      }
    })

    // Wait a bit for CSS to parse and font to be available
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Cache the formatted name immediately so it's available when CSS variables are generated
    // getCachedFontFamilyName will format it with quotes and fallback, and cache it
    const { getCachedFontFamilyName } = await import('../../type/fontUtils')
    const formattedName = getCachedFontFamilyName(fontNameToLoad)
    
    // Also try getActualFontFamilyName which might detect the font from the link and update cache
    try {
      const actualName = await getActualFontFamilyName(fontNameToLoad)
      // Extract just the font name (first part before comma) for storage
      // The cache will have the full formatted version with fallback
      const fontNameOnly = actualName.replace(/^["']|["']$/g, '').split(',')[0].trim()
      return fontNameOnly || fontNameToLoad
    } catch (e) {
      console.warn('Error getting actual font family name:', e)
    }

    // Return the font name (cache is already set by getCachedFontFamilyName above)
    return fontNameToLoad
  }

  // Load font from public @font-face URL
  const loadFontFromUrl = async (url: string, fontNameInput: string): Promise<string> => {
    // Create a link element to load the stylesheet
    const linkId = `font-face-${Date.now()}`
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = url

    // Wait for stylesheet to load
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve()
      link.onerror = () => reject(new Error('Failed to load font stylesheet'))
      document.head.appendChild(link)
    })

    // Wait a bit for CSS to parse
    await new Promise(resolve => setTimeout(resolve, 200))

    // If font name was provided, use it; otherwise try to extract from @font-face rules
    if (fontNameInput && fontNameInput.trim()) {
      return fontNameInput.trim()
    }

    // Try to extract font-family from the loaded stylesheet
    try {
      const styleSheets = Array.from(document.styleSheets)
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || [])
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const fontFamily = rule.style.fontFamily
              if (fontFamily) {
                // Extract font name (remove quotes, get first part before comma)
                const name = fontFamily.replace(/^["']|["']$/g, '').split(',')[0].trim()
                if (name) return name
              }
            }
          }
        } catch {}
      }
    } catch {}

    throw new Error('Could not determine font family name. Please enter the font name manually.')
  }

  const handleAccept = async () => {
    setError('')
    setLoading(true)

    try {
      let finalFontName = ''

      if (activeTab === 'google') {
        if (!googleFontsUrl.trim()) {
          setError('Please enter a Google Fonts URL')
          setLoading(false)
          return
        }

        // Validate it's a Google Fonts URL
        if (!googleFontsUrl.includes('fonts.googleapis.com')) {
          setError('Please enter a valid Google Fonts URL (fonts.googleapis.com)')
          setLoading(false)
          return
        }

        // Extract available fonts from URL
        const fonts = extractFontNamesFromGoogleUrl(googleFontsUrl.trim())
        if (fonts.length === 0) {
          setError('Could not extract font family names from URL')
          setLoading(false)
          return
        }

        // Use selected font or first one
        const fontToLoad = fonts[selectedFontIndex] || fonts[0]
        finalFontName = await loadGoogleFontFromUrl(googleFontsUrl.trim(), fontToLoad)
      } else {
        // Public font face URL tab
        if (!fontFaceUrl.trim()) {
          setError('Please enter a font stylesheet URL')
          setLoading(false)
          return
        }

        finalFontName = await loadFontFromUrl(fontFaceUrl.trim(), fontName.trim())
      }

      if (!finalFontName) {
        setError('Could not determine font family name')
        setLoading(false)
        return
      }

      // Check if font already exists (case-insensitive comparison)
      const fontToAddLower = finalFontName.toLowerCase().trim()
      const isDuplicate = existingFonts.some(existing => 
        existing.toLowerCase().trim() === fontToAddLower
      )

      if (isDuplicate) {
        setError('This font family is already added')
        setLoading(false)
        return
      }

      // The font should already be loaded from the URL
      // We don't need to call ensureFontLoaded here because:
      // 1. The font is already loaded via the <link> tag we created
      // 2. The onAccept handler will call ensureFontLoaded anyway
      // 3. Calling it here might cause duplicate loading attempts

      setError('')
      onAccept(finalFontName)
      setGoogleFontsUrl('')
      setFontFaceUrl('')
      setFontName('')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load font')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setGoogleFontsUrl('')
    setFontFaceUrl('')
    setFontName('')
    setAvailableFonts([])
    setSelectedFontIndex(0)
    setError('')
    setActiveTab('google')
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
          boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-4-x-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-y-axis) var(--recursica-brand-themes-${mode}-elevations-elevation-4-blur) var(--recursica-brand-themes-${mode}-elevations-elevation-4-spread) var(--recursica-brand-themes-${mode}-elevations-elevation-4-shadow-color)`,
          padding: `var(${layer2Base}-padding)`,
          display: 'grid',
          gap: 'var(--recursica-brand-dimensions-general-lg)',
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
              padding: 'var(--recursica-brand-dimensions-general-default)',
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-general-default)', borderBottom: `1px solid var(${layer1Base}-border-color)` }}>
          <button
            onClick={() => {
              setActiveTab('google')
              setError('')
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 'var(--recursica-brand-dimensions-general-default)',
              borderBottom: `2px solid ${activeTab === 'google' ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)` : 'transparent'}`,
              color: activeTab === 'google' 
                ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`
                : `var(${layer2Base}-element-text-color)`,
              opacity: activeTab === 'google' 
                ? `var(${layer2Base}-element-text-high-emphasis)`
                : `var(${layer2Base}-element-text-low-emphasis)`,
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: activeTab === 'google' ? 'var(--recursica-brand-typography-body-font-weight)' : '400',
            }}
          >
            Google Fonts
          </button>
          <button
            onClick={() => {
              setActiveTab('url')
              setError('')
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 'var(--recursica-brand-dimensions-general-default)',
              borderBottom: `2px solid ${activeTab === 'url' ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)` : 'transparent'}`,
              color: activeTab === 'url' 
                ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`
                : `var(${layer2Base}-element-text-color)`,
              opacity: activeTab === 'url' 
                ? `var(${layer2Base}-element-text-high-emphasis)`
                : `var(${layer2Base}-element-text-low-emphasis)`,
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: activeTab === 'url' ? 'var(--recursica-brand-typography-body-font-weight)' : '400',
            }}
          >
            Public Font Face URL
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-md)' }}>
          {activeTab === 'google' ? (
            <>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                }}>
                  Google Fonts URL
                </label>
                <input
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700"
                  value={googleFontsUrl}
                  onChange={(e) => {
                    const url = e.target.value
                    setGoogleFontsUrl(url)
                    setError('')
                    // Extract available fonts when URL changes
                    if (url.includes('fonts.googleapis.com')) {
                      const fonts = extractFontNamesFromGoogleUrl(url)
                      setAvailableFonts(fonts)
                      setSelectedFontIndex(0)
                    } else {
                      setAvailableFonts([])
                      setSelectedFontIndex(0)
                    }
                  }}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default)',
                    border: `1px solid ${error ? `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)` : `var(${layer1Base}-border-color)`}`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    background: `var(${layer1Base}-surface)`,
                    color: `var(${layer1Base}-element-text-color)`,
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    width: '100%',
                  }}
                />
                <div style={{
                  marginTop: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-low-emphasis)`,
                }}>
                  Paste a Google Fonts URL. The font family name will be extracted automatically.
                </div>
                {availableFonts.length > 1 && (
                  <div style={{ marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                      fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                      color: `var(${layer2Base}-element-text-color)`,
                      opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                    }}>
                      Select font to add ({availableFonts.length} fonts found):
                    </label>
                    <select
                      value={selectedFontIndex}
                      onChange={(e) => setSelectedFontIndex(Number(e.target.value))}
                      style={{
                        padding: 'var(--recursica-brand-dimensions-general-default)',
                        border: `1px solid var(${layer1Base}-border-color)`,
                        borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                        background: `var(${layer1Base}-surface)`,
                        color: `var(${layer1Base}-element-text-color)`,
                        fontSize: 'var(--recursica-brand-typography-body-font-size)',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      {availableFonts.map((font, index) => (
                        <option key={index} value={index}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {availableFonts.length === 1 && (
                  <div style={{
                    marginTop: 'var(--recursica-brand-dimensions-general-default)',
                    padding: 'var(--recursica-brand-dimensions-general-default)',
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    background: `var(${layer1Base}-surface)`,
                    border: `1px solid var(${layer1Base}-border-color)`,
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer2Base}-element-text-color)`,
                  }}>
                    Font detected: <strong>{availableFonts[0]}</strong>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                }}>
                  Font Stylesheet URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/fonts.css"
                  value={fontFaceUrl}
                  onChange={(e) => {
                    setFontFaceUrl(e.target.value)
                    setError('')
                  }}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default)',
                    border: `1px solid ${error ? `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)` : `var(${layer1Base}-border-color)`}`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    background: `var(${layer1Base}-surface)`,
                    color: `var(${layer1Base}-element-text-color)`,
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    width: '100%',
                    marginBottom: 'var(--recursica-brand-dimensions-general-md)',
                  }}
                />
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                }}>
                  Font Family Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Roboto"
                  value={fontName}
                  onChange={(e) => {
                    setFontName(e.target.value)
                    setError('')
                  }}
                  style={{
                    padding: 'var(--recursica-brand-dimensions-general-default)',
                    border: `1px solid ${error ? `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)` : `var(${layer1Base}-border-color)`}`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    background: `var(${layer1Base}-surface)`,
                    color: `var(${layer1Base}-element-text-color)`,
                    fontSize: 'var(--recursica-brand-typography-body-font-size)',
                    width: '100%',
                  }}
                />
                <div style={{
                  marginTop: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-low-emphasis)`,
                }}>
                  Paste a URL to a stylesheet containing @font-face rules. If the font name cannot be extracted automatically, enter it manually.
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{
              padding: 'var(--recursica-brand-dimensions-general-default)',
              borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
              background: `var(--recursica-brand-themes-${mode}-palettes-core-error-50-tone)`,
              border: `1px solid var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)`,
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(--recursica-brand-themes-${mode}-palettes-core-error-200-tone)`,
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--recursica-brand-dimensions-general-default)' }}>
          <Button
            variant="outline"
            size="default"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            size="default"
            onClick={handleAccept}
            disabled={loading || (activeTab === 'google' && !googleFontsUrl.trim()) || (activeTab === 'url' && !fontFaceUrl.trim())}
          >
            {loading ? 'Loading...' : 'Add Font'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
