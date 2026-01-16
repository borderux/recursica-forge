import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import OpacityTokens from './opacity/OpacityTokens'
import SizeTokens from './size/SizeTokens'
import FontFamiliesTokens from './font/FontFamiliesTokens'
import { AddButtonWrapper as FontAddButton } from './font/FontFamiliesTokens'
import FontPropertiesTokens from './font/FontPropertiesTokens'
import ColorTokens, { AddColorScaleButton } from './colors/ColorTokens'
import { useThemeMode } from '../theme/ThemeModeContext'

type NavItem = 'color' | 'font' | 'opacity'

export default function TokensPage() {
  const location = useLocation()
  const { mode } = useThemeMode()
  
  // Determine selected nav item from URL hash
  const getSelectedFromHash = (): NavItem => {
    if (location.hash === '#font') return 'font'
    if (location.hash === '#opacity' || location.hash === '#size') return 'opacity'
    return 'color' // default
  }
  
  const [selected, setSelected] = useState<NavItem>(getSelectedFromHash())
  
  // Update selected when hash changes
  useEffect(() => {
    setSelected(getSelectedFromHash())
  }, [location.hash])
  
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto', 
      display: 'grid', 
      gap: 'var(--recursica-brand-dimensions-spacers-lg)',
      padding: 'var(--recursica-brand-dimensions-spacers-xl)',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: selected === 'font' ? 'var(--recursica-brand-dimensions-spacers-lg)' : 0,
      }}>
        <h1 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
          fontSize: 'var(--recursica-brand-typography-h1-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
          opacity: `var(${layer0Base}-element-text-high-emphasis)`,
        }}>
          {selected === 'color' && 'Color'}
          {selected === 'font' && 'Font'}
          {selected === 'opacity' && 'Opacity & Size'}
        </h1>
        {selected === 'color' && <AddColorScaleButton />}
        {selected === 'font' && <FontAddButton />}
      </div>
      <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-md)' }}>
        {selected === 'color' && <ColorTokens />}
        {selected === 'font' && (
          <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
            <FontFamiliesTokens />
            <FontPropertiesTokens />
          </div>
        )}
        {selected === 'opacity' && (
          <div style={{ display: 'grid', gap: 'var(--recursica-brand-dimensions-spacers-lg)' }}>
            <section style={{ 
              background: `var(${layer0Base}-surface)`, 
              border: `1px solid var(${layer1Base}-border-color)`, 
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)', 
              padding: 'var(--recursica-brand-dimensions-spacers-md)' 
            }}>
              <OpacityTokens />
            </section>
            <section style={{ 
              background: `var(${layer0Base}-surface)`, 
              border: `1px solid var(${layer1Base}-border-color)`, 
              borderRadius: 'var(--recursica-brand-dimensions-border-radius-default)', 
              padding: 'var(--recursica-brand-dimensions-spacers-md)' 
            }}>
              <SizeTokens />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}


