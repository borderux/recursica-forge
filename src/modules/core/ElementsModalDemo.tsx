import { useState, useEffect, useMemo, useRef } from 'react'
import { useThemeMode } from '../theme/ThemeModeContext'
import { useVars } from '../vars/VarsContext'
import { Button } from '../../components/adapters/Button'
import { Label } from '../../components/adapters/Label'
import { Dropdown } from '../../components/adapters/Dropdown'
import { iconNameToReactComponent } from '../components/iconUtils'
import { readCssVar, readCssVarResolved } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { getVarsStore } from '../../core/store/varsStore'
import { tokenOpacity, layerProperty, layerText, elevation, state, textEmphasis, paletteCore } from '../../core/css/cssVarBuilder'

export default function ElementsModalDemo() {
  const { mode } = useThemeMode()
  const { tokens: tokensJson, theme } = useVars()
  const modeLower = mode.toLowerCase()

  // Helper to persist an opacity token reference to the theme JSON (updates BOTH modes)
  const persistToThemeJson = (path: 'text-emphasis-high' | 'text-emphasis-low' | 'state-disabled', tokenKey: string) => {
    if (!theme) return
    try {
      const themeCopy = getVarsStore().getLatestThemeCopy()
      const root: any = themeCopy?.brand ? themeCopy.brand : themeCopy
      const themes = root?.themes || root
      const newValue = `{tokens.opacity.${tokenKey}}`

      // Update both modes
      for (const mk of ['light', 'dark']) {
        if (!themes[mk]) continue
        if (path === 'text-emphasis-high') {
          if (!themes[mk]['text-emphasis']) themes[mk]['text-emphasis'] = {}
          const te = themes[mk]['text-emphasis']
          if (te.high && typeof te.high === 'object' && '$value' in te.high) {
            te.high.$value = newValue
          } else {
            te.high = { $type: 'number', $value: newValue }
          }
        } else if (path === 'text-emphasis-low') {
          if (!themes[mk]['text-emphasis']) themes[mk]['text-emphasis'] = {}
          const te = themes[mk]['text-emphasis']
          if (te.low && typeof te.low === 'object' && '$value' in te.low) {
            te.low.$value = newValue
          } else {
            te.low = { $type: 'number', $value: newValue }
          }
        } else if (path === 'state-disabled') {
          if (!themes[mk].states) themes[mk].states = {}
          const st = themes[mk].states
          if (st.disabled && typeof st.disabled === 'object' && '$value' in st.disabled) {
            st.disabled.$value = newValue
          } else {
            st.disabled = { $type: 'number', $value: newValue }
          }
        }
      }

      getVarsStore().setThemeSilent(themeCopy)
    } catch (err) {
      console.error('Failed to persist emphasis/state change to theme JSON:', err)
    }
  }

  const otherMode = modeLower === 'light' ? 'dark' : 'light'

  // Get opacity tokens and build dropdown options
  const opacityOptions = useMemo(() => {
    const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
    const list: Array<{ key: string; label: string; tokenName: string }> = Object.keys(src)
      .filter((k) => !k.startsWith('$') && !k.startsWith('elevation-'))
      .map((k) => {
        const v = src[k]?.$value
        const num = typeof v === 'number' ? v : Number(v)
        const percentage = Math.round((num <= 1 ? num : num / 100) * 100)
        const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, ' ')
        return {
          key: k,
          label: `${label} (${percentage}%)`,
          tokenName: `opacity/${k}`,
          value: num, // Store the numeric value for filtering and sorting
        }
      })
      .filter((it) => Number.isFinite(it.value)) // Filter by value, not key
      .map(({ value, ...rest }) => rest) // Remove value from final objects
    list.sort((a, b) => {
      const aVal = src[a.key]?.$value
      const bVal = src[b.key]?.$value
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal)
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal)
      return aNum - bNum
    })
    return list
  }, [tokensJson])

  // Extract current opacity token from CSS variable
  const extractTokenFromCssVar = (cssVar: string): string | null => {
    try {
      const rawValue = readCssVar(cssVar)
      if (!rawValue) return null

      // Match patterns like: var(--recursica_tokens_opacities_solid) or var(--tokens-opacities-solid)
      let match = rawValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
      if (match) return match[1]

      // If no direct match, try resolving nested var() references
      const resolvedValue = readCssVarResolved(cssVar)
      if (resolvedValue) {
        match = resolvedValue.match(/var\(--(?:recursica-)?tokens-opacities?-([^)]+)\)/)
        if (match) return match[1]

        // If resolved to a numeric value, try to find matching token by value
        const resolvedNum = parseFloat(resolvedValue)
        if (!isNaN(resolvedNum)) {
          const normalized = resolvedNum <= 1 ? resolvedNum : resolvedNum / 100
          const src = (tokensJson as any)?.tokens?.opacities || (tokensJson as any)?.tokens?.opacity || {}
          for (const [key, val] of Object.entries(src)) {
            if (key.startsWith('$')) continue
            const v = (val as any)?.$value
            const num = typeof v === 'number' ? v : Number(v)
            const tokenNormalized = num <= 1 ? num : num / 100
            if (Math.abs(tokenNormalized - normalized) < 0.01) {
              return key
            }
          }
        }
      }
    } catch { }
    return null
  }

  // Get current selected values from CSS variables
  const getCurrentSelection = (cssVar: string): string => {
    const tokenKey = extractTokenFromCssVar(cssVar)
    return tokenKey || opacityOptions[0]?.key || ''
  }

  const [selectedHigh, setSelectedHigh] = useState(() =>
    getCurrentSelection(textEmphasis(modeLower, 'high'))
  )
  const [selectedLow, setSelectedLow] = useState(() =>
    getCurrentSelection(textEmphasis(modeLower, 'low'))
  )
  const [selectedDisabled, setSelectedDisabled] = useState(() =>
    getCurrentSelection(state(modeLower, 'disabled'))
  )

  // Listen for opacity changes and update dropdown values
  useEffect(() => {
    const handleUpdate = () => {
      setSelectedHigh(getCurrentSelection(textEmphasis(modeLower, 'high')))
      setSelectedLow(getCurrentSelection(textEmphasis(modeLower, 'low')))
      setSelectedDisabled(getCurrentSelection(state(modeLower, 'disabled')))
    }

    window.addEventListener('tokenOverridesChanged', handleUpdate as any)
    window.addEventListener('paletteVarsChanged', handleUpdate as any)

    // Also check periodically
    const interval = setInterval(handleUpdate, 200)

    return () => {
      clearInterval(interval)
      window.removeEventListener('tokenOverridesChanged', handleUpdate as any)
      window.removeEventListener('paletteVarsChanged', handleUpdate as any)
    }
  }, [modeLower, opacityOptions, tokensJson])

  const HouseIcon = iconNameToReactComponent('house')
  const XIcon = iconNameToReactComponent('x-mark')
  const PencilIcon = iconNameToReactComponent('pencil')
  const ResetIcon = iconNameToReactComponent('arrow-path')
  const editOverlayButtonRef = useRef<HTMLDivElement>(null)

  // Checkerboard pattern
  const checkerboardStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    width: '100%',
    height: '100%',
    position: 'absolute',
    inset: 0,
  }

  return (
    <div style={{
      backgroundColor: `var(${layerProperty(modeLower, 1, 'surface')})`,
      border: `1px solid var(${layerProperty(modeLower, 1, 'border-color')})`,
      borderRadius: 'var(--recursica_brand_dimensions_border-radii_lg)',
      padding: `var(${layerProperty(modeLower, 1, 'padding')})`,
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--recursica_brand_dimensions_gutters_vertical)',
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--recursica_brand_typography_h2-font-family)',
          fontSize: 'var(--recursica_brand_typography_h2-font-size)',
          fontWeight: 'var(--recursica_brand_typography_h2-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_h2-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_h2-line-height)',
          color: `var(${layerText(modeLower, 1, 'color')})`,
        }}>Elements</h2>
        <div ref={editOverlayButtonRef}>
          <Button
            variant="outline"
            size="small"
            icon={PencilIcon ? <PencilIcon /> : undefined}
            onClick={() => {
              if (editOverlayButtonRef.current && (window as any).openPalettePicker) {
                const overlayColorVar = state(modeLower, 'overlay', 'color')
                const overlayOpacityVar = state(modeLower, 'overlay', 'opacity')
                  ; (window as any).openPalettePicker(editOverlayButtonRef.current, overlayColorVar, undefined, overlayOpacityVar)
              }
            }}
          >
            Edit overlay
          </Button>
        </div>
      </div>

      {/* Modal demo area */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        backgroundColor: `var(${layerProperty(modeLower, 0, 'surface')})`,
        border: `1px solid var(${layerProperty(modeLower, 0, 'border-color')})`,
        borderRadius: `var(${layerProperty(modeLower, 0, 'border-radius')})`,
        padding: `var(${layerProperty(modeLower, 0, 'padding')})`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Checkerboard background */}
        <div style={checkerboardStyle} />

        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `var(${state(modeLower, 'overlay', 'color')})`,
          opacity: `var(${state(modeLower, 'overlay', 'opacity')})`,
          zIndex: 1,
        }} />

        {/* Modal */}
        <div style={{
          position: 'relative',
          width: '550px',
          maxWidth: '90%',
          minHeight: '400px',
          backgroundColor: `var(${layerProperty(modeLower, 3, 'surface')})`,
          border: `1px solid var(${layerProperty(modeLower, 3, 'border-color')})`,
          borderRadius: `var(${layerProperty(modeLower, 3, 'border-radius')})`,
          padding: 'var(--recursica_brand_dimensions_general_xl)',
          boxShadow: `var(${elevation(modeLower, 4, 'x-axis')}) var(${elevation(modeLower, 4, 'y-axis')}) var(${elevation(modeLower, 4, 'blur')}) var(${elevation(modeLower, 4, 'spread')}) var(${elevation(modeLower, 4, 'shadow-color')})`,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
        }}>
          {/* Modal header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
              fontSize: 'var(--recursica_brand_typography_h3-font-size)',
              fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
              color: `var(${layerText(modeLower, 3, 'color')})`,
            }}>
              Modal title
            </h3>
            {XIcon && (
              <div style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: `var(${paletteCore(modeLower, 'interactive', 'default', 'tone')})`,
                cursor: 'default', // Can't be closed
              }}>
                <XIcon style={{ width: '16px', height: '16px' }} />
              </div>
            )}
          </div>

          {/* Emphasis tabs */}
          <div style={{
            display: 'flex',
            gap: 'var(--recursica_brand_dimensions_general_sm)',
          }}>
            {[
              { label: 'High emphasis', opacityVar: textEmphasis(modeLower, 'high') },
              { label: 'Low emphasis', opacityVar: textEmphasis(modeLower, 'low') },
              { label: 'Disabled', opacityVar: state(modeLower, 'disabled') },
            ].map((item, index) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  padding: `var(--recursica_brand_dimensions_general_sm) var(--recursica_brand_dimensions_general_md)`,
                  border: `1px solid var(${layerProperty(modeLower, 1, 'border-color')})`,
                  borderRadius: '999px', // Fully rounded pill shape
                  backgroundColor: index === 0
                    ? `var(${layerProperty(modeLower, 1, 'surface')})`
                    : 'transparent',
                  color: `var(${layerText(modeLower, 1, 'color')})`,
                  opacity: `var(${item.opacityVar})`,
                  fontFamily: 'var(--recursica_brand_typography_body-font-family)',
                  fontSize: 'var(--recursica_brand_typography_body-font-size)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--recursica_brand_dimensions_general_sm)',
                  justifyContent: 'center',
                }}
              >
                {HouseIcon && <HouseIcon style={{ width: '16px', height: '16px' }} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Dropdowns */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--recursica_brand_dimensions_gutters_vertical)',
          }}>
            <Dropdown
              label="High emphasis text / icons"
              items={opacityOptions.map(o => ({ value: o.key, label: o.label }))}
              value={selectedHigh}
              onChange={(val) => {
                const option = opacityOptions.find(o => o.key === val)
                if (option) {
                  const tokenKey = option.key
                  const opacityCssVar = tokenOpacity(tokenKey)
                  updateCssVar(textEmphasis(modeLower, 'high'), `var(${opacityCssVar})`)
                  updateCssVar(`--recursica_brand_themes_${otherMode}_text-emphasis_high`, `var(${opacityCssVar})`)
                  persistToThemeJson('text-emphasis-high', tokenKey)
                  setSelectedHigh(val)
                }
              }}
              layout="side-by-side"
              layer="layer-1"
              style={{ width: '100%' }}
              zIndex={30000}
            />

            <Dropdown
              label="Low emphasis text / icons"
              items={opacityOptions.map(o => ({ value: o.key, label: o.label }))}
              value={selectedLow}
              onChange={(val) => {
                const option = opacityOptions.find(o => o.key === val)
                if (option) {
                  const tokenKey = option.key
                  const opacityCssVar = tokenOpacity(tokenKey)
                  updateCssVar(textEmphasis(modeLower, 'low'), `var(${opacityCssVar})`)
                  updateCssVar(`--recursica_brand_themes_${otherMode}_text-emphasis_low`, `var(${opacityCssVar})`)
                  persistToThemeJson('text-emphasis-low', tokenKey)
                  setSelectedLow(val)
                }
              }}
              layout="side-by-side"
              layer="layer-1"
              style={{ width: '100%' }}
              zIndex={30000}
            />

            <Dropdown
              label="Disabled interactive elements"
              items={opacityOptions.map(o => ({ value: o.key, label: o.label }))}
              value={selectedDisabled}
              onChange={(val) => {
                const option = opacityOptions.find(o => o.key === val)
                if (option) {
                  const tokenKey = option.key
                  const opacityCssVar = tokenOpacity(tokenKey)
                  updateCssVar(state(modeLower, 'disabled'), `var(${opacityCssVar})`)
                  updateCssVar(state(otherMode, 'disabled'), `var(${opacityCssVar})`)
                  persistToThemeJson('state-disabled', tokenKey)
                  setSelectedDisabled(val)
                }
              }}
              layout="side-by-side"
              layer="layer-1"
              style={{ width: '100%' }}
              zIndex={30000}
            />

            {/* Reset all button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)',
            }}>
              <Button
                variant="outline"
                size="small"
                layer="layer-1"
                icon={ResetIcon ? <ResetIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : undefined}
                onClick={() => {
                  // Reset all opacities to default values from recursica_brand.json
                  try {
                    // Default values from recursica_brand.json:
                    // text-emphasis-high: {tokens.opacity.solid}
                    // text-emphasis-low: {tokens.opacity.smoky}
                    // state-disabled: {tokens.opacity.ghost}
                    const defaultHighToken = 'solid'
                    const defaultLowToken = 'smoky'
                    const defaultDisabledToken = 'ghost'

                    // Reset CSS variables to default token references (both modes)
                    updateCssVar(textEmphasis(modeLower, 'high'), `var(--recursica_tokens_opacities_${defaultHighToken})`)
                    updateCssVar(textEmphasis(modeLower, 'low'), `var(--recursica_tokens_opacities_${defaultLowToken})`)
                    updateCssVar(state(modeLower, 'disabled'), `var(--recursica_tokens_opacities_${defaultDisabledToken})`)
                    updateCssVar(textEmphasis(otherMode, 'high'), `var(--recursica_tokens_opacities_${defaultHighToken})`)
                    updateCssVar(textEmphasis(otherMode, 'low'), `var(--recursica_tokens_opacities_${defaultLowToken})`)
                    updateCssVar(state(otherMode, 'disabled'), `var(--recursica_tokens_opacities_${defaultDisabledToken})`)

                    // Persist resets to theme JSON
                    persistToThemeJson('text-emphasis-high', defaultHighToken)
                    persistToThemeJson('text-emphasis-low', defaultLowToken)
                    persistToThemeJson('state-disabled', defaultDisabledToken)

                    // Update dropdown selections
                    setSelectedHigh(defaultHighToken)
                    setSelectedLow(defaultLowToken)
                    setSelectedDisabled(defaultDisabledToken)
                  } catch (err) {
                    console.error('Failed to reset opacities:', err)
                  }
                }}
              >
                Reset all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
