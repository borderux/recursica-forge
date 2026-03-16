import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import OpacityTokens from './opacity/OpacityTokens'
import SizeTokens from './size/SizeTokens'
import FontFamiliesTokens from './font/FontFamiliesTokens'
import { AddButtonWrapper as FontAddButton } from './font/FontFamiliesTokens'
import FontPropertiesTokens from './font/FontPropertiesTokens'
import ColorTokens, { AddColorScaleButton } from './colors/ColorTokens'
import { useThemeMode } from '../theme/ThemeModeContext'
import { genericLayerProperty, genericLayerText } from '../../core/css/cssVarBuilder'

type NavItem = 'color' | 'font' | 'opacity'

export default function TokensPage() {
  const location = useLocation()
  const { mode } = useThemeMode()
  
  // Determine selected nav item from URL pathname
  const getSelectedFromPath = (): NavItem => {
    if (location.pathname === '/tokens/font') return 'font'
    if (location.pathname === '/tokens/opacity') return 'opacity'
    return 'color' // default (including /tokens)
  }
  
  const [selected, setSelected] = useState<NavItem>(getSelectedFromPath())
  
  // Update selected when pathname changes
  useEffect(() => {
    setSelected(getSelectedFromPath())
  }, [location.pathname])
  
  const layer0Surface = genericLayerProperty(0, 'surface')
  const layer0TextColor = genericLayerText(0, 'color')
  const layer0TextHigh = genericLayerText(0, 'high-emphasis')
  const layer0BorderColor = genericLayerProperty(0, 'border-color')

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto', 
      display: 'grid', 
      gap: 'var(--recursica_brand_dimensions_general_lg)',
      padding: 'var(--recursica_brand_dimensions_general_xl)',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: selected === 'font' ? 'var(--recursica_brand_dimensions_general_lg)' : (selected === 'opacity' ? 'var(--recursica_brand_dimensions_gutters_vertical)' : 0),
      }}>
        <h1 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
          fontSize: 'var(--recursica_brand_typography_h1-font-size)',
          fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
          color: `var(${layer0TextColor})`,
          opacity: `var(${layer0TextHigh})`,
        }}>
          {selected === 'color' && 'Color'}
          {selected === 'font' && 'Font'}
          {selected === 'opacity' && 'Opacity & Size'}
        </h1>
        {selected === 'color' && <AddColorScaleButton />}
        {selected === 'font' && <FontAddButton />}
      </div>
      <div style={{ display: 'grid', gap: 'var(--recursica_brand_dimensions_general_md)' }}>
        {selected === 'color' && <ColorTokens />}
        {selected === 'font' && (
          <div style={{ display: 'grid', gap: 'var(--recursica_brand_dimensions_gutters_vertical)' }}>
            <FontFamiliesTokens />
            <FontPropertiesTokens />
          </div>
        )}
        {selected === 'opacity' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--recursica_brand_dimensions_general_lg)',
            alignItems: 'start',
          }}>
            <section data-recursica-layer="0" style={{ 
              background: `var(${layer0Surface})`, 
              border: `1px solid var(${layer0BorderColor})`,
              borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)', 
              padding: 'var(--recursica_brand_dimensions_general_xl)',
            }}>
              <OpacityTokens />
            </section>
            <section data-recursica-layer="0" style={{ 
              background: `var(${layer0Surface})`, 
              border: `1px solid var(${layer0BorderColor})`,
              borderRadius: 'var(--recursica_brand_dimensions_border-radii_xl)', 
              padding: 'var(--recursica_brand_dimensions_general_xl)',
            }}>
              <SizeTokens />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}


