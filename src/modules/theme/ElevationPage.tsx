import './index.css'
import { useState } from 'react'
import EffectTokens from '../tokens/EffectTokens'

export default function ElevationPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Elevation</h2>
            <button
              onClick={() => setIsPanelOpen(true)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'transparent', cursor: 'pointer' }}
            >Edit Tokens</button>
          </div>
          <div className="elevation-grid">
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-0-x-axis) var(--elevation-elevation-0-y-axis) var(--elevation-elevation-0-blur) var(--elevation-elevation-0-spread) var(--elevation-elevation-0-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>0</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-1-x-axis) var(--elevation-elevation-1-y-axis) var(--elevation-elevation-1-blur) var(--elevation-elevation-1-spread) var(--elevation-elevation-1-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>1</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-2-x-axis) var(--elevation-elevation-2-y-axis) var(--elevation-elevation-2-blur) var(--elevation-elevation-2-spread) var(--elevation-elevation-2-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>2</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-3-x-axis) var(--elevation-elevation-3-y-axis) var(--elevation-elevation-3-blur) var(--elevation-elevation-3-spread) var(--elevation-elevation-3-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>3</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-4-x-axis) var(--elevation-elevation-4-y-axis) var(--elevation-elevation-4-blur) var(--elevation-elevation-4-spread) var(--elevation-elevation-4-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>4</span>
            </div>
          </div>
        </div>
        <div
          aria-hidden={!isPanelOpen}
          style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'clamp(200px, 30vw, 500px)', background: 'var(--layer-layer-0-property-surface)', borderLeft: '1px solid var(--layer-layer-1-property-border-color)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease', zIndex: 1000, padding: 12, overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Effect Tokens</div>
            <button onClick={() => setIsPanelOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>&times;</button>
          </div>
          <EffectTokens />
        </div>
      </div>
    </div>
  )
}

