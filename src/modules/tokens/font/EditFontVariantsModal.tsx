import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { Button } from '../../../components/adapters/Button'
import { Checkbox } from '../../../components/adapters/Checkbox'
import { iconNameToReactComponent } from '../../components/iconUtils'

export type EditFontVariantsModalProps = {
  open: boolean
  onClose: () => void
  onAccept: (url: string, variants: Array<{ weight: string; style: string }>) => void
  fontName: string
  currentUrl?: string
  currentVariants?: Array<{ weight: string; style: string }>
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
  } catch {}
  
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

  // Set selected combinations from current variants when modal opens
  // Also set sequence from currentSequence
  useEffect(() => {
    if (open) {
      if (currentSequence) {
        setSelectedSequence(currentSequence)
      }
      
      if (currentUrl && currentUrl.includes('fonts.googleapis.com')) {
        // If we have current variants, use those to set selected combinations
        if (currentVariants && currentVariants.length > 0) {
        // Map variant weights/styles to numeric weights and style strings
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
        
        currentVariants.forEach(variant => {
          const weightKey = variant.weight.replace(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i, '$1')
          const styleKey = variant.style.replace(/\{tokens?\.font\.styles?\.([a-z0-9\-_]+)\}/i, '$1')
          
          const weightNum = weightMap[weightKey] || 400
          const comboId = `${weightNum}-${styleKey}`
          selectedComboIds.add(comboId)
        })
        
        setSelectedCombos(selectedComboIds)
      } else {
        // No variants specified - select all combinations
        setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
      }
      } else if (currentVariants && currentVariants.length > 0) {
        // Font without Google Fonts URL but has variants (custom font)
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
        
        currentVariants.forEach(variant => {
          const weightKey = variant.weight.replace(/\{tokens?\.font\.weights?\.([a-z0-9\-_]+)\}/i, '$1')
          const styleKey = variant.style.replace(/\{tokens?\.font\.styles?\.([a-z0-9\-_]+)\}/i, '$1')
          
          const weightNum = weightMap[weightKey] || 400
          const comboId = `${weightNum}-${styleKey}`
          selectedComboIds.add(comboId)
        })
        
        setSelectedCombos(selectedComboIds)
      } else {
        // No variants specified - select all combinations
        setSelectedCombos(new Set(allWeightStyleCombos.map(c => c.id)))
      }
    }
  }, [open, currentUrl, currentVariants, currentSequence, allWeightStyleCombos])

  const handleAccept = () => {
    if (!currentUrl || !currentUrl.includes('fonts.googleapis.com')) {
      setError('No Google Fonts URL found for this font')
      return
    }

    if (selectedCombos.size === 0) {
      setError('Please select at least one weight+style combination')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Extract selected combinations
      const selectedComboArray = Array.from(selectedCombos)
        .map(id => allWeightStyleCombos.find(c => c.id === id))
        .filter((c): c is { weight: number; style: string; id: string } => c !== undefined)
      
      // Extract unique weights and styles from selected combinations
      const weightsArray = [...new Set(selectedComboArray.map(c => c.weight))].sort((a, b) => a - b)
      const stylesArray = [...new Set(selectedComboArray.map(c => c.style))]
      
      // Build URL with selected weights/styles
      const finalUrl = buildFontUrl(currentUrl, fontName, weightsArray, stylesArray)

      // Call onAccept with URL (if available), variants, and sequence
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
          overflow: 'auto',
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
            Edit weights and styles: {fontName}
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

        {(
          <>
            <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-general-md)' }}>
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
                disabled={loading || selectedCombos.size === 0}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
