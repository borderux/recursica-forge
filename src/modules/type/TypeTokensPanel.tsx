import FontFamiliesTokens from '../tokens/font/FontFamiliesTokens'
import FontSizeTokens from '../tokens/font/FontSizeTokens'
import FontWeightTokens from '../tokens/font/FontWeightTokens'
import FontLetterSpacingTokens from '../tokens/font/FontLetterSpacingTokens'
import FontLineHeightTokens from '../tokens/font/FontLineHeightTokens'
import { createPortal } from 'react-dom'
import { Panel } from '../../components/adapters/Panel'

export default function TypeTokensPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return createPortal(
    <Panel
      overlay
      position="right"
      title="Font Tokens"
      onClose={onClose}
      width="400px"
      zIndex={10000}
      layer="layer-0"
      style={{
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
      }}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <FontFamiliesTokens />
        <FontSizeTokens />
        <FontWeightTokens />
        <FontLetterSpacingTokens />
        <FontLineHeightTokens />
      </div>
    </Panel>,
    document.body
  )
}
