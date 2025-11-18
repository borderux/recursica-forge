import { createPortal } from 'react-dom'
import { useVars } from '../vars/VarsContext'

export type InteractiveHoverModalProps = {
  open: boolean
  newInteractiveHex: string
  onClose: () => void
  onSelect: (option: 'keep' | 'darker' | 'lighter') => void
}

export function InteractiveHoverModal({
  open,
  newInteractiveHex,
  onClose,
  onSelect,
}: InteractiveHoverModalProps) {
  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--recursica-brand-light-palettes-core-black) 50%, transparent)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--recursica-brand-light-layer-layer-2-property-surface)',
          color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color)',
          border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color)',
          borderRadius: 12,
          boxShadow: 'var(--recursica-brand-light-elevations-elevation-2-x-axis) var(--recursica-brand-light-elevations-elevation-2-y-axis) var(--recursica-brand-light-elevations-elevation-2-blur) var(--recursica-brand-light-elevations-elevation-2-spread) var(--recursica-brand-light-elevations-elevation-2-shadow-color)',
          padding: 24,
          display: 'grid',
          gap: 16,
          width: 400,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Update Interactive Hover State</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              padding: 0,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ fontSize: 14, opacity: 0.8 }}>
          How would you like to handle the hover state color?
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <button
            onClick={() => onSelect('keep')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color)',
              background: 'var(--recursica-brand-light-layer-layer-2-property-surface)',
              color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color)',
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Don't change it</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Keep current hover color</span>
          </button>

          <button
            onClick={() => onSelect('darker')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color)',
              background: 'var(--recursica-brand-light-layer-layer-2-property-surface)',
              color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color)',
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>One step darker</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Make hover darker than interactive</span>
          </button>

          <button
            onClick={() => onSelect('lighter')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--recursica-brand-light-layer-layer-2-property-border-color)',
              background: 'var(--recursica-brand-light-layer-layer-2-property-surface)',
              color: 'var(--recursica-brand-light-layer-layer-2-property-element-text-color)',
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>One step lighter</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Make hover lighter than interactive</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

