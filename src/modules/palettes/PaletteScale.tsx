import { PaletteEmphasisCell, PalettePrimaryIndicatorCell } from './PaletteGridCell'
import type { JsonLike } from '../../core/resolvers/tokens'
import { readCssVar } from '../../core/css/readCssVar'
import { contrastRatio, hexToRgb } from '../theme/contrastUtil'
import { resolveCssVarToHex } from '../../core/compliance/layerColorStepping'
import { buildTokenIndex } from '../../core/resolvers/tokens'
import { readCssVarNumber, readCssVarResolved } from '../../core/css/readCssVar'
import { useState, useRef, useEffect } from 'react'
import { ColorPickerOverlay } from '../pickers/ColorPickerOverlay'
import { useVars } from '../vars/VarsContext'
import { readOverrides } from '../theme/tokenOverrides'

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
function extractTokenNameFromCssVar(cssVarValue: string | undefined): string | null {
  if (!cssVarValue) return null
  const match = cssVarValue.match(/--recursica-tokens-color-([a-z0-9-]+)-(\d+|050|000)/)
  if (match) {
    const [, family, level] = match
    return `color/${family}/${level}`
  }
  return null
}

export type PaletteScaleProps = {
  level: string
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  isHovered: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSetPrimary: () => void
  paletteKey?: string
  tokens?: JsonLike
}

export function PaletteScaleHeader({
  level,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  tokens,
}: Pick<PaletteScaleProps, 'level' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'tokens'>) {
  const headerWidth = isPrimary ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%'
  const [openPicker, setOpenPicker] = useState<{ tokenName: string; swatchRect: DOMRect } | null>(null)
  const [familyNames, setFamilyNames] = useState<Record<string, string>>({})
  const headerRef = useRef<HTMLTableCellElement>(null)
  const { updateToken } = useVars()
  
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
  
  // Check AA compliance for this level - check both high and low emphasis
  let isNonCompliant = false
  if (tokens && paletteKey) {
    // Detect mode by checking which CSS variable exists
    const lightToneCssVar = `--recursica-brand-light-palettes-${paletteKey}-${level}-tone`
    const darkToneCssVar = `--recursica-brand-dark-palettes-${paletteKey}-${level}-tone`
    const lightToneValue = readCssVar(lightToneCssVar)
    const darkToneValue = readCssVar(darkToneCssVar)
    const mode = lightToneValue ? 'light' : (darkToneValue ? 'dark' : 'light')
    
    const toneCssVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-tone`
    const onToneCssVar = `--recursica-brand-${mode}-palettes-${paletteKey}-${level}-on-tone`
    const highEmphasisCssVar = `--recursica-brand-${mode}-text-emphasis-high`
    const lowEmphasisCssVar = `--recursica-brand-${mode}-text-emphasis-low`
    
    const toneValue = readCssVar(toneCssVar)
    const onToneValue = readCssVar(onToneCssVar)
    
    if (toneValue && onToneValue) {
      const tokenIndex = buildTokenIndex(tokens)
      const toneHex = resolveCssVarToHex(toneValue, tokenIndex)
      const onToneHex = resolveCssVarToHex(onToneValue, tokenIndex)
      
      if (toneHex && onToneHex) {
        // Get high emphasis opacity value
        const highEmphasisResolved = readCssVarResolved(highEmphasisCssVar) || readCssVar(highEmphasisCssVar)
        let highOpacityRaw: number = 1
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
        const highOpacity = (highOpacityRaw && !isNaN(highOpacityRaw) && highOpacityRaw > 0) 
          ? (highOpacityRaw <= 1 ? highOpacityRaw : highOpacityRaw / 100)
          : 1
        
        // Get low emphasis opacity value
        const lowEmphasisResolved = readCssVarResolved(lowEmphasisCssVar) || readCssVar(lowEmphasisCssVar)
        let lowOpacityRaw: number = 1
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
        const lowOpacity = (lowOpacityRaw && !isNaN(lowOpacityRaw) && lowOpacityRaw > 0) 
          ? (lowOpacityRaw <= 1 ? lowOpacityRaw : lowOpacityRaw / 100)
          : 1
        
        // Check if black and white pass AA for BOTH high and low emphasis
        const black = '#000000'
        const white = '#ffffff'
        
        // Check high emphasis
        const blackHighBlended = blendHexOver(black, toneHex, highOpacity)
        const whiteHighBlended = blendHexOver(white, toneHex, highOpacity)
        const blackHighContrast = contrastRatio(toneHex, blackHighBlended)
        const whiteHighContrast = contrastRatio(toneHex, whiteHighBlended)
        const blackHighPasses = blackHighContrast >= 4.5
        const whiteHighPasses = whiteHighContrast >= 4.5
        
        // Check low emphasis
        const blackLowBlended = blendHexOver(black, toneHex, lowOpacity)
        const whiteLowBlended = blendHexOver(white, toneHex, lowOpacity)
        const blackLowContrast = contrastRatio(toneHex, blackLowBlended)
        const whiteLowContrast = contrastRatio(toneHex, whiteLowBlended)
        const blackLowPasses = blackLowContrast >= 4.5
        const whiteLowPasses = whiteLowContrast >= 4.5
        
        // Tone fails AA if both black and white fail for EITHER emphasis level
        isNonCompliant = (!blackHighPasses && !whiteHighPasses) || (!blackLowPasses && !whiteLowPasses)
      }
    }
  }

  return (
    <>
      <th
        ref={headerRef}
        className={isPrimary ? 'default' : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          if (isNonCompliant) {
            e.preventDefault()
            e.stopPropagation()
            // Extract token name from the tone CSS variable
            const toneCssVar = `--recursica-brand-light-palettes-${paletteKey}-${level}-tone`
            const toneValue = readCssVar(toneCssVar)
            const tokenName = extractTokenNameFromCssVar(toneValue)
            
            if (tokenName && tokens && headerRef.current) {
              // Open ColorPickerOverlay
              const rect = headerRef.current.getBoundingClientRect()
              setOpenPicker({ tokenName, swatchRect: rect })
            }
            return
          }
          onSetPrimary()
        }}
        title={isNonCompliant ? 'AA Compliance Issue - Click to fix tone color' : (isPrimary ? 'Primary' : 'Set as Primary')}
        style={{ cursor: 'pointer', width: headerWidth }}
      >
        {level}
      </th>
      
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
              updateToken(tokenName, hex)
              
              if (cascadeDown || cascadeUp) {
                import('../tokens/colors/colorCascade').then(({ cascadeColor }) => {
                  cascadeColor(tokenName, hex, cascadeDown, cascadeUp, (name: string, h: string) => {
                    updateToken(name, h)
                  })
                }).catch((err) => {
                  console.warn('Failed to cascade color:', err)
                })
              }
              
              try {
                window.dispatchEvent(new CustomEvent('paletteVarsChanged'))
              } catch {}
            }}
          />
        )
      })()}
    </>
  )
}

export function PaletteScaleHighEmphasis({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  level,
  tokens,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'level' | 'tokens'>) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      paletteKey={paletteKey}
      level={level}
      tokens={tokens}
    />
  )
}

export function PaletteScaleLowEmphasis({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  paletteKey,
  level,
  tokens,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'paletteKey' | 'level' | 'tokens'>) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      paletteKey={paletteKey}
      level={level}
      tokens={tokens}
    />
  )
}

export function PaletteScalePrimaryIndicator({
  isPrimary,
  isHovered,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'isPrimary' | 'isHovered' | 'onSetPrimary'>) {
  return (
    <PalettePrimaryIndicatorCell
      isPrimary={isPrimary}
      isHovered={isHovered}
      onSetPrimary={onSetPrimary}
    />
  )
}

