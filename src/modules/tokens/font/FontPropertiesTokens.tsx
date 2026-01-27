import { useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import FontSizeTokens from './FontSizeTokens'
import FontLetterSpacingTokens from './FontLetterSpacingTokens'
import FontLineHeightTokens from './FontLineHeightTokens'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useVars } from '../../vars/VarsContext'
import { Button } from '../../../components/adapters/Button'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { Switch } from '../../../components/adapters/Switch'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'
import tokensImport from '../../../vars/Tokens.json'

export default function FontPropertiesTokens() {
  const { mode } = useThemeMode()
  const { resetAll, tokens: tokensJson, updateToken } = useVars()
  const [activeTab, setActiveTab] = useState<'size' | 'letter-spacing' | 'line-height'>('size')
  const [autoScaleSize, setAutoScaleSize] = useState(() => {
    // Default to false - reset any existing 'true' value to establish new default
    const v = localStorage.getItem('font-size-auto-scale')
    if (v === null || v === 'true') {
      // Reset to false to establish the new default behavior
      localStorage.setItem('font-size-auto-scale', 'false')
      return false
    }
    // If explicitly set to 'false', respect that
    return false
  })
  const [autoScaleLetterSpacing, setAutoScaleLetterSpacing] = useState(() => {
    const v = localStorage.getItem('font-letter-scale-by-tight-wide')
    return v === null ? false : v === 'true'
  })
  const [autoScaleLineHeight, setAutoScaleLineHeight] = useState(() => {
    // Default to false - reset any existing 'true' value to establish new default
    const v = localStorage.getItem('font-line-scale-by-short-tall')
    if (v === null || v === 'true') {
      // Reset to false to establish the new default behavior
      localStorage.setItem('font-line-scale-by-short-tall', 'false')
      return false
    }
    // If explicitly set to 'false', respect that
    return false
  })

  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  const buttonTextBg = getComponentCssVar('Button', 'colors', 'text-background', 'layer-0')
  const buttonTextText = getComponentCssVar('Button', 'colors', 'text-text', 'layer-0')
  const buttonSolidBg = getComponentCssVar('Button', 'colors', 'solid-background', 'layer-0')
  const buttonSolidText = getComponentCssVar('Button', 'colors', 'solid-text', 'layer-0')
  const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
  const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
  const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)

  const handleReset = () => {
    // Reset font token values based on active tab
    try {
      const fontRoot: any = (tokensImport as any)?.tokens?.font || (tokensImport as any)?.font || {}
      
      if (activeTab === 'size') {
        // Reset all font size tokens to defaults
        const sizes: any = fontRoot?.sizes || fontRoot?.size || {}
        Object.keys(sizes).filter((k) => !k.startsWith('$')).forEach((k) => {
          const val = sizes[k]?.$value
          const num = typeof val === 'number' ? val : (typeof val === 'object' && val && typeof val.value === 'number' ? val.value : Number(val))
          if (Number.isFinite(num)) {
            updateToken(`font/size/${k}`, num)
          }
        })
      } else if (activeTab === 'letter-spacing') {
        // Reset all font letter spacing tokens to defaults
        const letterSpacings: any = fontRoot?.['letter-spacings'] || fontRoot?.['letter-spacing'] || {}
        Object.keys(letterSpacings).filter((k) => !k.startsWith('$')).forEach((k) => {
          const val = letterSpacings[k]?.$value
          const num = typeof val === 'number' ? val : Number(val)
          if (Number.isFinite(num)) {
            updateToken(`font/letter-spacing/${k}`, num === 0 ? "0" : num)
          }
        })
      } else if (activeTab === 'line-height') {
        // Reset all font line height tokens to defaults
        const lineHeights: any = fontRoot?.['line-heights'] || fontRoot?.['line-height'] || {}
        Object.keys(lineHeights).filter((k) => !k.startsWith('$')).forEach((k) => {
          const val = lineHeights[k]?.$value
          const num = typeof val === 'number' ? val : Number(val)
          if (Number.isFinite(num)) {
            updateToken(`font/line-height/${k}`, num)
          }
        })
      }
    } catch (error) {
      console.error('Failed to reset font tokens:', error)
    }
    
    // Remove all font/typeface overrides that aren't in the original JSON
    const all = readOverrides()
    const updated: Record<string, any> = {}
    
    // Keep all non-font/typeface overrides
    Object.keys(all).forEach((k) => {
      if (!k.startsWith('font/typeface/')) {
        updated[k] = all[k]
      }
    })
    
    // Restore font/typeface values from JSON only (removes any added fonts)
    try {
      const fontRoot: any = (tokensJson as any)?.tokens?.font || (tokensJson as any)?.font || {}
      const typefaces: any = fontRoot?.typefaces || fontRoot?.typeface || {}
      Object.keys(typefaces).filter((k) => !k.startsWith('$')).forEach((k) => {
        const val = typefaces[k]?.$value
        updated[`font/typeface/${k}`] = typeof val === 'string' && val ? val : ''
      })
    } catch {}
    
    writeOverrides(updated)
    
    // Dispatch event with reset flag to trigger FontFamiliesTokens to rebuild
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, reset: true } }))
    } catch {}
  }

  return (
    <div style={{
      background: `var(${layer0Base}-surface)`,
      border: `1px solid var(${layer1Base}-border-color)`,
      borderRadius: 'var(--recursica-brand-dimensions-border-radii-xl)',
      padding: 0,
      display: 'grid',
      gap: 0,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 350px', gap: 0, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-general-default)', paddingTop: 'var(--recursica-brand-dimensions-gutters-vertical)', paddingBottom: 'var(--recursica-brand-dimensions-gutters-vertical)', paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)', paddingRight: 'var(--recursica-brand-dimensions-gutters-horizontal)', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('size')}
            style={{
              height: `var(${buttonHeight})`,
              paddingLeft: `var(${buttonPadding})`,
              paddingRight: `var(${buttonPadding})`,
              border: 'none',
              background: activeTab === 'size' ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
              color: activeTab === 'size' ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
              opacity: activeTab === 'size' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
              fontWeight: activeTab === 'size' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              fontSize: 'var(--recursica-brand-typography-button-font-size)',
              borderRadius: `var(${buttonBorderRadius})`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Font size
          </button>
          <button
            onClick={() => setActiveTab('letter-spacing')}
            style={{
              height: `var(${buttonHeight})`,
              paddingLeft: `var(${buttonPadding})`,
              paddingRight: `var(${buttonPadding})`,
              border: 'none',
              background: activeTab === 'letter-spacing' ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
              color: activeTab === 'letter-spacing' ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
              opacity: activeTab === 'letter-spacing' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
              fontWeight: activeTab === 'letter-spacing' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              fontSize: 'var(--recursica-brand-typography-button-font-size)',
              borderRadius: `var(${buttonBorderRadius})`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Letter spacing
          </button>
          <button
            onClick={() => setActiveTab('line-height')}
            style={{
              height: `var(${buttonHeight})`,
              paddingLeft: `var(${buttonPadding})`,
              paddingRight: `var(${buttonPadding})`,
              border: 'none',
              background: activeTab === 'line-height' ? `var(${buttonSolidBg})` : `var(${buttonTextBg})`,
              color: activeTab === 'line-height' ? `var(${buttonSolidText})` : `var(${buttonTextText})`,
              opacity: activeTab === 'line-height' ? 1 : `var(${layer1Base}-element-text-low-emphasis)`,
              fontWeight: activeTab === 'line-height' ? 600 : 'var(--recursica-brand-typography-button-font-weight)',
              fontSize: 'var(--recursica-brand-typography-button-font-size)',
              borderRadius: `var(${buttonBorderRadius})`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Line height
          </button>
        </div>
        <div></div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          borderLeft: `1px solid var(${layer1Base}-border-color)`, 
          width: '350px',
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 'var(--recursica-brand-dimensions-gutters-horizontal)',
          paddingRight: 'var(--recursica-brand-dimensions-gutters-horizontal)',
        }}>
          <Button
            variant="outline"
            size="small"
            icon={(() => {
              const RefreshIcon = iconNameToReactComponent('arrow-path')
              return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icons-default)', height: 'var(--recursica-brand-dimensions-icons-default)' }} /> : null
            })()}
            onClick={handleReset}
          >
            Reset all
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-general-default)' }}>
            <span style={{ 
              fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
              color: `var(${layer0Base}-element-text-color)`,
              opacity: `var(${layer0Base}-element-text-high-emphasis)`,
            }}>
              Auto scale
            </span>
            <Switch
              checked={
                activeTab === 'size' ? autoScaleSize :
                activeTab === 'letter-spacing' ? autoScaleLetterSpacing :
                autoScaleLineHeight
              }
              onChange={(checked) => {
                if (activeTab === 'size') {
                  setAutoScaleSize(checked)
                  localStorage.setItem('font-size-auto-scale', String(checked))
                } else if (activeTab === 'letter-spacing') {
                  setAutoScaleLetterSpacing(checked)
                  localStorage.setItem('font-letter-scale-by-tight-wide', String(checked))
                } else {
                  setAutoScaleLineHeight(checked)
                  localStorage.setItem('font-line-scale-by-short-tall', String(checked))
                }
              }}
              layer="layer-0"
            />
          </div>
        </div>
      </div>
      <div>
        {activeTab === 'size' && <FontSizeTokens autoScale={autoScaleSize} />}
        {activeTab === 'letter-spacing' && <FontLetterSpacingTokens autoScale={autoScaleLetterSpacing} />}
        {activeTab === 'line-height' && <FontLineHeightTokens autoScale={autoScaleLineHeight} />}
      </div>
    </div>
  )
}

