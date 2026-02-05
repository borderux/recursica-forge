import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { Checkbox } from '../../../components/adapters/Checkbox'
import { TextField } from '../../../components/adapters/TextField'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { ensureFontLoaded, getActualFontFamilyName, getCachedFontFamilyName } from '../../type/fontUtils'

export type GoogleFontsModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (fontName: string, url?: string, variants?: Array<{ weight: string; style: string }>, sequence?: string) => void | Promise<void>
  existingFonts?: string[] // Array of existing font family names to prevent duplicates
  availableSequences?: string[] // Available sequence positions (e.g., ['primary', 'secondary', 'tertiary'])
  currentSequence?: string // Current sequence position if editing
}

type Tab = 'google' | 'custom'

export function GoogleFontsModal({
  open,
  onClose,
  onAccept,
  existingFonts = [],
  availableSequences = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'],
  currentSequence,
}: GoogleFontsModalProps) {
  const { mode } = useThemeMode()
  const [activeTab, setActiveTab] = useState<Tab>('google')
  const [googleFontsUrl, setGoogleFontsUrl] = useState('')
  const [customFontName, setCustomFontName] = useState('')
  const [customFontFallback, setCustomFontFallback] = useState<'serif' | 'sans-serif'>('sans-serif')
  // Default to last position (new position) if no currentSequence is provided
  const defaultSequence = currentSequence || availableSequences[availableSequences.length - 1] || availableSequences[0]
  const [selectedSequence, setSelectedSequence] = useState<string>(defaultSequence)
  
  // Update selectedSequence when modal opens or currentSequence changes
  useEffect(() => {
    if (open) {
      const newDefault = currentSequence || availableSequences[availableSequences.length - 1] || availableSequences[0]
      setSelectedSequence(newDefault)
    }
  }, [open, currentSequence, availableSequences])
  const [availableFonts, setAvailableFonts] = useState<string[]>([])
  const [selectedFontIndex, setSelectedFontIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Weight+style combination selection
  // All 18 combinations: 9 weights × 2 styles
  const weights = useMemo(() => [100, 200, 300, 400, 500, 600, 700, 800, 900], [])
  const styles = useMemo(() => ['normal', 'italic'], [])
  const allWeightStyleCombos = useMemo(() => {
    const combos: Array<{ weight: number; style: string; id: string }> = []
    weights.forEach(weight => {
      styles.forEach(style => {
        combos.push({ weight, style, id: `${weight}-${style}` })
      })
    })
    return combos
  }, [weights, styles])
  const [selectedCombos, setSelectedCombos] = useState<Set<string>>(new Set())
  
  // Calculate "All" checkbox state: checked if all selected, indeterminate if some selected
  const allCheckboxState = useMemo(() => {
    const selectedCount = selectedCombos.size
    const totalCount = allWeightStyleCombos.length
    if (selectedCount === 0) return { checked: false, indeterminate: false }
    if (selectedCount === totalCount) return { checked: true, indeterminate: false }
    return { checked: false, indeterminate: true }
  }, [selectedCombos.size, allWeightStyleCombos.length])

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const layer2Base = `--recursica-brand-themes-${mode}-layer-layer-2-property`
  const layer3Base = `--recursica-brand-themes-${mode}-layer-layer-3-property`

  // Initialize selectedCombos when modal opens or tab changes
  useEffect(() => {
    if (open) {
      if (activeTab === 'custom' && selectedCombos.size === 0) {
        // Select all combinations by default for custom tab
        setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
      }
    }
  }, [open, activeTab, allWeightStyleCombos])

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

  // Parse weights and styles from Google Fonts URL for a specific font
  const parseWeightsAndStyles = (url: string, fontName: string): { weights: number[]; styles: string[] } => {
    try {
      const urlObj = new URL(url)
      const familyParams = urlObj.searchParams.getAll('family')
      
      // Find the family param that matches this font
      const fontParam = familyParams.find(param => {
        const name = param.split(':')[0].split('&')[0]
        const decoded = decodeURIComponent(name).replace(/\+/g, ' ')
        return decoded.toLowerCase() === fontName.toLowerCase()
      })
      
      if (!fontParam) {
        // If no specific param found, try to parse from first param
        if (familyParams.length > 0) {
          return parseWeightsAndStylesFromParam(familyParams[0])
        }
        return { weights: [], styles: [] }
      }
      
      return parseWeightsAndStylesFromParam(fontParam)
    } catch {
      return { weights: [], styles: [] }
    }
  }

  // Parse weights and styles from a family parameter string
  // Always return all standard weights (100-900) and both styles (normal, italic)
  // This gives users all 18 options to choose from
  const parseWeightsAndStylesFromParam = (param: string): { weights: number[]; styles: string[] } => {
    // Always return all standard weights
    const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
    
    // Always return both styles
    const styles = ['normal', 'italic']
    
    return { weights, styles }
  }

  // Build Google Fonts URL with selected weights and styles
  const buildFontUrl = (baseUrl: string, fontName: string, weights: number[], styles: string[]): string => {
    try {
      const urlObj = new URL(baseUrl)
      
      // Build the family parameter
      // Replace spaces with + for the font name (Google Fonts format)
      const fontNameWithPlus = fontName.replace(/\s+/g, '+')
      let familyParam = fontNameWithPlus
      
      // Add weights
      if (weights.length > 0) {
        const weightsStr = weights.sort((a, b) => a - b).join(';')
        familyParam += `:wght@${weightsStr}`
      }
      
      // Add styles (italic)
      const hasItalic = styles.includes('italic')
      const hasNormal = styles.includes('normal')
      if (hasItalic && hasNormal) {
        familyParam += `:ital@0;1`
      } else if (hasItalic) {
        familyParam += `:ital@1`
      }
      
      // Manually construct the URL to avoid encoding : and @ characters
      // URLSearchParams.set() would encode them, but Google Fonts needs them unencoded
      const baseUrlWithoutSearch = urlObj.origin + urlObj.pathname
      const existingParams = new URLSearchParams(urlObj.search)
      
      // Get all existing params except 'family'
      const otherParams: string[] = []
      existingParams.forEach((value, key) => {
        if (key !== 'family') {
          otherParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        }
      })
      
      // Build family param: don't encode +, :, or @ characters
      // Google Fonts expects: family=Rubik+Storm:wght@400 (not encoded)
      // Only encode other special characters in the font name if needed
      // For now, just use the familyParam as-is since we've already replaced spaces with +
      const allParams = [`family=${familyParam}`, ...otherParams]
      
      return `${baseUrlWithoutSearch}?${allParams.join('&')}`
    } catch {
      return baseUrl
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
      // Remove old link and create new one to ensure fresh load
      existingLink.remove()
      existingLink = document.createElement('link')
      existingLink.id = linkId
      existingLink.rel = 'stylesheet'
      existingLink.href = url
      document.head.appendChild(existingLink)
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
        
        // Extract selected combinations
        const selectedComboArray = Array.from(selectedCombos)
          .map(id => allWeightStyleCombos.find(c => c.id === id))
          .filter((c): c is { weight: number; style: string; id: string } => c !== undefined)
        
        if (selectedComboArray.length === 0) {
          setError('Please select at least one weight+style combination')
          setLoading(false)
          return
        }
        
        // Extract unique weights and styles from selected combinations
        const weightsArray = [...new Set(selectedComboArray.map(c => c.weight))].sort((a, b) => a - b)
        const stylesArray = [...new Set(selectedComboArray.map(c => c.style))]
        
        // Build URL with selected weights and styles
        const finalUrl = buildFontUrl(googleFontsUrl.trim(), fontToLoad, weightsArray, stylesArray)
        
        // Don't load the font here - let onAccept handle it via ensureFontLoaded
        // This avoids conflicts and ensures the URL is properly stored in token extensions first
        finalFontName = fontToLoad
        
        // Build variants array for token extensions from selected combinations
        const variants: Array<{ weight: string; style: string }> = []
        const weightMap: Record<number, string> = {
          100: 'thin',
          200: 'extra-light',
          300: 'light',
          400: 'regular',
          500: 'medium',
          600: 'semi-bold',
          700: 'bold',
          800: 'extra-bold',
          900: 'black'
        }
        
        selectedComboArray.forEach(combo => {
          // Map weight to closest token weight name
          let weightKey = 'regular' // default
          if (combo.weight <= 150) weightKey = 'thin'
          else if (combo.weight <= 250) weightKey = 'extra-light'
          else if (combo.weight <= 350) weightKey = 'light'
          else if (combo.weight <= 450) weightKey = 'regular'
          else if (combo.weight <= 550) weightKey = 'medium'
          else if (combo.weight <= 650) weightKey = 'semi-bold'
          else if (combo.weight <= 750) weightKey = 'bold'
          else if (combo.weight <= 850) weightKey = 'extra-bold'
          else weightKey = 'black'
          
          variants.push({
            weight: `{tokens.font.weights.${weightKey}}`,
            style: `{tokens.font.styles.${combo.style}}`
          })
        })
        
        // Call onAccept with font name, URL, variants, and sequence
        setError('')
        try {
          await onAccept(finalFontName, finalUrl, variants, selectedSequence)
          setGoogleFontsUrl('')
          setCustomFontName('')
          setCustomFontFallback('sans-serif')
          setAvailableFonts([])
          setSelectedFontIndex(0)
          setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
          setLoading(false)
          onClose()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to add font')
          setLoading(false)
        }
        return
      } else {
        // Custom font tab
        if (!customFontName.trim()) {
          setError('Please enter a font family name')
          setLoading(false)
          return
        }

        // Extract selected combinations
        const selectedComboArray = Array.from(selectedCombos)
          .map(id => allWeightStyleCombos.find(c => c.id === id))
          .filter((c): c is { weight: number; style: string; id: string } => c !== undefined)
        
        if (selectedComboArray.length === 0) {
          setError('Please select at least one weight+style combination')
          setLoading(false)
          return
        }

        // Check if font already exists (case-insensitive comparison)
        const fontToAddLower = customFontName.trim().toLowerCase()
        const isDuplicate = existingFonts.some(existing => 
          existing.toLowerCase().trim() === fontToAddLower
        )

        if (isDuplicate) {
          setError('This font family is already added')
          setLoading(false)
          return
        }

        // Build variants array for token extensions from selected combinations
        const variants: Array<{ weight: string; style: string }> = []
        const weightMap: Record<number, string> = {
          100: 'thin',
          200: 'extra-light',
          300: 'light',
          400: 'regular',
          500: 'medium',
          600: 'semi-bold',
          700: 'bold',
          800: 'extra-bold',
          900: 'black'
        }
        
        selectedComboArray.forEach(combo => {
          // Map weight to closest token weight name
          let weightKey = 'regular' // default
          if (combo.weight <= 150) weightKey = 'thin'
          else if (combo.weight <= 250) weightKey = 'extra-light'
          else if (combo.weight <= 350) weightKey = 'light'
          else if (combo.weight <= 450) weightKey = 'regular'
          else if (combo.weight <= 550) weightKey = 'medium'
          else if (combo.weight <= 650) weightKey = 'semi-bold'
          else if (combo.weight <= 750) weightKey = 'bold'
          else if (combo.weight <= 850) weightKey = 'extra-bold'
          else weightKey = 'black'
          
          variants.push({
            weight: `{tokens.font.weights.${weightKey}}`,
            style: `{tokens.font.styles.${combo.style}}`
          })
        })

        // Format font name with fallback (serif or sans-serif)
        finalFontName = `${customFontName.trim()}, ${customFontFallback}`

        // Call onAccept with font name (no URL for custom fonts), variants, and sequence
        setError('')
        try {
          await onAccept(finalFontName, undefined, variants, selectedSequence)
          setGoogleFontsUrl('')
          setCustomFontName('')
          setCustomFontFallback('sans-serif')
          setAvailableFonts([])
          setSelectedFontIndex(0)
          setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
          setLoading(false)
          onClose()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to add font')
          setLoading(false)
        }
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load font')
      setLoading(false)
    }
  }

  const handleClose = () => {
        setGoogleFontsUrl('')
        setCustomFontName('')
        setCustomFontFallback('sans-serif')
        const newDefault = currentSequence || availableSequences[availableSequences.length - 1] || availableSequences[0]
        setSelectedSequence(newDefault)
        setAvailableFonts([])
        setSelectedFontIndex(0)
        setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
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
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
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
              setActiveTab('custom')
              setError('')
              // Select all combinations by default when switching to custom tab
              setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 'var(--recursica-brand-dimensions-general-default)',
              borderBottom: `2px solid ${activeTab === 'custom' ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)` : 'transparent'}`,
              color: activeTab === 'custom' 
                ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`
                : `var(${layer2Base}-element-text-color)`,
              opacity: activeTab === 'custom' 
                ? `var(${layer2Base}-element-text-high-emphasis)`
                : `var(${layer2Base}-element-text-low-emphasis)`,
              cursor: 'pointer',
              fontSize: 'var(--recursica-brand-typography-body-font-size)',
              fontWeight: activeTab === 'custom' ? 'var(--recursica-brand-typography-body-font-weight)' : '400',
            }}
          >
            Custom Font
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
                <TextField
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
                      
                      // Select all combinations by default
                      setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
                    } else {
                      setAvailableFonts([])
                      setSelectedFontIndex(0)
                      setSelectedCombos(new Set())
                    }
                  }}
                  state={error ? 'error' : 'default'}
                  errorText={error}
                  layer="layer-1"
                  style={{ width: '100%' }}
                />
                <div style={{
                  marginTop: 'var(--recursica-brand-dimensions-general-default)',
                  fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                  color: `var(${layer2Base}-element-text-color)`,
                  opacity: `var(${layer2Base}-element-text-low-emphasis)`,
                }}>
                  Paste a Google Fonts URL. The font family name will be extracted automatically.
                </div>
                <div style={{ marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer2Base}-element-text-color)`,
                    opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                  }}>
                    Sequence Position
                  </label>
                  <select
                    value={selectedSequence}
                    onChange={(e) => {
                      setSelectedSequence(e.target.value)
                      setError('')
                    }}
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
                    {availableSequences.map(seq => (
                      <option key={seq} value={seq}>
                        {seq.charAt(0).toUpperCase() + seq.slice(1)}
                      </option>
                    ))}
                  </select>
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
                      onChange={(e) => {
                        const idx = Number(e.target.value)
                        setSelectedFontIndex(idx)
                      // Reset selection when font changes
                      setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
                      }}
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
                
                {/* Weight+Style Combination Selection - Table Layout */}
                {availableFonts.length > 0 && (
                  <div style={{ marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)', marginBottom: 'var(--recursica-brand-dimensions-general-md)' }}>
                      <span style={{
                        fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        color: `var(${layer2Base}-element-text-color)`,
                        opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                      }}>
                        Select weight+style combinations:
                      </span>
                      <Checkbox
                        checked={allCheckboxState.checked}
                        indeterminate={allCheckboxState.indeterminate}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
                          } else {
                            setSelectedCombos(new Set())
                          }
                        }}
                        label="All"
                      />
                    </div>
                    
                    {/* Table with weights as rows and styles as columns */}
                    <div style={{
                      overflowX: 'auto',
                      border: `1px solid var(${layer1Base}-border-color)`,
                      borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                        tableLayout: 'fixed',
                      }}>
                        <thead>
                          <tr>
                            <th style={{
                              padding: 'var(--recursica-brand-dimensions-general-default)',
                              textAlign: 'left',
                              borderBottom: `1px solid var(${layer1Base}-border-color)`,
                              color: `var(${layer2Base}-element-text-color)`,
                              opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                            }}>
                              Weight
                            </th>
                            {styles.map(style => (
                              <th key={style} style={{
                                padding: 'var(--recursica-brand-dimensions-general-default)',
                                textAlign: 'center',
                                borderBottom: `1px solid var(${layer1Base}-border-color)`,
                                color: `var(${layer2Base}-element-text-color)`,
                                opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                                fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                                textTransform: 'capitalize',
                                width: '50%',
                              }}>
                                {style}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weights.map(weight => (
                            <tr key={weight} style={{
                              borderBottom: `1px solid var(${layer1Base}-border-color)`,
                            }}>
                              <td style={{
                                padding: 'var(--recursica-brand-dimensions-general-default)',
                                color: `var(${layer2Base}-element-text-color)`,
                                opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                                fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                              }}>
                                {weight}
                              </td>
                              {styles.map(style => {
                                const comboId = `${weight}-${style}`
                                const isSelected = selectedCombos.has(comboId)
                                return (
                                  <td key={style} style={{
                                    padding: 'var(--recursica-brand-dimensions-general-default)',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}>
                                    <div style={{
                                      display: 'inline-flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}>
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(checked) => {
                                          const newCombos = new Set(selectedCombos)
                                          if (checked) {
                                            newCombos.add(comboId)
                                          } else {
                                            newCombos.delete(comboId)
                                          }
                                          setSelectedCombos(newCombos)
                                        }}
                                      />
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
              <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-md)' }}>
                {/* Sequence selector */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer2Base}-element-text-color)`,
                    opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                  }}>
                    Sequence
                  </label>
                  <select
                    value={selectedSequence}
                    onChange={(e) => {
                      setSelectedSequence(e.target.value)
                      setError('')
                    }}
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
                    {availableSequences.map(seq => (
                      <option key={seq} value={seq}>
                        {seq.charAt(0).toUpperCase() + seq.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer2Base}-element-text-color)`,
                    opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                  }}>
                    Font Family Name
                  </label>
                  <TextField
                    placeholder="My Custom Font"
                    value={customFontName}
                    onChange={(e) => {
                      setCustomFontName(e.target.value)
                      setError('')
                    }}
                    state={error ? 'error' : 'default'}
                    errorText={error}
                    layer="layer-1"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--recursica-brand-dimensions-general-default)',
                    fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    color: `var(${layer2Base}-element-text-color)`,
                    opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                  }}>
                    Font Fallback
                  </label>
                  <select
                    value={customFontFallback}
                    onChange={(e) => {
                      setCustomFontFallback(e.target.value as 'serif' | 'sans-serif')
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
                      cursor: 'pointer',
                    }}
                  >
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>

                <div style={{ marginTop: 'var(--recursica-brand-dimensions-general-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)', marginBottom: 'var(--recursica-brand-dimensions-general-md)' }}>
                    <span style={{
                      fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                      color: `var(${layer2Base}-element-text-color)`,
                      opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                    }}>
                      Select weight+style combinations:
                    </span>
                    <Checkbox
                      checked={allCheckboxState.checked}
                      indeterminate={allCheckboxState.indeterminate}
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
                        } else {
                          setSelectedCombos(new Set())
                        }
                      }}
                      label="All"
                    />
                  </div>

                  <div style={{
                    overflowX: 'auto',
                    border: `1px solid var(${layer1Base}-border-color)`,
                    borderRadius: 'var(--recursica-brand-dimensions-border-radii-default)',
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: 'var(--recursica-brand-dimensions-general-default)',
                            textAlign: 'left',
                            borderBottom: `1px solid var(${layer1Base}-border-color)`,
                            color: `var(${layer2Base}-element-text-color)`,
                            opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                            fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                          }}>
                            Weight
                          </th>
                          {styles.map(style => (
                            <th key={style} style={{
                              padding: 'var(--recursica-brand-dimensions-general-default)',
                              textAlign: 'center',
                              borderBottom: `1px solid var(${layer1Base}-border-color)`,
                              color: `var(${layer2Base}-element-text-color)`,
                              opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                              textTransform: 'capitalize',
                              width: '50%',
                            }}>
                              {style}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weights.map(weight => (
                          <tr key={weight} style={{
                            borderBottom: `1px solid var(${layer1Base}-border-color)`,
                          }}>
                            <td style={{
                              padding: 'var(--recursica-brand-dimensions-general-default)',
                              color: `var(${layer2Base}-element-text-color)`,
                              opacity: `var(${layer2Base}-element-text-high-emphasis)`,
                              fontWeight: 'var(--recursica-brand-typography-body-font-weight)',
                            }}>
                              {weight}
                            </td>
                            {styles.map(style => {
                              const comboId = `${weight}-${style}`
                              const isSelected = selectedCombos.has(comboId)
                              return (
                                <td key={style} style={{
                                  padding: 'var(--recursica-brand-dimensions-general-default)',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                }}>
                                  <div style={{
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={(checked) => {
                                        const newCombos = new Set(selectedCombos)
                                        if (checked) {
                                          newCombos.add(comboId)
                                        } else {
                                          newCombos.delete(comboId)
                                        }
                                        setSelectedCombos(newCombos)
                                      }}
                                    />
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            size="default"
            onClick={handleAccept}
            disabled={loading || (activeTab === 'google' && (!googleFontsUrl.trim() || selectedCombos.size === 0)) || (activeTab === 'custom' && (!customFontName.trim() || selectedCombos.size === 0))}
          >
            {loading ? 'Loading...' : 'Add Font'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
