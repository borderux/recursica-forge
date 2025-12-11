import { useState } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import FontSizeTokens from './FontSizeTokens'
import FontLetterSpacingTokens from './FontLetterSpacingTokens'
import FontLineHeightTokens from './FontLineHeightTokens'
import { useThemeMode } from '../../theme/ThemeModeContext'
import { useVars } from '../../vars/VarsContext'
import { Button } from '../../../components/adapters/Button'
import { getComponentCssVar } from '../../../components/utils/cssVarNames'
import { Switch } from './Switch'

export default function FontPropertiesTokens() {
  const { mode } = useThemeMode()
  const { resetAll } = useVars()
  const [activeTab, setActiveTab] = useState<'size' | 'letter-spacing' | 'line-height'>('size')
  const [autoScaleSize, setAutoScaleSize] = useState(() => {
    const v = localStorage.getItem('font-size-auto-scale')
    return v === null ? true : v === 'true'
  })
  const [autoScaleLetterSpacing, setAutoScaleLetterSpacing] = useState(() => {
    const v = localStorage.getItem('font-letter-scale-by-tight-wide')
    return v === null ? true : v === 'true'
  })
  const [autoScaleLineHeight, setAutoScaleLineHeight] = useState(() => {
    const v = localStorage.getItem('font-line-scale-by-short-tall')
    return v === null ? false : v === 'true'
  })

  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`
  const buttonTextBg = getComponentCssVar('Button', 'color', 'text-background', 'layer-0')
  const buttonTextText = getComponentCssVar('Button', 'color', 'text-text', 'layer-0')
  const buttonSolidBg = getComponentCssVar('Button', 'color', 'solid-background', 'layer-0')
  const buttonSolidText = getComponentCssVar('Button', 'color', 'solid-text', 'layer-0')
  const buttonHeight = getComponentCssVar('Button', 'size', 'default-height', undefined)
  const buttonPadding = getComponentCssVar('Button', 'size', 'default-horizontal-padding', undefined)
  const buttonBorderRadius = getComponentCssVar('Button', 'size', 'border-radius', undefined)

  const handleReset = () => {
    // Reset logic would go here - for now just call resetAll
    resetAll()
  }

  return (
    <div style={{
      background: `var(${layer0Base}-surface)`,
      border: `1px solid var(${layer1Base}-border-color)`,
      borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)',
      padding: 'var(--recursica-brand-dimensions-spacer-lg)',
      display: 'grid',
      gap: 'var(--recursica-brand-dimensions-spacer-lg)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-spacer-default)' }}>
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
        <div style={{ display: 'flex', gap: 'var(--recursica-brand-dimensions-spacer-default)', alignItems: 'center' }}>
          <Button
            variant="text"
            size="default"
            icon={(() => {
              const RefreshIcon = iconNameToReactComponent('arrow-path')
              return RefreshIcon ? <RefreshIcon style={{ width: 'var(--recursica-brand-dimensions-icon-default)', height: 'var(--recursica-brand-dimensions-icon-default)' }} /> : null
            })()}
            onClick={handleReset}
          >
            Reset to default
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--recursica-brand-dimensions-spacer-default)' }}>
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
            />
          </div>
        </div>
      </div>
      <div style={{
        borderTop: `1px solid var(${layer1Base}-border-color)`,
        paddingTop: 'var(--recursica-brand-dimensions-spacer-lg)',
      }}>
        {activeTab === 'size' && <FontSizeTokens autoScale={autoScaleSize} />}
        {activeTab === 'letter-spacing' && <FontLetterSpacingTokens autoScale={autoScaleLetterSpacing} />}
        {activeTab === 'line-height' && <FontLineHeightTokens autoScale={autoScaleLineHeight} />}
      </div>
    </div>
  )
}

