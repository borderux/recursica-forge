import '../theme/index.css'
import { genericLayerText } from '../../core/css/cssVarBuilder'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import BaseColorsGrid from './BaseColorsGrid'
import ElementsModalDemo from './ElementsModalDemo'

export default function CorePropertiesPage() {
  const { mode } = useThemeMode()


  
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica_brand_layer_0_properties_surface)`, color: `var(--recursica_brand_layer_0_elements_text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica_brand_dimensions_general_xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 id="theme-mode-label" style={{ 
            margin: 0,
            fontFamily: 'var(--recursica_brand_typography_h1-font-family)',
            fontSize: 'var(--recursica_brand_typography_h1-font-size)',
            fontWeight: 'var(--recursica_brand_typography_h1-font-weight)',
            letterSpacing: 'var(--recursica_brand_typography_h1-font-letter-spacing)',
            lineHeight: 'var(--recursica_brand_typography_h1-line-height)',
            color: `var(${genericLayerText(0, 'color')})`,
          }}>Core Properties</h1>
        </div>

        <div className="section" style={{ marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)', display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_gutters_vertical)' }}>
          <BaseColorsGrid />

          <ElementsModalDemo />
        </div>

        <ColorTokenPicker />

        <OpacityPicker />

        <PaletteSwatchPicker />
      </div>
    </div>
  )
}
