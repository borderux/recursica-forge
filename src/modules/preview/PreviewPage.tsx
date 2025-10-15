import { useMemo } from 'react'

type Section = {
  name: string
  url: string
  render: () => JSX.Element
}

const SectionCard = ({ title, url, children }: { title: string; url: string; children: React.ReactNode }) => (
  <section style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, textDecoration: 'none', color: 'var(--layer-layer-1-property-element-interactive-color)' }}>Docs →</a>
    </div>
    <div style={{ display: 'grid', gap: 8 }}>{children}</div>
  </section>
)

export default function PreviewPage() {
  const sections: Section[] = useMemo(() => {
    const base = 'https://www.recursica.com/docs/components'
    return [
      {
        name: 'Accordion',
        url: `${base}`,
        render: () => (
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
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--palette-neutral-300-tone)' }} />
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--palette-neutral-300-tone)' }} />
          </div>
        ),
      },
      {
        name: 'Badge',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>New</span>
            <span style={{ background: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Warn</span>
            <span style={{ background: 'var(--layer-layer-alternative-success-property-element-interactive-color)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Success</span>
          </div>
        ),
      },
      {
        name: 'Breadcrumb',
        url: `${base}`,
        render: () => (
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
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button>Text</button>
            <button style={{ background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6 }}>Contained</button>
            <button style={{ border: '1px solid var(--layer-layer-1-property-border-color)', padding: '6px 10px', borderRadius: 6 }}>Outlined</button>
            <button disabled style={{ padding: '6px 10px', borderRadius: 6 }}>Disabled</button>
            <button style={{ background: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6 }}>Secondary</button>
          </div>
        ),
      },
      {
        name: 'Date picker',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" />
            <input type="date" disabled />
          </div>
        ),
      },
      {
        name: 'Dropdown',
        url: `${base}`,
        render: () => (
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
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" />
            <input type="file" multiple />
          </div>
        ),
      },
      {
        name: 'File upload',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ border: '1px dashed var(--layer-layer-1-property-border-color)', padding: 16, borderRadius: 8, textAlign: 'center' }}>Drag & drop files here</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Max 10MB each</div>
          </div>
        ),
      },
      {
        name: 'Hover card',
        url: `${base}`,
        render: () => (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span title="Extra information appears on hover" style={{ textDecoration: 'underline', cursor: 'help' }}>Hover me</span>
          </div>
        ),
      },
      {
        name: 'Link',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#">Default link</a>
            <a href="#" style={{ opacity: 0.6 }} aria-disabled>Disabled link</a>
          </div>
        ),
      },
      {
        name: 'Loader',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--layer-layer-1-property-border-color)', borderTopColor: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>
              {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
            </style>
            <span>Loading…</span>
          </div>
        ),
      },
      {
        name: 'Menu',
        url: `${base}`,
        render: () => (
          <ul style={{ listStyle: 'none', padding: 8, margin: 0, width: 200, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8 }}>
            <li style={{ padding: 8 }}>Profile</li>
            <li style={{ padding: 8 }}>Settings</li>
            <li style={{ padding: 8, opacity: 0.6 }}>Disabled</li>
          </ul>
        ),
      },
      {
        name: 'Modal',
        url: `${base}`,
        render: () => (
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', padding: 12, borderRadius: 8, background: 'var(--layer-layer-0-property-surface)' }}>
            <strong>Modal</strong>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Header, body, actions</div>
          </div>
        ),
      },
      {
        name: 'Card',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 240, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>
              <strong>Card Title</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses elevation 1.</p>
              <a href="#" style={{ fontSize: 12 }}>Learn more</a>
            </div>
            <div style={{ width: 240, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12, boxShadow: '0 8px 16px var(--elevation-elevation-2-shadow-color)' }}>
              <strong>Higher Elevation</strong>
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>This card uses elevation 8.</p>
            </div>
          </div>
        ),
      },
      {
        name: 'Checkbox',
        url: `${base}`,
        render: () => (
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
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px' }}>Default Chip</span>
            <span style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px', cursor: 'pointer' }}>Clickable</span>
            <span style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, padding: '2px 10px' }}>Deletable ✕</span>
            <span style={{ background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', borderRadius: 999, padding: '2px 10px' }}>Primary</span>
            <span style={{ border: '1px solid var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', borderRadius: 999, padding: '2px 10px' }}>Secondary Outlined</span>
          </div>
        ),
      },
      {
        name: 'Divider',
        url: `${base}`,
        render: () => (
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
        render: () => (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: 300 }}>
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, marginBottom: 6 }}>
              <div>List item 1</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
            </li>
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, marginBottom: 6 }}>
              <div>List item 2</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Secondary text</div>
            </li>
            <li style={{ padding: 10, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, opacity: 0.5 }}>
              Disabled item
            </li>
          </ul>
        ),
      },
      {
        name: 'Number input',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" defaultValue={1} style={{ width: 120 }} />
            <input type="number" disabled value={5} style={{ width: 120 }} />
          </div>
        ),
      },
      {
        name: 'Pagination',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button>{'<'}</button>
            {[1, 2, 3, 4, 5].map((p) => (
              <button key={p} style={{ padding: '4px 8px', borderRadius: 6, background: p === 2 ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : undefined, color: p === 2 ? '#fff' : undefined }}>{p}</button>
            ))}
            <button>{'>'}</button>
          </div>
        ),
      },
      {
        name: 'Panel',
        url: `${base}`,
        render: () => (
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>Panel content</div>
        ),
      },
      {
        name: 'Popover',
        url: `${base}`,
        render: () => (
          <div title="Popover content" style={{ display: 'inline-block', border: '1px solid var(--layer-layer-1-property-border-color)', padding: '6px 10px', borderRadius: 6, cursor: 'help' }}>Hover for popover</div>
        ),
      },
      {
        name: 'Radio',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label><input type="radio" name="r1" defaultChecked /> First</label>
            <label><input type="radio" name="r1" /> Second</label>
            <label style={{ opacity: 0.6 }}><input type="radio" name="r1" disabled /> Disabled</label>
          </div>
        ),
      },
      {
        name: 'Read-only field',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'grid', gap: 8, width: 320 }}>
            <input value="Read-only value" readOnly style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
          </div>
        ),
      },
      {
        name: 'Search',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search…" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <button>Go</button>
          </div>
        ),
      },
      {
        name: 'Segmented control',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'inline-flex', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 999, overflow: 'hidden' }}>
            <button style={{ padding: '6px 10px', background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', border: 0 }}>First</button>
            <button style={{ padding: '6px 10px', border: 0 }}>Second</button>
            <button style={{ padding: '6px 10px', border: 0 }}>Third</button>
          </div>
        ),
      },
      {
        name: 'Slider',
        url: `${base}`,
        render: () => (
          <input type="range" min={0} max={100} defaultValue={25} />
        ),
      },
      {
        name: 'Stepper',
        url: `${base}`,
        render: () => (
          <ol style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0 }}>
            {['One', 'Two', 'Three'].map((s, i) => (
              <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 1 ? 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)' : 'var(--palette-neutral-300-tone)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ),
      },
      {
        name: 'Switch',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" defaultChecked /> On
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" /> Off
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
              <input type="checkbox" disabled /> Disabled
            </label>
          </div>
        ),
      },
      {
        name: 'Tabs',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', color: '#fff', border: 0 }}>Active</button>
            <button style={{ padding: '6px 10px', borderRadius: 999 }}>Default</button>
            <button style={{ padding: '6px 10px', borderRadius: 999, opacity: 0.6 }}>Disabled</button>
          </div>
        ),
      },
      {
        name: 'Text field',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'grid', gap: 8, width: 320 }}>
            <input placeholder="Default" style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <input placeholder="Disabled" disabled style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
            <textarea placeholder="Text area" rows={3} style={{ padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
          </div>
        ),
      },
      {
        name: 'Time picker',
        url: `${base}`,
        render: () => (
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="time" />
            <input type="time" disabled />
          </div>
        ),
      },
      {
        name: 'Timeline',
        url: `${base}`,
        render: () => (
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
        url: `${base}`,
        render: () => (
          <div style={{ border: '1px solid var(--layer-layer-1-property-border-color)', padding: 12, borderRadius: 8, background: 'var(--layer-layer-alternative-success-property-surface)' }}>Success toast</div>
        ),
      },
      {
        name: 'Tooltip',
        url: `${base}`,
        render: () => (
          <span title="Tooltip text" style={{ textDecoration: 'underline', cursor: 'help' }}>Hover for tooltip</span>
        ),
      },
      {
        name: 'Transfer list',
        url: `${base}`,
        render: () => (
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
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Preview</h2>
      {sections.map((s) => (
        <SectionCard key={s.name} title={s.name} url={s.url}>
          {s.render()}
        </SectionCard>
      ))}
    </div>
  )
}


