import { useState } from 'react'
import { Tabs as MantineTabs } from '@mantine/core'
import { iconNameToReactComponent } from '../../components/iconUtils'
import FontSizeTokens from './FontSizeTokens'
import FontLetterSpacingTokens from './FontLetterSpacingTokens'
import FontLineHeightTokens from './FontLineHeightTokens'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useVars } from '../../vars/VarsContext'
import { Button } from '../../../components/adapters/Button'
import { Switch } from '../../../components/adapters/Switch'
import { Tabs as TabsAdapter } from '../../../components/adapters/Tabs'
import { readOverrides, writeOverrides } from '../../theme/tokenOverrides'
import { clearStoredFonts } from '../../../core/store/fontStore'
import tokensImport from '../../../../recursica_tokens.json'
import { genericLayerProperty, genericLayerText } from '../../../core/css/cssVarBuilder'

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

    // Clear rf:fonts local storage
    clearStoredFonts()

    writeOverrides(updated)

    // Dispatch event with reset flag to trigger FontFamiliesTokens to rebuild
    try {
      window.dispatchEvent(new CustomEvent('tokenOverridesChanged', { detail: { all: updated, reset: true } }))
    } catch { }
  }

  return (
    <div data-recursica-layer="0" style={{
      background: `var(${genericLayerProperty(0, 'surface')})`,
      border: `1px solid var(${genericLayerProperty(0, 'border-color')})`,
      borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)',
      padding: 0,
      overflow: 'hidden',
    }}>
      <TabsAdapter
        value={activeTab}
        variant="pills"
        layer="layer-0"
        onChange={(value) => setActiveTab((value as 'size' | 'letter-spacing' | 'line-height') || 'size')}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          alignItems: 'center',
          gap: 0,
          paddingTop: 'var(--recursica_brand_dimensions_gutters_vertical)',
          paddingBottom: 'var(--recursica_brand_dimensions_gutters_vertical)',
          paddingLeft: 'var(--recursica_brand_dimensions_gutters_horizontal)',
          paddingRight: 'var(--recursica_brand_dimensions_gutters_horizontal)',
          borderBottom: `1px solid var(${genericLayerProperty(0, 'border-color')})`,
        }}>
          <MantineTabs.List>
            <MantineTabs.Tab value="size">Font size</MantineTabs.Tab>
            <MantineTabs.Tab value="letter-spacing">Letter spacing</MantineTabs.Tab>
            <MantineTabs.Tab value="line-height">Line height</MantineTabs.Tab>
          </MantineTabs.List>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'var(--recursica_brand_dimensions_general_default)',
          }}>
            <Button
              variant="outline"
              size="small"
              icon={(() => {
                const RefreshIcon = iconNameToReactComponent('arrow-path')
                return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : null
              })()}
              onClick={handleReset}
            >
              Reset all
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica_brand_dimensions_general_default)' }}>
              <span style={{
                fontSize: 'var(--recursica_brand_typography_body-small-font-size)',
                color: `var(${genericLayerText(0, 'color')})`,
                opacity: `var(${genericLayerText(0, 'high-emphasis')})`,
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
        <MantineTabs.Panel value="size">
          <FontSizeTokens autoScale={autoScaleSize} />
        </MantineTabs.Panel>
        <MantineTabs.Panel value="letter-spacing">
          <FontLetterSpacingTokens autoScale={autoScaleLetterSpacing} />
        </MantineTabs.Panel>
        <MantineTabs.Panel value="line-height">
          <FontLineHeightTokens autoScale={autoScaleLineHeight} />
        </MantineTabs.Panel>
      </TabsAdapter>
    </div>
  )
}

