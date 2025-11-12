import { useState } from 'react'
import OpacityTokens from './opacity/OpacityTokens'
import SizeTokens from './size/SizeTokens'
import FontFamiliesTokens from './font/FontFamiliesTokens'
import FontLetterSpacingTokens from './font/FontLetterSpacingTokens'
import FontLineHeightTokens from './font/FontLineHeightTokens'
import FontSizeTokens from './font/FontSizeTokens'
import FontWeightTokens from './font/FontWeightTokens'
import ColorTokens from './colors/ColorTokens'

export default function TokensPage() {
  const [selected, setSelected] = useState<'color' | 'font' | 'opacity' | 'size'>('color')

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Tokens</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
        <nav style={{ alignSelf: 'start', position: 'sticky', top: 8 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              { key: 'color', label: 'Color' },
              { key: 'font', label: 'Font' },
              { key: 'opacity', label: 'Opacity' },
              { key: 'size', label: 'Size' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSelected(item.key as any)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)',
                  background: selected === (item.key as any)
                    ? 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color, var(--recursica-brand-light-palettes-core-interactive, #3b82f6))'
                    : 'transparent',
                  color: selected === (item.key as any) ? '#fff' : 'inherit',
                  cursor: 'pointer'
                }}
              >{item.label}</button>
            ))}
          </div>
        </nav>
        <div style={{ display: 'grid', gap: 12 }}>
          {selected === 'color' && <ColorTokens />}
          {selected === 'font' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <FontFamiliesTokens />
              <FontSizeTokens />
              <FontWeightTokens />
              <FontLetterSpacingTokens />
              <FontLineHeightTokens />
            </div>
          )}
          {selected === 'opacity' && (
            <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface, #ffffff)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, padding: 12 }}>
              <OpacityTokens />
            </section>
          )}
          {selected === 'size' && (
            <section style={{ background: 'var(--recursica-brand-light-layer-layer-0-property-surface, #ffffff)', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color, rgba(0,0,0,0.1))', borderRadius: 8, padding: 12 }}>
              <SizeTokens />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}


