import { useMemo, useState, useEffect, useRef } from 'react'
import { useVars } from '../vars/VarsContext'
import { updateCssVar, removeCssVar } from '../../core/css/updateCssVar'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { Dropdown } from '../../components/adapters/Dropdown'
import { Modal } from '../../components/adapters/Modal'
import { Label } from '../../components/adapters/Label'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { updateUIKitValue } from '../../core/css/updateUIKitValue'

export default function PaletteSwatchPicker({ onSelect }: { onSelect?: (cssVarName: string) => void }) {
  const { palettes, theme: themeJson, tokens: tokensJson, setTheme } = useVars()
  const { mode } = useThemeMode()
  const modeLower = mode.toLowerCase()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [targetCssVar, setTargetCssVar] = useState<string | null>(null)
  const [targetCssVars, setTargetCssVars] = useState<string[]>([])
  const [targetOpacityCssVar, setTargetOpacityCssVar] = useState<string | null>(null)
  const [showOpacityDropdown, setShowOpacityDropdown] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const firstHexMatchRef = useRef<string | null>(null)


  // Close picker when mode changes or event received
  useEffect(() => {
    const handleCloseAll = () => {
      setAnchor(null)
      setTargetCssVar(null)
      setTargetCssVars([])
      setTargetOpacityCssVar(null)
      setShowOpacityDropdown(false)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])

  // Listen for CSS variable updates to refresh selection state
  useEffect(() => {
    const handleCssVarsUpdated = () => {
      setRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('cssVarsUpdated', handleCssVarsUpdated)
    return () => window.removeEventListener('cssVarsUpdated', handleCssVarsUpdated)
  }, [])

  const paletteKeys = useMemo(() => {
    const dynamic = palettes?.dynamic?.map((p) => p.key) || []
    const staticPalettes: string[] = []
    try {
      const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
      const themes = root?.themes || root
      const modePal: any = themes?.[modeLower]?.palettes || themes?.[modeLower]?.palette || {}
      Object.keys(modePal).forEach((k) => {
        if (k !== 'core' && k !== 'core-colors' && !dynamic.includes(k)) {
          staticPalettes.push(k)
        }
      })
    } catch { }
    return Array.from(new Set([...dynamic, ...staticPalettes]))
  }, [palettes, themeJson])

  // Get opacity tokens and build dropdown options
  const opacityOptions = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ key: string; label: string }> = Object.keys(src)
      .filter((k) => !k.startsWith('$'))
      .map((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        const percentage = Math.round((num <= 1 ? num : num / 100) * 100)
        const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
        return {
          key: k,
          label: `${label} (${percentage}%)`,
          value: num,
        }
      })
      .filter((it) => Number.isFinite(it.value))
      .sort((a, b) => a.value - b.value)
      .map(({ key, label }) => ({ key, label }))
    return list
  }, [tokensJson])

  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      const rawValue = readCssVar(cssVar)
      if (!rawValue) return null
      let match = rawValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return match[1]
      const resolvedValue = readCssVarResolved(cssVar)
      if (resolvedValue) {
        // Fallback: match by value if direct reference not found
        const val = parseFloat(resolvedValue)
        const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
        for (const [k, v] of Object.entries(src)) {
          if (k.startsWith('$')) continue
          const vVal = (v as any).$value
          const vNum = typeof vVal === 'number' ? vVal : parseFloat(vVal)
          if (Math.abs(vNum - val) < 0.01 || Math.abs(vNum / 100 - val) < 0.01) {
            return k
          }
        }

        match = resolvedValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
        if (match) return match[1]
      }
    } catch { }
    return null
  }

  const [selectedOpacity, setSelectedOpacity] = useState('')

  const currentOpacityToken = useMemo(() => {
    if (!targetOpacityCssVar) return ''
    return extractTokenFromCssVar(targetOpacityCssVar) || ''
  }, [targetOpacityCssVar, refreshTrigger])

  useEffect(() => {
    setSelectedOpacity(currentOpacityToken)
  }, [currentOpacityToken])

  const buildPaletteCssVar = (paletteKey: string, level: string): string => {
    return `--recursica-brand-themes-${mode}-palettes-${paletteKey}-${level}-tone`
  }

  const targetResolvedValue = useMemo(() => {
    if (!targetCssVar) return null
    const resolved = readCssVarResolved(targetCssVar)
    const direct = readCssVar(targetCssVar)
    return { resolved, direct }
  }, [targetCssVar, refreshTrigger])

  const selectedPaletteSwatch = useMemo(() => {
    if (!targetResolvedValue || !targetCssVar) return null
    const directValue = readCssVar(targetCssVar)
    if (!directValue) return null
    const trimmed = directValue.trim()

    // Match palette pattern
    const paletteMatch = trimmed.match(/var\(--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-(\d+|primary|000|1000)-tone\)/)
    if (paletteMatch) return `${paletteMatch[1]}-${paletteMatch[2]}`

    // Match core color pattern
    const coreMatch = trimmed.match(/var\(--recursica-brand-themes-(?:light|dark)-palettes-core-([a-z0-9-]+(?:-tone|-default-tone|-hover-tone)?)\)/i)
    if (coreMatch) {
      let key = coreMatch[1].replace(/-tone$/, '').replace(/-default$/, '-default').replace(/-hover$/, '-hover')
      return `core-${key}`
    }

    return null
  }, [targetResolvedValue, targetCssVar])

  const isNoneSelected = useMemo(() => {
    if (!targetCssVar) return false
    const val = readCssVar(targetCssVar)
    return !val || val === 'transparent' || val === 'null' || val === ''
  }, [targetCssVar, refreshTrigger])

  const isSwatchSelected = (paletteCssVar: string): boolean => {
    if (!targetCssVar) return false

    // Exact match
    const currentVal = readCssVar(targetCssVar)
    if (currentVal?.trim() === `var(${paletteCssVar})`) return true

    // Tracking match
    if (selectedPaletteSwatch) {
      const paletteMatch = paletteCssVar.match(/--recursica-brand-themes-(?:light|dark)-palettes-([a-z0-9-]+)-([a-z0-9]+)-tone/)
      if (paletteMatch && selectedPaletteSwatch === `${paletteMatch[1]}-${paletteMatch[2]}`) return true
    }

    // Hex match fallback
    if (targetResolvedValue?.resolved && /^#[0-9a-f]{6}$/i.test(targetResolvedValue.resolved)) {
      const paletteHex = readCssVarResolved(paletteCssVar)
      if (paletteHex && paletteHex.toLowerCase() === targetResolvedValue.resolved.toLowerCase()) {
        if (firstHexMatchRef.current === null) {
          firstHexMatchRef.current = paletteCssVar
          return true
        }
        return firstHexMatchRef.current === paletteCssVar
      }
    }
    return false
  }

  useEffect(() => {
    (window as any).openPalettePicker = (el: HTMLElement, cssVar: string, cssVarsArray?: string[], opacityCssVar?: string) => {
      window.dispatchEvent(new CustomEvent('closeAllPickersAndPanels'))

      setAnchor(el)
      setTargetCssVar(cssVar || null)
      setTargetCssVars(cssVarsArray && cssVarsArray.length > 0 ? cssVarsArray : [])
      setTargetOpacityCssVar(opacityCssVar || null)
      setShowOpacityDropdown(!!opacityCssVar)

      if (opacityCssVar) {
        const tokenKey = extractTokenFromCssVar(opacityCssVar)
        if (tokenKey) {
          setSelectedOpacity(tokenKey)
        } else {
          setSelectedOpacity(opacityOptions[0]?.key || '')
        }
      }

      const rect = el.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      // Estimate width: label column (110) + 12 swatches (12 * 25) + padding/margins
      const estimatedWidth = 420

      let left = rect.left
      // If the picker would go off the right edge, align its right edge with the button's right edge
      if (left + estimatedWidth > viewportWidth - 20) {
        left = Math.max(16, rect.right - estimatedWidth)
      }

      setPos({ top: rect.bottom + 8, left })
    }
  }, [tokensJson, opacityOptions])

  if (!anchor) return null

  const labelCol = 110
  const swatch = 24
  const gap = 1
  const CheckIcon = iconNameToReactComponent('check')
  const isOverlay = targetCssVars.some(v => v.includes('state-overlay-color')) || (targetCssVar?.includes('state-overlay-color'))
  const pickerTitle = isOverlay ? 'Edit overlay' : 'Pick a color'

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        setAnchor(null)
      }}
      title={pickerTitle}
      size="auto"
      withOverlay={false}
      centered={false}
      position={{ x: pos.left, y: pos.top }}
      onPositionChange={(newPos) => setPos({ top: newPos.y, left: newPos.x })}
      draggable={true}
      showHeader={true}
      showFooter={false}
      padding={true}
      layer="layer-3"
      zIndex={20000}
      className="palette-swatch-picker-overlay"
      style={{
        overflow: 'visible',
        visibility: pos.top === -9999 ? 'hidden' : 'visible',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `var(${getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)})`,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showOpacityDropdown && (
          <Dropdown
            label="Opacity"
            layout="side-by-side"
            items={opacityOptions.map((opt) => ({ value: opt.key, label: opt.label }))}
            value={selectedOpacity}
            onChange={(val) => {
              if (!targetOpacityCssVar) return
              setSelectedOpacity(val)
              const opacityRef = `--recursica-tokens-opacities-${val}`
              updateCssVar(targetOpacityCssVar, `var(${opacityRef})`, tokensJson)

              if (setTheme && themeJson) {
                try {
                  const themeCopy = JSON.parse(JSON.stringify(themeJson))
                  const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                  const themes = root?.themes || root
                  const isDark = targetOpacityCssVar.includes('-dark-')
                  const modeKey = isDark ? 'dark' : 'light'

                  if (!themes[modeKey]) themes[modeKey] = {}
                  if (!themes[modeKey].states) themes[modeKey].states = {}
                  if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}

                  themes[modeKey].states.overlay.opacity = {
                    $type: 'number',
                    $value: `{tokens.opacities.${val}}`
                  }
                  setTheme(themeCopy)
                } catch (err) { }
              }

              window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
                detail: { cssVars: [targetOpacityCssVar] }
              }))
            }}
            layer="layer-3"
            labelSize="small"
            zIndex={30000}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
          <Label size="small">None</Label>
          <div
            onClick={(e) => {
              e.stopPropagation()
              const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
              cssVarsToUpdate.forEach((v) => removeCssVar(v))
              setAnchor(null)
              onSelect?.('')
              window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: cssVarsToUpdate } }))
            }}
            style={{
              width: swatch,
              height: swatch,
              cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${isNoneSelected ? `var(--recursica-brand-themes-${modeLower}-palettes-core-black)` : `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-border-color)`}`,
              position: 'relative',
              padding: isNoneSelected ? '1px' : '0',
              borderRadius: isNoneSelected ? '5px' : '0',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: isNoneSelected ? '4px' : '0',
              position: 'relative',
              background: `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-surface)`
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <line x1="10%" y1="90%" x2="90%" y2="10%" stroke={`var(--recursica-brand-themes-${modeLower}-palettes-neutral-500-tone)`} strokeWidth="1.5" />
              </svg>
              {isNoneSelected && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex' }}>
                  {CheckIcon ? <CheckIcon size={12} weight="bold" style={{ color: `var(--recursica-brand-themes-${modeLower}-palettes-core-black)` }} /> : '✓'}
                </div>
              )}
            </div>
          </div>
        </div>

        {paletteKeys.map((pk) => {
          const swatches: { key: string; label: string; cssVar: string }[] = []
          try {
            const root: any = (themeJson as any)?.brand ? (themeJson as any).brand : themeJson
            const themes = root?.themes || root
            const pal: any = themes?.[modeLower]?.palettes?.[pk] || themes?.[modeLower]?.palette?.[pk] || {}

            // Get keys and sort them: 1000 on the left to 000 on the right
            const keys = Object.keys(pal).filter(k => /^\d+$/.test(k))
            keys.sort((a, b) => {
              const aNum = parseInt(a)
              const bNum = parseInt(b)
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return bNum - aNum // Descending: 1000, 900, ..., 000
              }
              return b.localeCompare(a)
            })

            keys.forEach((sk) => {
              const label = sk.charAt(0).toUpperCase() + sk.slice(1).replace(/-/g, ' ')
              const cssVar = buildPaletteCssVar(pk, sk)
              swatches.push({ key: sk, label, cssVar })
            })
          } catch { }

          if (swatches.length === 0) return null

          return (
            <div key={pk} style={{ display: 'grid', gridTemplateColumns: `${labelCol}px 1fr`, alignItems: 'center', gap: 6 }}>
              <Label size="small" style={{ textTransform: 'capitalize' }}>{pk.replace(/-/g, ' ')}</Label>
              <div style={{ display: 'flex', flexWrap: 'nowrap', gap }}>
                {swatches.map((s) => {
                  const isSelected = isSwatchSelected(s.cssVar)
                  const baseVarName = s.cssVar.replace('-tone', '')
                  const onToneCssVar = `${baseVarName}-on-tone`

                  return (
                    <div
                      key={s.key}
                      title={s.label}
                      onClick={() => {
                        const cssVarsToUpdate = targetCssVars.length > 0 ? targetCssVars : [targetCssVar!]
                        const paletteVarRef = `var(${s.cssVar})`

                        // Update CSS variables for immediate visual feedback
                        cssVarsToUpdate.forEach((v) => updateCssVar(v, paletteVarRef, tokensJson))

                        // Persist to UIKit JSON if this is a component variable
                        if (cssVarsToUpdate.some(v => v.includes('-ui-kit-'))) {
                          cssVarsToUpdate.forEach((v) => {
                            if (v.includes('-ui-kit-')) {
                              updateUIKitValue(v, paletteVarRef)
                            }
                          })
                        }

                        if (isOverlay && setTheme && themeJson) {
                          try {
                            const themeCopy = JSON.parse(JSON.stringify(themeJson))
                            const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
                            const themes = root?.themes || root
                            const isDark = cssVarsToUpdate.some(v => v.includes('-dark-'))
                            const modeKey = isDark ? 'dark' : 'light'
                            if (!themes[modeKey]) themes[modeKey] = {}
                            if (!themes[modeKey].states) themes[modeKey].states = {}
                            if (!themes[modeKey].states.overlay) themes[modeKey].states.overlay = {}
                            themes[modeKey].states.overlay.color = {
                              $type: 'color',
                              $value: `{brand.themes.${modeKey}.palettes.${pk}.${s.key}.tone}`
                            }
                            setTheme(themeCopy)
                          } catch (err) { }
                        }

                        onSelect?.(s.cssVar)
                        setRefreshTrigger(prev => prev + 1)
                        setAnchor(null)
                        window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: cssVarsToUpdate } }))
                      }}
                      style={{
                        position: 'relative',
                        width: swatch,
                        height: swatch,
                        cursor: 'pointer',
                        background: `var(${s.cssVar})`,
                        border: `1px solid ${isSelected ? `var(--recursica-brand-themes-${modeLower}-palettes-core-black)` : `var(--recursica-brand-themes-${modeLower}-layer-layer-3-property-border-color)`}`,
                        padding: isSelected ? '1px' : '0',
                        borderRadius: isSelected ? '5px' : '0',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex' }}>
                          {CheckIcon ? <CheckIcon size={12} weight="bold" style={{ color: `var(${onToneCssVar})` }} /> : '✓'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Core colors removed */}
      </div>
    </Modal>
  )
}
