import React from 'react'
import { Button } from '../../components/adapters/Button'
import { Switch } from '../../components/adapters/Switch'
import { Avatar } from '../../components/adapters/Avatar'
import { Toast } from '../../components/adapters/Toast'
import { Label } from '../../components/adapters/Label'
import { Breadcrumb } from '../../components/adapters/Breadcrumb'
import { toCssVarName, getComponentCssVar } from '../../components/utils/cssVarNames'

type LayerOption = 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'

export type Section = {
  name: string
  url: string
  render: (selectedLayers: Set<LayerOption>) => JSX.Element
}

// Sort layers: standard layers 0-3
export function sortLayers(layers: LayerOption[]): LayerOption[] {
  const standardLayers: LayerOption[] = ['layer-0', 'layer-1', 'layer-2', 'layer-3']
  
  const sorted: LayerOption[] = []
  
  // Add standard layers in order
  for (const layer of standardLayers) {
    if (layers.includes(layer)) {
      sorted.push(layer)
    }
  }
  
  return sorted
}

export function getComponentSections(mode: 'light' | 'dark'): Section[] {
  // Define SwitchExamples inside getComponentSections to have access to mode
  function SwitchExamples({ layer, colorVariant = 'default', sizeVariant = 'default' }: { layer: string; colorVariant?: string; sizeVariant?: string }) {
    const [checked1, setChecked1] = React.useState(true)
    const [checked2, setChecked2] = React.useState(false)
    const [checked3, setChecked3] = React.useState(false)
    
    // Get the label-switch-gap CSS var - it's at the component level, not under size/variant
    // Use getComponentCssVar with any category since it will detect component-level properties
    const labelSwitchGapVar = React.useMemo(() => {
      return getComponentCssVar('Switch', 'size', 'label-switch-gap', undefined)
    }, [])
    
    // Build layer text color CSS variables
    const layerTextColorVars = React.useMemo(() => {
      const layerBase = `--recursica-brand-${mode}-layer-${layer}-property`
      
      return {
        textColor: `${layerBase}-element-text-color`,
        highEmphasis: `${layerBase}-element-text-high-emphasis`,
        lowEmphasis: `${layerBase}-element-text-low-emphasis`,
      }
    }, [layer, mode])
    
    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked1} onChange={setChecked1} layer={layer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.highEmphasis})`,
          }}>On</span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked2} onChange={setChecked2} layer={layer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.highEmphasis})`,
          }}>Off</span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: `var(${labelSwitchGapVar}, 8px)` }}>
          <Switch checked={checked3} onChange={setChecked3} disabled layer={layer} colorVariant={colorVariant} sizeVariant={sizeVariant} />
          <span style={{
            color: `var(${layerTextColorVars.textColor})`,
            opacity: `var(${layerTextColorVars.lowEmphasis})`,
          }}>Disabled</span>
        </label>
      </div>
    )
  }
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
      render: (selectedLayers) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Avatar
              colorVariant="text-ghost"
              sizeVariant="default"
              layer={layer as any}
              shape="circle"
              fallback="AB"
            />
          </div>
        )
      },
    },
    {
      name: 'Badge',
      url: `${base}/badge`,
      render: (_selectedLayers) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>New</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-warning)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Warn</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-success)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Success</span>
        </div>
      ),
    },
    {
      name: 'Breadcrumb',
      url: `${base}/breadcrumb`,
      render: (selectedLayers) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Breadcrumb
              items={[
                { label: 'Home', href: '#' },
                { label: 'Category', href: '#' },
                { label: 'Current Page' },
              ]}
              separator="slash"
              showHomeIcon={true}
              layer={layer as any}
            />
          </div>
        )
      },
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
              const layerBase = `--recursica-brand-${mode}-layer-${layer}-property`
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
      name: 'Label',
      url: `${base}/label`,
      render: (selectedLayers) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Label variant="default" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-1">
              Label
            </Label>
            <Label variant="required" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-2">
              Label
            </Label>
            <Label variant="optional" layout="stacked" align="left" layer={layer as any} htmlFor="label-example-3">
              Label
            </Label>
          </div>
        )
      },
    },
    {
      name: 'Link',
      url: `${base}/link`,
      render: (_selectedLayers) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="#">Default link</a>
          <a href="#" style={{ opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }} aria-disabled>Disabled link</a>
        </div>
      ),
    },
    {
      name: 'Loader',
      url: `${base}/loader`,
      render: (_selectedLayers) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 16, height: 16, border: `2px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderTopColor: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
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
        <ul style={{ listStyle: 'none', padding: 8, margin: 0, width: 200, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 8 }}>
          <li style={{ padding: 8 }}>Profile</li>
          <li style={{ padding: 8 }}>Settings</li>
          <li style={{ padding: 8, opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}>Disabled</li>
        </ul>
      ),
    },
    {
      name: 'Menu',
      url: `${base}/menu`,
      render: (selectedLayers) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { Menu } = require('../../components/adapters/Menu')
        const { MenuItem } = require('../../components/adapters/MenuItem')
        const { iconNameToReactComponent } = require('../components/iconUtils')
        const ChevronRightIcon = iconNameToReactComponent('arrow-right')
        const FileIcon = iconNameToReactComponent('document-text')
        
        return (
          <Menu layer={layer as any}>
            <MenuItem
              variant="default"
              layer={layer as any}
              leadingIconType="none"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="selected"
              layer={layer as any}
              leadingIcon={FileIcon ? <FileIcon /> : undefined}
              leadingIconType="icon"
              supportingText="Supporting value"
              selected={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="disabled"
              layer={layer as any}
              disabled={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
          </Menu>
        )
      },
    },
    {
      name: 'Menu item',
      url: `${base}/menu-item`,
      render: (selectedLayers) => {
        const layer = Array.from(selectedLayers)[0] || 'layer-0'
        const { MenuItem } = require('../../components/adapters/MenuItem')
        const { iconNameToReactComponent } = require('../components/iconUtils')
        const ChevronRightIcon = iconNameToReactComponent('arrow-right')
        
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 4,
            width: '100%',
            maxWidth: '464px',
            padding: '8px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}>
            <MenuItem
              variant="default"
              layer={layer as any}
              leadingIconType="none"
              trailingIcon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="selected"
              layer={layer as any}
              leadingIconType="icon"
              supportingText="Supporting value"
              selected={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
            <MenuItem
              variant="disabled"
              layer={layer as any}
              disabled={true}
              divider="bottom"
            >
              Menu item
            </MenuItem>
          </div>
        )
      },
    },
    {
      name: 'Modal',
      url: `${base}/modal`,
      render: (_selectedLayers) => (
        <div style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, padding: 12, borderRadius: 8, background: `var(--recursica-brand-themes-${mode}-layer-layer-0-property-surface)` }}>
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
          <div style={{ width: 240, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 8, padding: 12 }}>
            <strong>Card Title</strong>
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses elevation 1.</p>
            <a href="#" style={{ fontSize: 12 }}>Learn more</a>
          </div>
          <div style={{ width: 240, border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 8, padding: 12, boxShadow: `0 8px 16px var(--recursica-brand-themes-${mode}-elevations-elevation-2-shadow-color)` }}>
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
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 999, padding: '2px 10px' }}>Default Chip</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 999, padding: '2px 10px', cursor: 'pointer' }}>Clickable</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-layer-layer-1-property-border-color)`, borderRadius: 999, padding: '2px 10px' }}>Deletable ✕</span>
          <span style={{ background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, borderRadius: 999, padding: '2px 10px' }}>Primary</span>
          <span style={{ border: `1px solid var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, borderRadius: 999, padding: '2px 10px' }}>Secondary Outlined</span>
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
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}>
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
            <button key={p} style={{ padding: '4px 8px', borderRadius: 6, background: p === 2 ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)` : undefined, color: p === 2 ? `var(--recursica-brand-themes-${mode}-palettes-core-white)` : undefined }}>{p}</button>
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
          <label style={{ opacity: `var(--recursica-brand-themes-${mode}-state-disabled, 0.5)` }}><input type="radio" name="r1" disabled /> Disabled</label>
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
          <button style={{ padding: '6px 10px', background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, border: 0 }}>First</button>
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
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 1 ? `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)` : `var(--recursica-brand-themes-${mode}-palettes-neutral-300-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      name: 'Switch',
      url: `${base}/switch`,
      render: (selectedLayers) => {
        // Extract layer from selectedLayers Set (use first one, or default to layer-0)
        const layer = selectedLayers.size > 0 
          ? Array.from(selectedLayers)[0] as string
          : 'layer-0'
        
        // Use default variants - the toolbar will update the CSS vars for the selected variant
        return <SwitchExamples layer={layer} colorVariant="default" sizeVariant="default" />
      },
    },
    {
      name: 'Tabs',
      url: `${base}/tabs`,
      render: (_selectedLayers) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ padding: '6px 10px', borderRadius: 999, background: `var(--recursica-brand-themes-${mode}-palettes-core-interactive-default-tone)`, color: `var(--recursica-brand-themes-${mode}-palettes-core-white)`, border: 0 }}>Active</button>
          <button style={{ padding: '6px 10px', borderRadius: 999 }}>Default</button>
          <button style={{ padding: '6px 10px', borderRadius: 999, opacity: `var(--recursica-brand-${mode}-opacity-disabled, 0.5)` }}>Disabled</button>
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
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--layer-palettes-core-success)' : 'var(--layer-palettes-core-interactive-default-tone)' }} />
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
      render: (selectedLayers) => {
        const layers = sortLayers(Array.from(selectedLayers))
        const layer = layers[0] || 'layer-0'
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 600 }}>
            <Toast variant="default" layer={layer as any}>
              Default toast message
            </Toast>
            <Toast variant="success" layer={layer as any} icon={<span>✓</span>} onClose={() => {}}>
              Success toast message
            </Toast>
            <Toast variant="error" layer={layer as any} icon={<span>✕</span>} onClose={() => {}}>
              Error toast message
            </Toast>
          </div>
        )
      },
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
}
