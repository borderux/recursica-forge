import { useMemo, useState } from 'react'

export default function SamplesPage() {
  const [showModal, setShowModal] = useState(false)
  const data = useMemo(
    () => (
      Array.from({ length: 8 }).map((_, i) => ({
        id: i + 1,
        name: `Record ${i + 1}`,
        status: ['New', 'Active', 'Paused', 'Done'][i % 4],
        owner: ['Alex', 'Sam', 'Jordan', 'Riley'][i % 4],
      }))
    ),
    [],
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
      <aside style={{
        background: 'var(--layer-layer-1-property-surface)',
        border: '1px solid var(--layer-layer-1-property-border-color)',
        borderRadius: 'var(--layer-layer-1-property-border-radius)',
        padding: 'var(--layer-layer-1-property-padding)'
      }}>
        <nav style={{ display: 'grid', gap: 8 }}>
          <strong style={{ marginBottom: 8 }}>Navigation</strong>
          <a href="#" style={{ textDecoration: 'none', color: 'var(--layer-layer-1-property-element-interactive-color)' }}>Dashboard</a>
          <a href="#" style={{ textDecoration: 'none', color: 'var(--layer-layer-1-property-element-interactive-color)' }}>Projects</a>
          <a href="#" style={{ textDecoration: 'none', color: 'var(--layer-layer-1-property-element-interactive-color)' }}>Teams</a>
          <a href="#" style={{ textDecoration: 'none', color: 'var(--layer-layer-1-property-element-interactive-color)' }}>Settings</a>
        </nav>
      </aside>

      <main style={{ display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {['Users', 'Revenue', 'Conversion', 'Tickets'].map((label, i) => (
            <div key={label} style={{
              background: 'var(--layer-layer-1-property-surface)',
              border: '1px solid var(--layer-layer-1-property-border-color)',
              borderRadius: 'var(--layer-layer-1-property-border-radius)',
              padding: 'var(--layer-layer-1-property-padding)'
            }}>
              <div style={{ opacity: 'var(--layer-layer-1-property-element-text-low-emphasis)' }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{[1240, '$38.4k', '4.2%', 53][i]}</div>
            </div>
          ))}
        </section>

        <section style={{
          background: 'var(--layer-layer-1-property-surface)',
          border: '1px solid var(--layer-layer-1-property-border-color)',
          borderRadius: 'var(--layer-layer-1-property-border-radius)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <strong>Table</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Search" style={{ padding: 8, border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6 }} />
              <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', background: 'var(--layer-layer-0-property-surface)' }} onClick={() => setShowModal(true)}>New</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ textAlign: 'left' }}>
                <tr>
                  {['ID', 'Name', 'Status', 'Owner', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)', borderBottom: '1px solid var(--layer-layer-1-property-border-color)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)' }}>{row.id}</td>
                    <td style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)' }}>{row.name}</td>
                    <td style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)' }}>{row.status}</td>
                    <td style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)' }}>{row.owner}</td>
                    <td style={{ padding: 12, borderTop: '1px solid var(--layer-layer-1-property-border-color)' }}>
                      <button style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)', marginRight: 6 }}>Edit</button>
                      <button style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{
            background: 'var(--layer-layer-1-property-surface)',
            border: '1px solid var(--layer-layer-1-property-border-color)',
            borderRadius: 'var(--layer-layer-1-property-border-radius)',
            padding: 'var(--layer-layer-1-property-padding)'
          }}>
            <strong>Form</strong>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <label>
                <div>Name</div>
                <input type="text" placeholder="Enter name" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
              </label>
              <label>
                <div>Status</div>
                <select style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }}>
                  <option>New</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Done</option>
                </select>
              </label>
              <fieldset style={{ border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 6, padding: 10 }}>
                <legend>Preferences</legend>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" /> Enable notifications
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" /> Public profile
                </label>
              </fieldset>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }}>Submit</button>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }}>Cancel</button>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--layer-layer-1-property-surface)',
            border: '1px solid var(--layer-layer-1-property-border-color)',
            borderRadius: 'var(--layer-layer-1-property-border-radius)',
            padding: 'var(--layer-layer-1-property-padding)'
          }}>
            <strong>Panels</strong>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <div style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>Info panel content</div>
              <div style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>Alert panel content</div>
              <div style={{ background: 'var(--layer-layer-0-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 8, padding: 12 }}>Success panel content</div>
            </div>
          </div>
        </section>

        {showModal ? (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'grid', placeItems: 'center'
          }} onClick={() => setShowModal(false)}>
            <div style={{ width: 420, background: 'var(--layer-layer-1-property-surface)', border: '1px solid var(--layer-layer-1-property-border-color)', borderRadius: 12, padding: 16 }} onClick={(e) => e.stopPropagation()}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Create record</strong>
              <label>
                <div>Title</div>
                <input style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--layer-layer-1-property-border-color)' }} onClick={() => setShowModal(false)}>Create</button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}


