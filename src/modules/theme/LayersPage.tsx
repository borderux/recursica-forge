import './index.css'

export default function LayersPage() {
  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="section">
          <h2>Layers</h2>
          <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)', padding: 'var(--layer-layer-0-property-padding)' }}>
            <div className="layer-content">
              <div className="layer-text-samples">
                <h3>Layer 0 (Background)</h3>
                <p style={{ opacity: 'var(--layer-layer-0-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                <p style={{ opacity: 'var(--layer-layer-0-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-interactive-color)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-alert)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Alert</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-warning)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Warning</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-success)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Success</p>
              </div>

              <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-1-property-surface)', color: 'var(--layer-layer-1-property-element-text-color)', padding: 'var(--layer-layer-1-property-padding)', border: 'var(--layer-layer-1-property-border-thickness) solid var(--layer-layer-1-property-border-color)', borderRadius: 'var(--layer-layer-1-property-border-radius)' }}>
                <div className="layer-content">
                  <div className="layer-text-samples">
                    <h3>Layer 1</h3>
                    <p style={{ opacity: 'var(--layer-layer-1-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                    <p style={{ opacity: 'var(--layer-layer-1-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-interactive-color)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-alert)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Alert</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-warning)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Warning</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-success)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Success</p>
                  </div>

                  <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-2-property-surface)', color: 'var(--layer-layer-2-property-element-text-color)', padding: 'var(--layer-layer-2-property-padding)', border: 'var(--layer-layer-2-property-border-thickness) solid var(--layer-layer-2-property-border-color)', borderRadius: 'var(--layer-layer-2-property-border-radius)' }}>
                    <div className="layer-content">
                      <div className="layer-text-samples">
                        <h3>Layer 2</h3>
                        <p style={{ opacity: 'var(--layer-layer-2-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                        <p style={{ opacity: 'var(--layer-layer-2-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-interactive-color)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-alert)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Alert</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-warning)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Warning</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-success)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Success</p>
                      </div>

                      <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-3-property-surface)', color: 'var(--layer-layer-3-property-element-text-color)', padding: 'var(--layer-layer-3-property-padding)', border: 'var(--layer-layer-3-property-border-thickness) solid var(--layer-layer-3-property-border-color)', borderRadius: 'var(--layer-layer-3-property-border-radius)' }}>
                        <div className="layer-content">
                          <div className="layer-text-samples">
                            <h3>Layer 3</h3>
                            <p style={{ opacity: 'var(--layer-layer-3-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                            <p style={{ opacity: 'var(--layer-layer-3-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-interactive-color)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-alert)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Alert</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-warning)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Warning</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-success)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Success</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Alternative Layers</h2>
          <div className="alt-layers-wrapper">
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-high-contrast-property-surface)', color: 'var(--layer-layer-alternative-high-contrast-property-element-text-color)', padding: 'var(--layer-layer-alternative-high-contrast-property-padding)' }}>
              <h3>High Contrast</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-high-contrast-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-high-contrast-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-primary-color-property-surface)', color: 'var(--layer-layer-alternative-primary-color-property-element-text-color)', padding: 'var(--layer-layer-alternative-primary-color-property-padding)' }}>
              <h3>Primary Color</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-alert-property-surface)', color: 'var(--layer-layer-alternative-alert-property-element-text-color)', padding: 'var(--layer-layer-alternative-alert-property-padding)' }}>
              <h3>Alert</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-alert-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-alert-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-alert-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-alert-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-alert-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-warning-property-surface)', color: 'var(--layer-layer-alternative-warning-property-element-text-color)', padding: 'var(--layer-layer-alternative-warning-property-padding)' }}>
              <h3>Warning</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-warning-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-warning-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-warning-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-success-property-surface)', color: 'var(--layer-layer-alternative-success-property-element-text-color)', padding: 'var(--layer-layer-alternative-success-property-padding)' }}>
              <h3>Success</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-success-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-success-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-success-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-success-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-success-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


