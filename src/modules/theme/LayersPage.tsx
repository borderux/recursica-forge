import './index.css'
import LayerModule from './LayerModule'

export default function LayersPage() {
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <h2>Layers</h2>
          <LayerModule level={0} title="Layer 0 (Background)">
            <LayerModule level={1} title="Layer 1">
              <LayerModule level={2} title="Layer 2">
                <LayerModule level={3} title="Layer 3" />
              </LayerModule>
            </LayerModule>
          </LayerModule>
        </div>

        <div className="section">
          <h2>Alternative Layers</h2>
          <div className="alt-layers-wrapper">
            <LayerModule alternativeKey="high-contrast" title="High Contrast" className="card alt-layer-card" />
            <LayerModule alternativeKey="primary-color" title="Primary Color" className="card alt-layer-card" />
            <LayerModule alternativeKey="alert" title="Alert" className="card alt-layer-card" />
            <LayerModule alternativeKey="warning" title="Warning" className="card alt-layer-card" />
            <LayerModule alternativeKey="success" title="Success" className="card alt-layer-card" />
          </div>
        </div>
      </div>
    </div>
  )
}


