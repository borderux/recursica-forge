import { useState, useEffect, useMemo } from 'react'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useVars } from '../../vars/VarsContext'
import { getVarsStore } from '../../../core/store/varsStore'
import { Button } from '../../../components/adapters/Button'
import { Checkbox } from '../../../components/adapters/Checkbox'
import { Dropdown } from '../../../components/adapters/Dropdown'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { Modal } from '../../../components/adapters/Modal'

export type EditFontVariantsModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (url: string, variants: Array<{ weight: string; style: string }>, sequence: string) => void
  fontName: string
  currentUrl?: string
  currentVariants?: Array<{ weight: string; style: string }>
  currentSequence?: string
  availableSequences?: string[]
}

// Parse weights and styles from a Google Fonts URL
const parseWeightsAndStylesFromUrl = (url: string): { weights: number[]; styles: string[] } => {
  const weights: number[] = []
  const styles: string[] = []

  try {
    const urlObj = new URL(url)
    const familyParams = urlObj.searchParams.getAll('family')

    if (familyParams.length > 0) {
      const param = familyParams[0]

      // Parse weights: wght@100..900 or wght@100;200;300
      const wghtMatch = param.match(/wght@([^:&]+)/)
      if (wghtMatch) {
        const wghtValue = wghtMatch[1]
        // Check if it's a range like 100..900
        const rangeMatch = wghtValue.match(/^(\d+)\.\.(\d+)$/)
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10)
          const end = parseInt(rangeMatch[2], 10)
          // Add common weights in range (100, 200, 300, 400, 500, 600, 700, 800, 900)
          for (let w = start; w <= end; w += 100) {
            if (w >= 100 && w <= 900) weights.push(w)
          }
        } else {
          // Parse individual weights like 100;200;300 or 400
          const weightList = wghtValue.split(';')
          weightList.forEach(w => {
            const weight = parseInt(w.trim(), 10)
            if (!isNaN(weight) && weight >= 100 && weight <= 900) {
              weights.push(weight)
            }
          })
        }
      }

      // Parse styles: ital@0;1 or ital@1
      const italMatch = param.match(/ital@([^:&]+)/)
      if (italMatch) {
        const italValue = italMatch[1]
        if (italValue.includes('0') || italValue.includes('1')) {
          styles.push('normal')
          if (italValue.includes('1')) {
            styles.push('italic')
          }
        }
      }
    }
  } catch { }

  // If no weights found, assume regular (400)
  if (weights.length === 0) {
    weights.push(400)
  }

  // If no styles found, assume normal
  if (styles.length === 0) {
    styles.push('normal')
  }

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

export function EditFontVariantsModal({
  open,
  onClose,
  onAccept,
  fontName,
  currentUrl,
  currentVariants,
  currentSequence,
  availableSequences = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'],
}: EditFontVariantsModalProps) {
  const { mode } = useThemeMode()
  const { tokens: tokensJson } = useVars()
  const [selectedSequence, setSelectedSequence] = useState<string>(currentSequence || availableSequences[0])

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

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

  // Helper function to get variants for the current font by font name (not sequence)
  const getVariantsForFont = (): Array<{ weight: string; style: string }> | null => {
    if (!fontName) return null

    try {
      const cleanFontName = fontName.trim().replace(/^["']|["']$/g, '').toLowerCase()

      // Try store state first (most up-to-date)
      const store = getVarsStore()
      const state = store.getState()
      const storeTokens = state.tokens as any
      const storeFontRoot = storeTokens?.tokens?.font || storeTokens?.font || {}

      // Check new fontVariants structure
      const fontVariants = storeFontRoot.fontVariants || {}
      const variants = fontVariants[cleanFontName]

      if (variants && Array.isArray(variants) && variants.length > 0) {
        return variants
      }

      return null
    } catch {
      return null
    }
  }

  // Helper function to get variants for a given sequence (for when sequence changes)
  // Since variants are now stored by font name, this just gets the font at the sequence and looks up its variants
  const getVariantsForSequence = (sequence: string): Array<{ weight: string; style: string }> | null => {
    try {
      // Try store state first (most up-to-date)
      const store = getVarsStore()
      const state = store.getState()
      const storeTokens = state.tokens as any
      const storeFontRoot = storeTokens?.tokens?.font || storeTokens?.font || {}
      const storeTypefaces = storeFontRoot.typefaces || storeFontRoot.typeface || {}

      // Also check tokensJson as fallback
      const jsonFontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const jsonTypefaces: any = jsonFontRoot?.typefaces || jsonFontRoot?.typeface || {}

      // Combine both sources (store takes precedence)
      const allTypefaces = { ...jsonTypefaces, ...storeTypefaces }
      const typefaceDef = allTypefaces[sequence]

      if (!typefaceDef) return null

      // Get the font value
      let fontValue = ''
      const rawValue = typefaceDef?.$value
      if (Array.isArray(rawValue) && rawValue.length > 0) {
        fontValue = typeof rawValue[0] === 'string' ? rawValue[0].trim().replace(/^["']|["']$/g, '') : ''
      } else if (typeof rawValue === 'string') {
        fontValue = rawValue.trim().replace(/^["']|["']$/g, '')
      }

      // Look up variants by font name (not sequence)
      if (fontValue && fontName && fontValue.toLowerCase() === fontName.toLowerCase()) {
        const cleanFontName = fontValue.toLowerCase()
        const fontVariants = storeFontRoot.fontVariants || {}
        const variants = fontVariants[cleanFontName]
        return variants && Array.isArray(variants) && variants.length > 0 ? variants : null
      }

      return null
    } catch {
      return null
    }
  }

  // Helper function to convert variants to selected combos
  const variantsToSelectedCombos = (variants: Array<{ weight: string; style: string }> | null | undefined): Set<string> => {
    // If variants is null, undefined, or empty, we need to decide what to show
    // null = explicitly no variants set (should show all)
    // undefined = not found (might be loading, should show all as fallback)
    // empty array = no variants (should show all)
    // But we want to avoid showing all if variants should exist but weren't found
    // So we'll return empty set and let the user select, OR we could show all
    // For now, if variants exist, use them; otherwise show all (original behavior)
    if (!variants || variants.length === 0) {
      // No variants specified - select all combinations (original behavior)
      return new Set(allWeightStyleCombos.map(c => c.id))
    }

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

    const selectedComboIds = new Set<string>()

    variants.forEach(variant => {
      const weightKey = variant.weight.replace(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i, '$1')
      const styleKey = variant.style.replace(/\{tokens?\.font\.styles?\.([a-z0-9\-_]+)\}/i, '$1')

      const weightNum = weightMap[weightKey] || 400
      const comboId = `${weightNum}-${styleKey}`
      selectedComboIds.add(comboId)
    })

    return selectedComboIds
  }

  // Set selected combinations from current variants when modal opens
  // Also set sequence from currentSequence
  useEffect(() => {
    if (open) {
      if (currentSequence) {
        setSelectedSequence(currentSequence)
      }

      // Always look up variants by font value first (works even after resequencing)
      // This is the most reliable method since it finds the font regardless of sequence
      let variants = getVariantsForFont()

      // If font lookup returned null (explicitly no variants), use that
      // If font lookup returned undefined (not found), try other methods
      if (variants === undefined) {
        // Try currentVariants if available
        if (currentVariants && currentVariants.length > 0) {
          variants = currentVariants
        } else if (currentSequence) {
          // Try looking up by current sequence
          variants = getVariantsForSequence(currentSequence)
        }
      }

      // Convert variants to selected combos
      // If variants is null (explicitly no variants), show empty set
      // If variants is undefined (not found), also show empty set to avoid showing all
      // If variants exists, show only those
      setSelectedCombos(variantsToSelectedCombos(variants))
    }
  }, [open, currentUrl, currentVariants, currentSequence, allWeightStyleCombos, availableSequences, tokensJson, fontName])

  // Update selected combinations when sequence changes
  // Since variants are stored by font name, changing sequence doesn't change variants
  // But we should still show the variants for the current font
  useEffect(() => {
    if (open && selectedSequence) {
      // Variants are stored by font name, so always get them by font name
      // The sequence dropdown is just for changing which sequence the font is assigned to
      const variants = getVariantsForFont()
      setSelectedCombos(variantsToSelectedCombos(variants))
    }
  }, [selectedSequence, open, allWeightStyleCombos, tokensJson, fontName])

  const handleAccept = () => {
    // Only require Google Fonts URL if we're actually editing variants for a Google Font
    // Allow sequence changes without requiring a URL
    const isGoogleFont = currentUrl && currentUrl.includes('fonts.googleapis.com')

    // Only require variants selection if we're editing a Google Font
    // For custom fonts or sequence-only changes, allow saving without variants
    if (isGoogleFont && selectedCombos.size === 0) {
      setError('Please select at least one weight+style combination')
      return
    }

    setLoading(true)
    setError('')

    try {
      let finalUrl: string | undefined = undefined
      let variants: Array<{ weight: string; style: string }> = []

      // Only build URL and variants if we have a Google Fonts URL
      if (isGoogleFont) {
        // Extract selected combinations
        const selectedComboArray = Array.from(selectedCombos)
          .map(id => allWeightStyleCombos.find(c => c.id === id))
          .filter((c): c is { weight: number; style: string; id: string } => c !== undefined)

        // Extract unique weights and styles from selected combinations
        const weightsArray = [...new Set(selectedComboArray.map(c => c.weight))].sort((a, b) => a - b)
        const stylesArray = [...new Set(selectedComboArray.map(c => c.style))]

        // Build URL with selected weights/styles
        finalUrl = buildFontUrl(currentUrl, fontName, weightsArray, stylesArray)

        // Build variants array for token extensions from selected combinations
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
      } else {
        // For non-Google fonts, preserve existing variants if any were selected
        if (selectedCombos.size > 0) {
          const selectedComboArray = Array.from(selectedCombos)
            .map(id => allWeightStyleCombos.find(c => c.id === id))
            .filter((c): c is { weight: number; style: string; id: string } => c !== undefined)

          selectedComboArray.forEach(combo => {
            let weightKey = 'regular'
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
        }
      }

      // Call onAccept with URL (if available), variants, and sequence
      // Allow sequence changes even without URL or variants
      onAccept(finalUrl || '', variants, selectedSequence)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update font variants')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setSelectedCombos(new Set())
    setSelectedSequence(currentSequence || availableSequences[0])
    onClose()
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Edit ${fontName}`}
      size={600}
      layer="layer-2"
      primaryActionLabel={loading ? 'Saving...' : 'Save'}
      onPrimaryAction={handleAccept}
      secondaryActionLabel="Cancel"
      onSecondaryAction={handleClose}
      showFooter={true}
      scrollable={true}
      primaryActionDisabled={Boolean(loading || (currentUrl && currentUrl.includes('fonts.googleapis.com') && selectedCombos.size === 0))}
      secondaryActionDisabled={loading}
    >
      <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-md)' }}>
        {/* Sequence selector */}
        <Dropdown
          items={availableSequences.map(seq => ({
            value: seq,
            label: seq.charAt(0).toUpperCase() + seq.slice(1)
          }))}
          value={selectedSequence}
          onChange={(value) => {
            setSelectedSequence(value)
            setError('')
          }}
          label="Sequence"
          layer="layer-3"
          layout="stacked"
          disableTopBottomMargin={false}
          zIndex={20001}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)' }}>
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
    </Modal>
  )
}
