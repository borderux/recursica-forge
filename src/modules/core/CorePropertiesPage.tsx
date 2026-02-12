import '../theme/index.css'
import { useThemeMode } from '../theme/ThemeModeContext'
import ColorTokenPicker from '../pickers/ColorTokenPicker'
import OpacityPicker from '../pickers/OpacityPicker'
import PaletteSwatchPicker from '../pickers/PaletteSwatchPicker'
import BaseColorsGrid from './BaseColorsGrid'
import ElementsModalDemo from './ElementsModalDemo'

export default function CorePropertiesPage() {
  const { mode } = useThemeMode()

  const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`
  
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: `var(--recursica-brand-themes-${mode}-layers-layer-0-properties-surface)`, color: `var(--recursica-brand-themes-${mode}-layers-layer-0-elements-text-color)` }}>
      <div className="container-padding" style={{ padding: 'var(--recursica-brand-dimensions-general-xl)' }}>
        <div className="header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 id="theme-mode-label" style={{ 
            margin: 0,
            fontFamily: 'var(--recursica-brand-typography-h1-font-family)',
            fontSize: 'var(--recursica-brand-typography-h1-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h1-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h1-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h1-line-height)',
            color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
          }}>Core Properties</h1>
        </div>

        <div className="section" style={{ marginTop: 'var(--recursica-brand-dimensions-gutters-vertical)', display: 'flex', flexDirection: 'column', gap: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
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
