import { useState, useMemo, useEffect, useRef } from 'react'
import { readCssVar, readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import type { JsonLike } from '../../core/resolvers/tokens'
import { ColorPickerOverlay } from '../pickers/ColorPickerOverlay'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'
import { useThemeMode } from '../theme/ThemeModeContext'

// Helper to blend foreground over background with opacity
function blendHexOver(fgHex: string, bgHex: string, opacity: number): string {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return fgHex
  const a = Math.max(0, Math.min(1, opacity))
  const r = Math.round(a * fg.r + (1 - a) * bg.r)
  const g = Math.round(a * fg.g + (1 - a) * bg.g)
  const b = Math.round(a * fg.b + (1 - a) * bg.b)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

// Helper to extract token name from CSS variable value
// e.g., "var(--recursica-tokens-color-gray-100)" -> "color/gray/100"
function extractTokenNameFromCssVar(cssVarValue: string | undefined): string | null {
  if (!cssVarValue) return null
  const match = cssVarValue.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
  if (match) {
    const [, family, level] = match
    return `color/${family}/${level}`
  }
  return null
}

export type PaletteEmphasisCellProps = {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  paletteKey?: string
  level?: string
  tokens?: JsonLike
}

export function PaletteEmphasisCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onClick,
  paletteKey,
  level,
  tokens,
}: PaletteEmphasisCellProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; swatchRect: DOMRect } | null>(null)

  // Close picker when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setOpenPicker(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const cellRef = useRef<HTMLTableCellElement>(null)
  const { updateToken, theme, setTheme } = useVars()
  const { mode } = useThemeMode()
  const AA = 4.5

  // Load family names from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('family-friendly-names')
      if (raw) setFamilyNames(JSON.parse(raw))
    } catch {}
    const onNames = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        if (detail && typeof detail === 'object') {
          setFamilyNames(detail)
          return
        }
        const raw = localStorage.getItem('family-friendly-names')
        setFamilyNames(raw ? JSON.parse(raw) : {})
      } catch {
        setFamilyNames({})
      }
    }
    window.addEventListener('familyNamesChanged', onNames as any)
    return () => window.removeEventListener('familyNamesChanged', onNames as any)
  }, [])

  // Listen for palette variable changes to force re-render
  useEffect(() => {
    const handler = () => {
      setUpdateTrigger((prev) => prev + 1)
    }
    window.addEventListener('paletteVarsChanged', handler as any)
    window.addEventListener('recheckAllPaletteOnTones', handler as any)
    return () => {
      window.removeEventListener('paletteVarsChanged', handler as any)
      window.removeEventListener('recheckAllPaletteOnTones', handler as any)
    }
  }, [])

  // Check AA compliance with opacity consideration
  // Check both high and low emphasis to determine if tone fails AA for either
  const aaStatus = useMemo(() => {
    if (!tokens || !paletteKey || !level) return null
    
    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)
    const emphasisValue = readCssVar(emphasisCssVar)
    
    if (!toneValue || !onToneValue) return null
    
    const tokenIndex = buildTokenIndex(tokens)
    const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
    const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)
    
    if (!toneHex || !onToneHex) return null
    
    // Get current emphasis opacity value (normalize to 0-1 range)
    const emphasisResolved = readCssVarResolved(emphasisCssVar) || readCssVar(emphasisCssVar)
    let opacityRaw: number = 1
    
    if (emphasisResolved) {
      const tokenMatch = emphasisResolved.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
      if (tokenMatch) {
        const [, tokenName] = tokenMatch
        const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
        if (typeof tokenValue === 'number') {
          opacityRaw = tokenValue
        } else {
          opacityRaw = readCssVarNumber(emphasisCssVar, 1)
        }
      } else {
        opacityRaw = parseFloat(emphasisResolved)
        if (isNaN(opacityRaw)) {
          opacityRaw = readCssVarNumber(emphasisCssVar, 1)
        }
      }
    } else {
      opacityRaw = readCssVarNumber(emphasisCssVar, 1)
    }
    
    const opacity = (opacityRaw && !isNaN(opacityRaw) && opacityRaw > 0) 
      ? (opacityRaw <= 1 ? opacityRaw : opacityRaw / 100)
      : 1
    
    // Also get high and low emphasis opacities to check both
    const highEmphasisCssVar = `--recursica-brand-themes-${mode}-text-emphasis-high`
    const lowEmphasisCssVar = `--recursica-brand-themes-${mode}-text-emphasis-low`
    
    const highEmphasisResolved = readCssVarResolved(highEmphasisCssVar) || readCssVar(highEmphasisCssVar)
    const lowEmphasisResolved = readCssVarResolved(lowEmphasisCssVar) || readCssVar(lowEmphasisCssVar)
    
    let highOpacityRaw: number = 1
    let lowOpacityRaw: number = 1
    
    // Parse high emphasis opacity
    if (highEmphasisResolved) {
      const tokenMatch = highEmphasisResolved.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
      if (tokenMatch) {
        const [, tokenName] = tokenMatch
        const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
        if (typeof tokenValue === 'number') {
          highOpacityRaw = tokenValue
        } else {
          highOpacityRaw = readCssVarNumber(highEmphasisCssVar, 1)
        }
      } else {
        highOpacityRaw = parseFloat(highEmphasisResolved)
        if (isNaN(highOpacityRaw)) {
          highOpacityRaw = readCssVarNumber(highEmphasisCssVar, 1)
        }
      }
    } else {
      highOpacityRaw = readCssVarNumber(highEmphasisCssVar, 1)
    }
    
    // Parse low emphasis opacity
    if (lowEmphasisResolved) {
      const tokenMatch = lowEmphasisResolved.match(/--recursica-tokens-opacity-([a-z0-9-]+)/)
      if (tokenMatch) {
        const [, tokenName] = tokenMatch
        const tokenValue = tokenIndex.get(`opacity/${tokenName}`)
        if (typeof tokenValue === 'number') {
          lowOpacityRaw = tokenValue
        } else {
          lowOpacityRaw = readCssVarNumber(lowEmphasisCssVar, 1)
        }
      } else {
        lowOpacityRaw = parseFloat(lowEmphasisResolved)
        if (isNaN(lowOpacityRaw)) {
          lowOpacityRaw = readCssVarNumber(lowEmphasisCssVar, 1)
        }
      }
    } else {
      lowOpacityRaw = readCssVarNumber(lowEmphasisCssVar, 1)
    }
    
    const highOpacity = (highOpacityRaw && !isNaN(highOpacityRaw) && highOpacityRaw > 0) 
      ? (highOpacityRaw <= 1 ? highOpacityRaw : highOpacityRaw / 100)
      : 1
    const lowOpacity = (lowOpacityRaw && !isNaN(lowOpacityRaw) && lowOpacityRaw > 0) 
      ? (lowOpacityRaw <= 1 ? lowOpacityRaw : lowOpacityRaw / 100)
      : 1
    
    // Blend on-tone with tone using current emphasis opacity
    const blendedOnTone = blendHexOver(onToneHex, toneHex, opacity)
    const currentRatio = contrastRatio(toneHex, blendedOnTone)
    const passesAA = currentRatio >= AA
    
    // Read actual core black and white colors from CSS variables (not hardcoded)
    const coreBlackVar = `--recursica-brand-themes-${mode}-palettes-core-black`
    const coreWhiteVar = `--recursica-brand-themes-${mode}-palettes-core-white`
    const blackHex = readCssVarResolved(coreBlackVar) || '#000000'
    const whiteHex = readCssVarResolved(coreWhiteVar) || '#ffffff'
    const black = blackHex.startsWith('#') ? blackHex.toLowerCase() : `#${blackHex.toLowerCase()}`
    const white = whiteHex.startsWith('#') ? whiteHex.toLowerCase() : `#${whiteHex.toLowerCase()}`
    
    // Check high emphasis
    const blackHighBlended = blendHexOver(black, toneHex, highOpacity)
    const whiteHighBlended = blendHexOver(white, toneHex, highOpacity)
    const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
    const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
    const blackHighPasses = blackHighContrast >= AA
    const whiteHighPasses = whiteHighContrast >= AA
    
    // Check low emphasis
    const blackLowBlended = blendHexOver(black, toneHex, lowOpacity)
    const whiteLowBlended = blendHexOver(white, toneHex, lowOpacity)
    const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
    const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
    const blackLowPasses = blackLowContrast >= AA
    const whiteLowPasses = whiteLowContrast >= AA
    
    // Tone fails AA if both black and white fail for EITHER emphasis level
    const toneFailsAA = (!blackHighPasses && !whiteHighPasses) || (!blackLowPasses && !whiteLowPasses)
    
    // For current emphasis level
    const blackBlended = blendHexOver(black, toneHex, opacity)
    const whiteBlended = blendHexOver(white, toneHex, opacity)
    const blackContrast = contrastRatio(toneHex, blackBlended)
    const whiteContrast = contrastRatio(toneHex, whiteBlended)
    const blackPasses = blackContrast >= AA
    const whitePasses = whiteContrast >= AA
    
    return {
      passesAA,
      blackPasses,
      whitePasses,
      currentRatio,
      toneHex,
      onToneHex,
      opacity,
      toneFailsAA, // New: indicates if tone fails AA for either emphasis level
    }
  }, [toneCssVar, onToneCssVar, emphasisCssVar, tokens, paletteKey, level, updateTrigger, mode])

  // Show "x" only if:
  // 1. Current on-tone doesn't pass AA (with opacity considered)
  // 2. AND both black and white (with opacity) don't pass AA
  // This means auto-fix has been attempted (trying both black and white) and failed
  // Show dot if current on-tone passes AA OR if black or white would pass (auto-fix would work)
  // If aaStatus is null (can't check), default to showing dot
  const showAAWarning = aaStatus 
    ? (!aaStatus.passesAA && !aaStatus.blackPasses && !aaStatus.whitePasses)
    : false
  
  // If tone fails AA for either emphasis level, both cells should open color picker (not set primary)
  const shouldOpenColorPicker = aaStatus?.toneFailsAA ?? false
  

  return (
    <td
      className={`palette-box${isPrimary ? ' default' : ''}`}
      style={{ 
        backgroundColor: `var(${toneCssVar})`, 
        cursor: 'pointer', 
        width: isPrimary ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%',
        position: 'relative'
      }}
      title={shouldOpenColorPicker ? 'AA Compliance Issue - Click to fix tone color' : (isPrimary ? 'Primary' : 'Set as Primary')}
      onMouseEnter={(e) => {
        setIsHovered(true)
        if (!shouldOpenColorPicker) {
          onMouseEnter()
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false)
        if (!shouldOpenColorPicker) {
          onMouseLeave()
        }
      }}
      ref={cellRef}
      onClick={(e) => {
        if (shouldOpenColorPicker) {
          e.preventDefault()
          e.stopPropagation()
          // Extract token name from the tone CSS variable
          const toneValue = readCssVar(toneCssVar)
          const tokenName = extractTokenNameFromCssVar(toneValue)
          
          if (tokenName && tokens && cellRef.current) {
            // Get current hex value for the token
            const overrideMap = readOverrides()
            const jsonColors: any = (tokens as any)?.tokens?.color || {}
            const parts = tokenName.split('/')
            const family = parts[1]
            const level = parts[2]
            const overrideValue = (overrideMap as any)[tokenName]
            const tokenValue = overrideValue ?? jsonColors?.[family]?.[level]?.$value ?? jsonColors?.[family]?.[level]
            const currentHex = typeof tokenValue === 'string' && /^#?[0-9a-f]{6}$/i.test(tokenValue)
              ? (tokenValue.startsWith('#') ? tokenValue : `#${tokenValue}`).toLowerCase()
              : '#000000'
            
            // Open ColorPickerOverlay
            const rect = cellRef.current.getBoundingClientRect()
            setOpenPicker({ tokenName, swatchRect: rect })
          }
          return
        }
        // Only allow setting primary if tone passes AA
        onClick()
      }}
    >
      {shouldOpenColorPicker ? (
        <div 
          className="palette-x" 
          style={{ 
            color: `var(${onToneCssVar})`, 
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            opacity: `var(${emphasisCssVar})`
          }}
        >
          ✕
        </div>
      ) : (
        <div className="palette-dot" style={{ backgroundColor: `var(${onToneCssVar})`, opacity: `var(${emphasisCssVar})` }} />
      )}
      
      {shouldOpenColorPicker && isHovered && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            padding: '8px 12px',
            backgroundColor: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`,
            border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            AA Compliance Issue
          </div>
          <div style={{ marginBottom: '8px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)` }}>
            Tone doesn't pass contrast (≥4.5:1) for high or low emphasis
          </div>
          {aaStatus && (
            <div style={{ fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)`, opacity: 0.8 }}>
              Current: {aaStatus.currentRatio.toFixed(2)}:1
            </div>
          )}
          <div style={{ marginTop: '8px', fontSize: '11px', color: `var(--recursica-brand-themes-${mode}-layer-layer-0-element-text-color)`, opacity: 0.7, fontStyle: 'italic' }}>
            Click to change tone color
          </div>
        </div>
      )}
      
      {/* ColorPickerOverlay for updating token color */}
      {openPicker && openPicker.tokenName && tokens && (() => {
        const tokenName = openPicker.tokenName
        const parts = tokenName.split('/')
        const family = parts[1]
        const overrideMap = readOverrides()
        const jsonColors: any = (tokens as any)?.tokens?.color || {}
        const overrideValue = (overrideMap as any)[tokenName]
        const tokenValue = overrideValue ?? jsonColors?.[family]?.[parts[2]]?.$value ?? jsonColors?.[family]?.[parts[2]]
        const currentHex = typeof tokenValue === 'string' && /^#?[0-9a-f]{6}$/i.test(tokenValue)
          ? (tokenValue.startsWith('#') ? tokenValue : `#${tokenValue}`).toLowerCase()
          : '#000000'
        const displayFamilyName = familyNames[family] || family
        
        return (
          <ColorPickerOverlay
            tokenName={tokenName}
            currentHex={currentHex}
            swatchRect={openPicker.swatchRect}
            onClose={() => setOpenPicker(null)}
            onNameFromHex={async (fam: string, hex: string) => {
              // Optional: Update family name from hex
              try {
                const { getFriendlyNamePreferNtc } = await import('../utils/colorNaming')
                const label = await getFriendlyNamePreferNtc(hex)
                if (label) {
                  const raw = localStorage.getItem('family-friendly-names')
                  const map = raw ? JSON.parse(raw) || {} : {}
                  map[fam] = label
                  localStorage.setItem('family-friendly-names', JSON.stringify(map))
                  try { window.dispatchEvent(new CustomEvent('familyNamesChanged', { detail: map })) } catch {}
                }
              } catch {}
            }}
            displayFamilyName={displayFamilyName}
            onChange={(hex: string, cascadeDown: boolean, cascadeUp: boolean) => {
              // Update the token value
              updateToken(tokenName, hex)
              
              // Handle cascade if needed
              if (cascadeDown || cascadeUp) {
                // Import cascade function if needed
                import('../tokens/colors/colorCascade').then(({ cascadeColor }) => {
                  cascadeColor(tokenName, hex, cascadeDown, cascadeUp, (name: string, h: string) => {
                    updateToken(name, h)
                  })
                }).catch((err) => {
                  console.warn('Failed to cascade color:', err)
                })
              }
              
              // Update on-tone value in theme JSON for AA compliance
              if (paletteKey && level && theme && setTheme) {
                try {
                  const themeCopy = JSON.parse(JSON.stringify(theme))
                  const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                  const themes = root?.themes || root
                  const modeKey = mode.toLowerCase()
                  const modeLabel = mode === 'light' ? 'Light' : 'Dark'
                  
                  if (themes?.[modeKey]?.palettes?.[paletteKey]?.[level]) {
                    // Calculate the correct on-tone value using the same logic as updatePaletteOnTone
                    const black = '#000000'
                    const white = '#ffffff'
                    const cBlack = contrastRatio(hex, black)
                    const cWhite = contrastRatio(hex, white)
                    const AA = 4.5
                    
                    let chosen: 'black' | 'white'
                    if (cBlack >= AA && cWhite >= AA) {
                      chosen = cBlack >= cWhite ? 'black' : 'white'
                    } else if (cBlack >= AA) {
                      chosen = 'black'
                    } else if (cWhite >= AA) {
                      chosen = 'white'
                    } else {
                      chosen = cBlack >= cWhite ? 'black' : 'white'
                    }
                    
                    // Update the on-tone value in theme JSON
                    const refPrefix = themes !== root ? 'brand.themes' : 'brand'
                    if (!themes[modeKey].palettes[paletteKey][level]) {
                      themes[modeKey].palettes[paletteKey][level] = {}
                    }
                    themes[modeKey].palettes[paletteKey][level]['on-tone'] = {
                      $value: `{${refPrefix}.${modeKey}.palettes.core-colors.${chosen}}`
                    }
                    
                    setTheme(themeCopy)
                  }
                } catch (err) {
                  console.error('Failed to update on-tone in theme JSON:', err)
                }
              }
              
              // Trigger AA compliance re-check
              try {
                window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
              } catch {}
            }}
          />
        )
      })()}
    </td>
  )
}

export type PalettePrimaryIndicatorCellProps = {
  isPrimary: boolean
  isHovered: boolean
  onSetPrimary: () => void
}

export function PalettePrimaryIndicatorCell({
  isPrimary,
  isHovered,
  onSetPrimary,
}: PalettePrimaryIndicatorCellProps) {
  return (
    <td className={isPrimary ? 'default' : undefined} style={{ textAlign: 'center', verticalAlign: 'top', height: 28 }}>
      {isPrimary ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: '1px solid var(--layer-layer-1-property-border-color)',
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
          }}
        >primary</span>
      ) : isHovered ? (
        <button
          onClick={onSetPrimary}
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: '1px dashed var(--layer-layer-1-property-border-color)',
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
            cursor: 'pointer',
          }}
          title="Set as Primary"
        >Set as Primary</button>
      ) : null}
    </td>
  )
}


