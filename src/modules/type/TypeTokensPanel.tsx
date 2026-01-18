import FontFamiliesTokens from '../tokens/font/FontFamiliesTokens'
import FontSizeTokens from '../tokens/font/FontSizeTokens'
import FontWeightTokens from '../tokens/font/FontWeightTokens'
import FontLetterSpacingTokens from '../tokens/font/FontLetterSpacingTokens'
import FontLineHeightTokens from '../tokens/font/FontLineHeightTokens'
import { createPortal } from 'react-dom'
import { useThemeMode } from '../theme/ThemeModeContext'
import { Button } from '../../components/adapters/Button'

export default function TypeTokensPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode } = useThemeMode()
  const layer0Base = `--recursica-brand-themes-${mode}-layer-layer-0-property`
  return createPortal(
    <div
      aria-hidden={!open}
      style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: `var(--recursica-brand-themes-${mode}-layer-layer-1-property-surface)`, borderLeft: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, boxShadow: `var(--recursica-brand-themes-${mode}-elevations-elevation-3-shadow-color)`, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 10000, padding: 12, overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ 
          margin: 0,
          fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
          fontSize: 'var(--recursica-brand-typography-h2-font-size)',
          fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
          letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
          lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
          color: `var(${layer0Base}-element-text-color)`,
        }}>Font Tokens</h2>
        <Button onClick={onClose} variant="text" layer="layer-1" aria-label="Close">&times;</Button>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <FontFamiliesTokens />
        <FontSizeTokens />
        <FontWeightTokens />
        <FontLetterSpacingTokens />
        <FontLineHeightTokens />
      </div>
    </div>,
    document.body
  )
}


