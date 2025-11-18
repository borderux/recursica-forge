import { useMemo, useState } from 'react'
import { Button } from '../../components/adapters/Button'
import uikitJson from '../../vars/UIKit.json'
import ComponentCssVarsPanel from './ComponentCssVarsPanel'
import { useVars } from '../vars/VarsContext'

type LayerOption = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3' | 'layer-alternative-high-contrast' | 'layer-alternative-primary-color' | 'layer-alternative-alert' | 'layer-alternative-warning' | 'layer-alternative-success'

type Section = {
  name: string
  url: string
  render: (selectedLayers: Set<LayerOption>) => JSX.Element
  isMapped?: boolean
}

// Sort layers: standard layers 0-3 first, then alternative layers
function sortLayers(layers: LayerOption[]): LayerOption[] {
  const standardLayers: LayerOption[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
  const alternativeLayers: LayerOption[] = [
    'layer-alternative-high-contrast',
    'layer-alternative-primary-color',
    'layer-alternative-alert',
    'layer-alternative-warning',
    'layer-alternative-success'
  ]
  
  const sorted: LayerOption[] = []
  
  // Add standard layers in order
  for (const layer of standardLayers) {
    if (layers.includes(layer)) {
      sorted.push(layer)
    }
  }
  
  // Add alternative layers in order
  for (const layer of alternativeLayers) {
    if (layers.includes(layer)) {
      sorted.push(layer)
    }
  }
  
  return sorted
}

// Layer section component - renders a single layer's content with that layer's styling
const LayerSection = ({ layer, children }: { layer: LayerOption; children: React.ReactNode }) => {
  const { theme } = useVars()
  const isAlternativeLayer = layer.startsWith('layer-alternative-')
  const layerBase = isAlternativeLayer
    ? `--recursica-brand-light-layer-layer-alternative-${layer.replace('layer-alternative-', '')}-property`
    : `--recursica-brand-light-layer-${layer}-property`
  
  // For layer-0, no border; for other layers, use border-color
  const hasBorder = !isAlternativeLayer && layer !== 'layer-0'
  
  // Get elevation level from layer spec
  const elevationLevel = useMemo(() => {
    if (isAlternativeLayer) {
      // Alternative layers typically don't have elevation, use elevation-0
      return '0'
    }
    try {
      const root: any = (theme as any)?.brand ? (theme as any).brand : theme
      const themes = root?.themes || root
      const layerId = layer.replace('layer-', '')
      const layerSpec: any = themes?.light?.layers?.[layer] || themes?.light?.layer?.[layer] || root?.light?.layers?.[layer] || root?.light?.layer?.[layer] || {}
      const v: any = layerSpec?.property?.elevation?.$value
      if (typeof v === 'string') {
        // Match both old format (brand.light.elevations.elevation-X) and new format (brand.themes.light.elevations.elevation-X)
        const m = v.match(/elevations\.(elevation-(\d+))/i)
        if (m) return m[2]
      }
    } catch {}
    // Default to layer number if elevation not found
    return layer.replace('layer-', '')
  }, [theme, layer, isAlternativeLayer])
  
  // Construct box-shadow CSS variable using elevation
  const boxShadow = `var(--recursica-brand-light-elevations-elevation-${elevationLevel}-x-axis, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-y-axis, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-blur, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-spread, 0px) var(--recursica-brand-light-elevations-elevation-${elevationLevel}-shadow-color, var(--recursica-tokens-color-gray-1000))`
  
  const layerLabel = layer.startsWith('layer-alternative-') 
    ? layer.replace('layer-alternative-', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : layer.replace('layer-', 'Layer ')
  
  return (
    <div style={{ 
      background: `var(${layerBase}-surface)`, 
      border: hasBorder ? `1px solid var(${layerBase}-border-color)` : undefined,
      borderRadius: hasBorder ? `var(${layerBase}-border-radius, 8px)` : 8,
      padding: `var(${layerBase}-padding, 12px)`,
      boxShadow: boxShadow
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontFamily: 'var(--recursica-brand-typography-h4-font-family)',
        fontSize: 'var(--recursica-brand-typography-h4-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h4-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h4-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h4-line-height)',
        color: `var(${layerBase}-element-text-color)` 
      }}>{layerLabel}</h4>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </div>
  )
}

// Component section - renders a component with header and all layer groups
const ComponentSection = ({ title, url, children, onEditCssVars, selectedLayers }: { title: string; url: string; children: (selectedLayers: Set<LayerOption>) => React.ReactNode; onEditCssVars: () => void; selectedLayers: Set<LayerOption> }) => {
  const layers = sortLayers(Array.from(selectedLayers))
  const layer0Base = '--recursica-brand-light-layer-layer-0-property'
  
  return (
    <section style={{ 
      background: `var(${layer0Base}-surface)`, 
      border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', 
      borderRadius: 8, 
      padding: 16,
      display: 'grid',
      gap: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ 
            margin: 0, 
            fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
            fontSize: 'var(--recursica-brand-typography-h2-font-size)',
            fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
            letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
            lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
            color: `var(${layer0Base}-element-text-color)` 
          }}>{title}</h2>
          <button
            onClick={onEditCssVars}
            aria-label="Edit CSS Variables"
            style={{
              fontSize: 14,
              color: `var(${layer0Base}-element-interactive-color)`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, textDecoration: 'none', color: `var(${layer0Base}-element-interactive-color)` }}>Docs →</a>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {layers.map((layer) => (
          <LayerSection key={layer} layer={layer}>
            {children(new Set([layer]))}
          </LayerSection>
        ))}
      </div>
    </section>
  )
}

export default function PreviewPage() {
  const [showUnmapped, setShowUnmapped] = useState(false)
  const [editingComponent, setEditingComponent] = useState<string | null>(null)

  // Close panel when mode changes
  useEffect(() => {
    const handleCloseAll = () => {
      setEditingComponent(null)
    }
    window.addEventListener('closeAllPickersAndPanels', handleCloseAll)
    return () => window.removeEventListener('closeAllPickersAndPanels', handleCloseAll)
  }, [])
  const [selectedLayers, setSelectedLayers] = useState<Set<LayerOption>>(new Set(['layer-0']))
  
  // Get list of mapped components from UIKit.json
  const mappedComponents = useMemo(() => {
    const components = (uikitJson as any)?.['ui-kit']?.components || {}
    return new Set(Object.keys(components).map(name => {
      // Convert "button" -> "Button", "text-field" -> "Text field", etc.
      return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))
  }, [])
  
  const sections: Section[] = useMemo(() => {
    const base = 'https://www.recursica.com/docs/components'
    return [
      {
        name: 'Accordion',
        url: `${base}/accordion`,
        render: (_selectedLayers) => (
          <div>
            <details open>
              <summary>Open Accordion</summary>
              <div style={{ padding: 8 }}>Content</div>
            </details>
            <details>
              <summary>Closed Accordion</summary>
              <div style={{ padding: 8 }}>Content</div>
            </details>
          </div>
        ),
      },
      {
        name: 'Avatar',
        url: `${base}/avatar`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--palette-neutral-300-tone)' }} />
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--palette-neutral-300-tone)' }} />
          </div>
        ),
      },
      {
        name: 'Badge',
        url: `${base}/badge`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>New</span>
            <span style={{ background: 'var(--recursica-brand-light-layer-layer-alternative-warning-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Warn</span>
            <span style={{ background: 'var(--recursica-brand-light-layer-layer-alternative-success-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Success</span>
          </div>
        ),
      },
      {
        name: 'Breadcrumb',
        url: `${base}/breadcrumb`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <a href="#">Home</a>
            <span>/</span>
            <a href="#">Library</a>
            <span>/</span>
            <span style={{ opacity: 0.7 }}>Data</span>
          </div>
        ),
      },
      {
        name: 'Button',
        url: `${base}/button`,
        render: (selectedLayers) => {
          const variants: Array<'solid' | 'outline' | 'text'> = ['solid', 'outline', 'text']
          const sizes: Array<'default' | 'small'> = ['default', 'small']
          const layers: LayerOption[] = sortLayers(Array.from(selectedLayers))
          
          return (
            <div style={{ display: 'grid', gap: 16 }}>
              {layers.map((layer) => {
                // Build CSS variable names for this layer's text color with high emphasis
                const isAlternativeLayer = layer.startsWith('layer-alternative-')
                const layerBase = isAlternativeLayer
                  ? `--recursica-brand-light-layer-layer-alternative-${layer.replace('layer-alternative-', '')}-property`
                  : `--recursica-brand-light-layer-${layer}-property`
                const textColorVar = `${layerBase}-element-text-color`
                const highEmphasisVar = `${layerBase}-element-text-high-emphasis`
                
                return (
                  <div key={layer} style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {variants.map((variant) => (
                        <div key={variant} style={{ display: 'grid', gap: 8 }}>
                          <h5 style={{ 
                            margin: 0, 
                            fontFamily: 'var(--recursica-brand-typography-h5-font-family)',
                            fontSize: 'var(--recursica-brand-typography-h5-font-size)',
                            fontWeight: 'var(--recursica-brand-typography-h5-font-weight)',
                            letterSpacing: 'var(--recursica-brand-typography-h5-font-letter-spacing)',
                            lineHeight: 'var(--recursica-brand-typography-h5-line-height)',
                            color: `var(${textColorVar})`,
                            opacity: `var(${highEmphasisVar})`,
                            textTransform: 'capitalize'
                          }}>{variant}</h5>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {sizes.map((size) => (
                              <Button 
                                key={`${variant}-${size}`}
                                variant={variant}
                                size={size}
                                layer={layer}
                              >
                                {variant} {size}
                              </Button>
                            ))}
                            {sizes.map((size) => (
                              <Button 
                                key={`${variant}-${size}-icon`}
                                variant={variant}
                                size={size}
                                layer={layer}
                                icon={
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5l7 7-7 7"></path>
                                  </svg>
                                }
                              >
                                {variant} {size}
                              </Button>
                            ))}
                            <Button 
                              variant={variant}
                              layer={layer}
                              disabled
                            >
                              {variant} disabled
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        },
      },
      {
        name: 'Date picker',
        url: `${base}/date-picker`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" />
            <input type="date" disabled />
          </div>
        ),
      },
      {
        name: 'Dropdown',
        url: `${base}/dropdown`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <select>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
            <select disabled>
              <option>Disabled</option>
            </select>
          </div>
        ),
      },
      {
        name: 'File input',
        url: `${base}/file-input`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" />
            <input type="file" multiple />
          </div>
        ),
      },
      {
        name: 'File upload',
        url: `${base}/file-upload`,
        render: (_selectedLayers) => (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ border: '1px dashed var(--layer-layer-1-property-border-color)', padding: 16, borderRadius: 8, textAlign: 'center' }}>Drag & drop files here</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Max 10MB each</div>
          </div>
        ),
      },
      {
        name: 'Hover card',
        url: `${base}/hover-card`,
        render: (_selectedLayers) => (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span title="Extra information appears on hover" style={{ textDecoration: 'underline', cursor: 'help' }}>Hover me</span>
          </div>
        ),
      },
      {
        name: 'Link',
        url: `${base}/link`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#">Default link</a>
            <a href="#" style={{ opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }} aria-disabled>Disabled link</a>
          </div>
        ),
      },
      {
        name: 'Loader',
        url: `${base}/loader`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderTopColor: 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>
              {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
            </style>
            <span>Loading…</span>
          </div>
        ),
      },
      {
        name: 'Menu',
        url: `${base}/menu`,
        render: (_selectedLayers) => (
          <ul style={{ listStyle: 'none', padding: 8, margin: 0, width: 200, border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8 }}>
            <li style={{ padding: 8 }}>Profile</li>
            <li style={{ padding: 8 }}>Settings</li>
            <li style={{ padding: 8, opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>Disabled</li>
          </ul>
        ),
      },
      {
        name: 'Modal',
        url: `${base}/modal`,
        render: (_selectedLayers) => (
          <div style={{ border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', padding: 12, borderRadius: 8, background: 'var(--recursica-brand-light-layer-layer-0-property-surface)' }}>
            <strong>Modal</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Header, body, actions</div>
          </div>
        ),
      },
      {
        name: 'Card',
        url: `${base}/card`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 240, border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
              <strong>Card Title</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses elevation 1.</p>
              <a href="#" style={{ fontSize: 12 }}>Learn more</a>
            </div>
            <div style={{ width: 240, border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 8, padding: 12, boxShadow: '0 8px 16px var(--recursica-brand-light-elevations-elevation-2-shadow-color)' }}>
              <strong>Higher Elevation</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses elevation 8.</p>
            </div>
          </div>
        ),
      },
      {
        name: 'Checkbox',
        url: `${base}/checkbox`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label><input type="checkbox" defaultChecked /> Checked</label>
            <label><input type="checkbox" /> Unchecked</label>
            <label><input type="checkbox" disabled /> Disabled</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" ref={(el) => { if (el) el.indeterminate = true }} /> Indeterminate
            </label>
          </div>
        ),
      },
      {
        name: 'Chip',
        url: `${base}/chip`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px' }}>Default Chip</span>
            <span style={{ border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px', cursor: 'pointer' }}>Clickable</span>
            <span style={{ border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px' }}>Deletable ✕</span>
            <span style={{ background: 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', borderRadius: 999, padding: '2px 10px' }}>Primary</span>
            <span style={{ border: '1px solid var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--recursica-brand-light-layer-layer-alternative-primary-color-property-element-interactive-color)', borderRadius: 999, padding: '2px 10px' }}>Secondary Outlined</span>
          </div>
        ),
      },
      {
        name: 'Divider',
        url: `${base}`,
        render: (_selectedLayers) => (
          <div>
            <div style={{ padding: 8 }}>Text above divider.</div>
            <hr />
            <div style={{ padding: 8 }}>Text below divider.</div>
          </div>
        ),
      },
      {
        name: 'List',
        url: `${base}`,
        render: (_selectedLayers) => (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: 300 }}>
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, marginBottom: 6 }}>
              <div>List item 1</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
            </li>
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, marginBottom: 6 }}>
              <div>List item 2</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
            </li>
              <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>
              Disabled item
            </li>
          </ul>
        ),
      },
      {
        name: 'Number input',
        url: `${base}/number-input`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" defaultValue={1} style={{ width: 120 }} />
            <input type="number" disabled value={5} style={{ width: 120 }} />
          </div>
        ),
      },
      {
        name: 'Pagination',
        url: `${base}/pagination`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button>{'<'}</button>
            {[1, 2, 3, 4, 5].map((p) => (
              <button key={p} style={{ padding: '4px 8px', borderRadius: 6, background: p === 2 ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : undefined, color: p === 2 ? 'var(--recursica-brand-light-palettes-core-white)' : undefined }}>{p}</button>
            ))}
            <button>{'>'}</button>
          </div>
        ),
      },
      {
        name: 'Panel',
        url: `${base}/panel`,
        render: (_selectedLayers) => (
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>Panel content</div>
        ),
      },
      {
        name: 'Popover',
        url: `${base}/popover`,
        render: (_selectedLayers) => (
          <div title="Popover content" style={{ display: 'inline-block', border: '1px solid var(--layer-layer-1-property-border-color)', padding: '6px 10px', borderRadius: 6, cursor: 'help' }}>Hover for popover</div>
        ),
      },
      {
        name: 'Radio',
        url: `${base}/radio`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label><input type="radio" name="r1" defaultChecked /> First</label>
            <label><input type="radio" name="r1" /> Second</label>
            <label style={{ opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}><input type="radio" name="r1" disabled /> Disabled</label>
          </div>
        ),
      },
      {
        name: 'Read-only field',
        url: `${base}/read-only-field`,
        render: (_selectedLayers) => (
          <div style={{ display: 'grid', gap: 8, width: 320 }}>
            <input value="Read-only value" readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
          </div>
        ),
      },
      {
        name: 'Search',
        url: `${base}/search`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search…" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <button>Go</button>
          </div>
        ),
      },
      {
        name: 'Segmented control',
        url: `${base}/segmented-control`,
        render: (_selectedLayers) => (
          <div style={{ display: 'inline-flex', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, overflow: 'hidden' }}>
            <button style={{ padding: '6px 10px', background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', border: 0 }}>First</button>
            <button style={{ padding: '6px 10px', border: 0 }}>Second</button>
            <button style={{ padding: '6px 10px', border: 0 }}>Third</button>
          </div>
        ),
      },
      {
        name: 'Slider',
        url: `${base}/slider`,
        render: (_selectedLayers) => (
          <input type="range" min={0} max={100} defaultValue={25} />
        ),
      },
      {
        name: 'Stepper',
        url: `${base}/stepper`,
        render: (_selectedLayers) => (
          <ol style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0 }}>
            {['One', 'Two', 'Three'].map((s, i) => (
              <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 1 ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'var(--palette-neutral-300-tone)', color: 'var(--recursica-brand-light-palettes-core-white)', display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ),
      },
      {
        name: 'Switch',
        url: `${base}/switch`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" defaultChecked /> On
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" /> Off
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>
              <input type="checkbox" disabled /> Disabled
            </label>
          </div>
        ),
      },
      {
        name: 'Tabs',
        url: `${base}/tabs`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--recursica-brand-light-palettes-core-white)', border: 0 }}>Active</button>
            <button style={{ padding: '6px 10px', borderRadius: 999 }}>Default</button>
            <button style={{ padding: '6px 10px', borderRadius: 999, opacity: 'var(--recursica-brand-light-opacity-disabled, 0.5)' }}>Disabled</button>
          </div>
        ),
      },
      {
        name: 'Text field',
        url: `${base}/text-field`,
        render: (_selectedLayers) => (
          <div style={{ display: 'grid', gap: 8, width: 320 }}>
            <input placeholder="Default" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <input placeholder="Disabled" disabled style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <textarea placeholder="Text area" rows={3} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
          </div>
        ),
      },
      {
        name: 'Time picker',
        url: `${base}/time-picker`,
        render: (_selectedLayers) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="time" />
            <input type="time" disabled />
          </div>
        ),
      },
      {
        name: 'Timeline',
        url: `${base}/timeline`,
        render: (_selectedLayers) => (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[['08:00', 'Start'], ['10:30', 'Checkpoint'], ['13:00', 'Finish']].map(([t, l], i) => (
              <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--layer-layer-alternative-success-property-element-interactive-color)' : 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' }} />
                <span style={{ width: 60, opacity: 0.7 }}>{t}</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        name: 'Toast',
        url: `${base}/toast`,
        render: (_selectedLayers) => (
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', padding: 12, borderRadius: 8, background: 'var(--layer-layer-alternative-success-property-surface)' }}>Success toast</div>
        ),
      },
      {
        name: 'Tooltip',
        url: `${base}/tooltip`,
        render: (_selectedLayers) => (
          <span title="Tooltip text" style={{ textDecoration: 'underline', cursor: 'help' }}>Hover for tooltip</span>
        ),
      },
      {
        name: 'Transfer list',
        url: `${base}/transfer-list`,
        render: (_selectedLayers) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <ul style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, padding: 8, margin: 0, listStyle: 'none' }}>
              <li>Alpha</li>
              <li>Bravo</li>
              <li>Charlie</li>
            </ul>
            <div style={{ display: 'grid', gap: 6 }}>
              <button>{'>'}</button>
              <button>{'<'}</button>
            </div>
            <ul style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, padding: 8, margin: 0, listStyle: 'none' }}>
              <li>Delta</li>
              <li>Echo</li>
            </ul>
          </div>
        ),
      },
    ]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(section => ({
        ...section,
        isMapped: mappedComponents.has(section.name)
      }))
  }, [mappedComponents])
  
  // Filter sections based on toggle
  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (section.isMapped) return true
      return showUnmapped
    })
  }, [sections, showUnmapped])
  
  const mappedCount = sections.filter(s => s.isMapped).length
  const unmappedCount = sections.filter(s => !s.isMapped).length

  const allLayers: LayerOption[] = [
    'layer-0',
    'layer-1',
    'layer-2',
    'layer-3',
    'layer-alternative-high-contrast',
    'layer-alternative-primary-color',
    'layer-alternative-alert',
    'layer-alternative-warning',
    'layer-alternative-success',
  ]

  const toggleLayer = (layer: LayerOption) => {
    setSelectedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) {
        next.delete(layer)
        // Ensure at least one layer is selected
        if (next.size === 0) {
          next.add('layer-0')
        }
      } else {
        next.add(layer)
      }
      return next
    })
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0 }}>UI Kit</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showUnmapped}
              onChange={(e) => setShowUnmapped(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14 }}>
              Show unmapped components ({unmappedCount})
            </span>
          </label>
        </div>
        <div style={{ 
          padding: 16, 
          background: 'var(--recursica-brand-light-layer-layer-0-property-surface)', 
          border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', 
          borderRadius: 8,
          display: 'grid',
          gap: 12
        }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Select Layers</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Standard Layers</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['layer-0', 'layer-1', 'layer-2', 'layer-3'].map((layer) => (
                  <label key={layer} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedLayers.has(layer as LayerOption)}
                      onChange={() => toggleLayer(layer as LayerOption)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13 }}>{layer.replace('layer-', 'Layer ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Alternative Layers</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['layer-alternative-high-contrast', 'layer-alternative-primary-color', 'layer-alternative-alert', 'layer-alternative-warning', 'layer-alternative-success'].map((layer) => {
                  const label = layer.replace('layer-alternative-', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <label key={layer} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedLayers.has(layer as LayerOption)}
                        onChange={() => toggleLayer(layer as LayerOption)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13 }}>{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {mappedCount > 0 && (
        <div style={{ fontSize: 14, color: 'var(--recursica-brand-light-layer-layer-0-element-text-low-emphasis)' }}>
          Showing {visibleSections.length} of {sections.length} components ({mappedCount} mapped)
        </div>
      )}
      {visibleSections.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--recursica-brand-light-layer-layer-0-element-text-low-emphasis)' }}>
          No components to display. {showUnmapped ? 'All components are mapped.' : 'Enable "Show unmapped components" to see all components.'}
        </div>
      ) : (
        visibleSections.map((s) => (
          <ComponentSection
            key={s.name}
            title={s.name}
            url={s.url}
            onEditCssVars={() => setEditingComponent(s.name)}
            selectedLayers={selectedLayers}
          >
            {s.render}
          </ComponentSection>
        ))
      )}
      <ComponentCssVarsPanel
        open={editingComponent !== null}
        componentName={editingComponent || ''}
        onClose={() => setEditingComponent(null)}
      />
    </div>
  )
}


