import FontFamiliesTokens from '../tokens/FontFamiliesTokens'
import FontSizeTokens from '../tokens/FontSizeTokens'
import FontWeightTokens from '../tokens/FontWeightTokens'
import FontLetterSpacingTokens from '../tokens/FontLetterSpacingTokens'
import FontLineHeightTokens from '../tokens/FontLineHeightTokens'
import { createPortal } from 'react-dom'

export default function TypeTokensPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return createPortal(
    <div
      aria-hidden={!open}
      style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: 'var(--layer-layer-0-property-surface, #ffffff)', borderLeft: '1px solid var(--layer-layer-1-property-border-color, rgba(0,0,0,0.1))', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 9999, padding: 12, overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Font Tokens</div>
        <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
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


