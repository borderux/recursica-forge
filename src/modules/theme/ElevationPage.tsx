import './index.css'

export default function ElevationPage() {
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <h2>Elevation</h2>
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
      </div>
    </div>
  )
}


