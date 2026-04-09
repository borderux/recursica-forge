/**
 * RoundTripPage (dev only)
 *
 * Three-panel export/import round-trip comparison view.
 * Panels: Original (clean baseline) | Export (user state) | Import (round-trip result)
 * View modes: Diff (non-matching entries only) | JSON (full pretty-printed snapshot)
 * Inherits light/dark mode from localStorage['theme-mode'].
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoundTripResult, DiffEntry } from './exportImportValidator'
import { LOCAL_STORAGE_KEY } from './exportImportValidator'

// ─── Theme palettes ───────────────────────────────────────────────────────────

const darkPalette = {
  bg: '#0f1117',
  bgPanel: '#1a1d27',
  bgRow: '#0d1020',
  border: '#2d3148',
  borderRow: '#1e2235',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMono: '#e2e8f0',
  textMuted: '#475569',
  pathBg: '#141726',
  valueMatch: '#6ee7b7',
  valueHighlight: '#fcd34d',
  valueMissing: '#f87171',
  bannerErrorBg: '#450a0a',
  bannerErrorBorder: '#b91c1c',
  bannerErrorText: '#fca5a5',
  bannerGoodBg: '#052e16',
  bannerGoodBorder: '#166534',
  bannerGoodText: '#6ee7b7',
  jsonBg: '#111318',
  jsonKey: '#93c5fd',
  jsonString: '#86efac',
  jsonNumber: '#fde68a',
  jsonBoolean: '#f9a8d4',
  jsonNull: '#94a3b8',
  altRow: '#15182a',
}

const lightPalette = {
  bg: '#f8fafc',
  bgPanel: '#ffffff',
  bgRow: '#f1f5f9',
  border: '#e2e8f0',
  borderRow: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMono: '#334155',
  textMuted: '#94a3b8',
  pathBg: '#f8fafc',
  valueMatch: '#15803d',
  valueHighlight: '#b45309',
  valueMissing: '#dc2626',
  bannerErrorBg: '#fef2f2',
  bannerErrorBorder: '#fca5a5',
  bannerErrorText: '#b91c1c',
  bannerGoodBg: '#f0fdf4',
  bannerGoodBorder: '#bbf7d0',
  bannerGoodText: '#15803d',
  jsonBg: '#f8fafc',
  jsonKey: '#1d4ed8',
  jsonString: '#15803d',
  jsonNumber: '#b45309',
  jsonBoolean: '#7c3aed',
  jsonNull: '#64748b',
  altRow: '#f1f5f9',
}

type Palette = typeof darkPalette

// ─── Style factories ──────────────────────────────────────────────────────────

function makeStyles(p: Palette) {
  return {
    root: {
      height: '100vh',
      background: p.bg,
      color: p.textMono,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    topBar: {
      background: p.bgPanel,
      borderBottom: `1px solid ${p.border}`,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
      flexWrap: 'wrap' as const,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    },
    title: {
      fontSize: 14,
      fontWeight: 700,
      color: p.textPrimary,
      letterSpacing: '-0.01em',
    },
    viewToggle: (active: boolean) => ({
      padding: '4px 12px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      background: active ? '#3b82f6' : 'transparent',
      color: active ? '#fff' : p.textSecondary,
      border: `1px solid ${active ? '#3b82f6' : p.border}`,
      transition: 'all 0.15s',
    }),
    body: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      overflow: 'hidden',
      minHeight: 0,
    },
    panelHeaderRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      flexShrink: 0,
      borderBottom: `1px solid ${p.border}`,
      background: p.bgPanel,
    },
    panelHeaderCell: (last: boolean) => ({
      padding: '8px 16px',
      borderRight: last ? 'none' : `1px solid ${p.border}`,
      fontSize: 11,
      fontWeight: 700,
      color: p.textSecondary,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
    }),
    singleScroll: {
      flex: 1,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
    },
    diffRow: (alt: boolean) => ({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      borderBottom: `1px solid ${p.borderRow}`,
      background: alt ? p.altRow : 'transparent',
    }),
    diffCell: (last: boolean) => ({
      borderRight: last ? 'none' : `1px solid ${p.border}`,
      minWidth: 0,
    }),
    scrollArea: {
      // kept for JSON view pre wrapper
      flex: 1,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
    },
    pathRow: {
      padding: '3px 16px',
      background: p.pathBg,
      borderBottom: `1px solid ${p.borderRow}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    badge: (bg: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.03em',
      background: bg,
      color: '#fff',
    }),
    pathLabel: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: p.textMuted,
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    valueRow: (striped: boolean) => ({
      display: 'flex',
      borderBottom: `1px solid ${p.borderRow}`,
      background: striped ? p.bgRow : 'transparent',
    }),
    valueCell: {
      flex: 1,
      padding: '7px 16px',
      borderRight: `1px solid ${p.borderRow}`,
      minWidth: 0,
      fontSize: 12,
      fontFamily: 'monospace',
      wordBreak: 'break-all' as const,
      color: p.textMono,
    },
    statusChip: (status: string) => {
      const config: Record<string, { bg: string; color: string }> = {
        'modified': { bg: '#4c1d95', color: '#fff' }, // Purple (User changed, import kept)
        'mismatch': { bg: '#92400e', color: '#fff' }, // Orange (All 3 differ)
        'reverted': { bg: '#991b1b', color: '#fca5a5' }, // Red (Reverted to original)
        'import-bug': { bg: '#7c2d12', color: '#fff' }, // Dark Red (Original == Export, but Import broke it)
      }
      const style = config[status] || { bg: '#333', color: '#fff' }
      return {
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
        background: style.bg,
        color: style.color,
        flexShrink: 0,
      }
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: p.textMuted,
      padding: 40,
    },
    matchBanner: {
      background: p.bannerGoodBg,
      borderBottom: `1px solid ${p.bannerGoodBorder}`,
      padding: '8px 20px',
      fontSize: 13,
      color: p.bannerGoodText,
      fontWeight: 600,
      flexShrink: 0,
    },
    errorBanner: {
      background: p.bannerErrorBg,
      borderBottom: `1px solid ${p.bannerErrorBorder}`,
      padding: '8px 20px',
      flexShrink: 0,
    },
    errorItem: {
      fontSize: 11,
      color: p.bannerErrorText,
      lineHeight: 1.5,
      fontFamily: 'monospace',
    },
    jsonPre: {
      margin: 0,
      padding: '16px',
      fontSize: 11,
      fontFamily: 'monospace',
      lineHeight: 1.6,
      background: p.jsonBg,
      color: p.textMono,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
      flex: 1,
    },
    fileTabsWrap: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
    },
  }
}

type Styles = ReturnType<typeof makeStyles>

// ─── JSON syntax highlighter ──────────────────────────────────────────────────

function JsonPanel({
  data,
  fileKey,
  styles,
  p,
}: {
  data: object
  fileKey: 'tokens' | 'brand' | 'uikit' | 'css' | 'all'
  styles: Styles
  p: Palette
}) {
  const json = useMemo(() => {
    const src = data as Record<string, unknown>
    if (fileKey === 'all') return JSON.stringify(data, null, 2)
    // Pick the relevant root key from the snapshot
    const key = fileKey === 'uikit' ? 'ui-kit' : fileKey
    const slice = src[fileKey] ?? src[key] ?? src
    return JSON.stringify(slice, null, 2)
  }, [data, fileKey])

  // Highlight JSON tokens
  const highlighted = useMemo(() => {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              return `<span style="color:${p.jsonKey}">${match}</span>`
            }
            return `<span style="color:${p.jsonString}">${match}</span>`
          }
          if (/true|false/.test(match)) {
            return `<span style="color:${p.jsonBoolean}">${match}</span>`
          }
          if (/null/.test(match)) {
            return `<span style="color:${p.jsonNull}">${match}</span>`
          }
          return `<span style="color:${p.jsonNumber}">${match}</span>`
        }
      )
  }, [json, p])

  return (
    <pre
      style={{ ...styles.jsonPre, background: p.jsonBg }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

// ─── Value cell ───────────────────────────────────────────────────────────────

function ValueCell({
  value,
  highlight,
  highlightColor,
  styles,
  last,
}: {
  value: unknown
  highlight: boolean
  highlightColor: string
  styles: Styles
  last: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const str = value === undefined ? '—' : JSON.stringify(value)
  const truncated = !expanded && str.length > 60

  return (
    <div
      style={{
        ...styles.valueCell,
        borderRight: last ? 'none' : styles.valueCell.borderRight,
        color: highlight ? highlightColor : styles.valueCell.color,
      }}
    >
      <span>{truncated ? `${str.slice(0, 60)}…` : str}</span>
      {str.length > 60 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginLeft: 6,
            fontSize: 10,
            color: 'currentColor',
            opacity: 0.5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FileTab = 'all' | 'tokens' | 'brand' | 'uikit' | 'css'
type ViewMode = 'diff' | 'mismatches' | 'json'

export function RoundTripPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<RoundTripResult | null>(null)
  const [fileTab, setFileTab] = useState<FileTab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('diff')

  const styles = useMemo<Styles>(() => {
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem('theme-mode') : null
    const palette = savedMode === 'dark' ? darkPalette : lightPalette
    return makeStyles(palette)
  }, [])

  const palette = useMemo<Palette>(() => {
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem('theme-mode') : null
    return savedMode === 'dark' ? darkPalette : lightPalette
  }, [])

  // Read + cleanup localStorage on mount
  useEffect(() => {
    // 1. Try window.opener first (unlimited size, synchronous pointer)
    let openerData = null
    try {
      openerData = typeof window !== 'undefined' && window.opener 
        ? window.opener.__RECURSICA_ROUNDTRIP_DATA__ 
        : null
    } catch (e) {
      // Ignore cross-origin errors if any
    }

    if (openerData) {
      setResult(openerData)
      return
    }

    // 2. Try localStorage fallback
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      try {
        setResult(JSON.parse(raw) as RoundTripResult)
      } catch { /* corrupt data, handled by empty state */ }
    }
  }, [])

  const filteredDiffs = useMemo<DiffEntry[]>(() => {
    if (!result) return []
    let diffs = result.diffs
    if (fileTab !== 'all') {
      diffs = diffs.filter((d) => d.file === fileTab)
    }
    if (viewMode === 'mismatches') {
      diffs = diffs.filter((d) => {
        const expStr = d.exportValue === undefined ? undefined : JSON.stringify(d.exportValue)
        const impStr = d.importValue === undefined ? undefined : JSON.stringify(d.importValue)
        return expStr !== impStr
      })
    }
    return diffs
  }, [result, fileTab, viewMode])

  const fileCounts = useMemo(() => {
    if (!result) return { tokens: 0, brand: 0, uikit: 0 } as Record<string, number>
    return {
      tokens: result.diffs.filter((d) => d.file === 'tokens').length,
      brand: result.diffs.filter((d) => d.file === 'brand').length,
      uikit: result.diffs.filter((d) => d.file === 'uikit').length,
      css: result.diffs.filter((d) => d.file === 'css').length,
    } as Record<string, number>
  }, [result])

  // ── Empty state ──
  if (!result) {
    return (
      <div style={styles.root}>
        <div style={styles.topBar}>
          <span style={styles.title}>Round-Trip Validation</span>
        </div>
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>⚗️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No diff data found</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 400, opacity: 0.6, lineHeight: 1.6 }}>
            Click the <strong>Diff</strong> button (⊘) in the Recursica Forge header.<br/>
            It will download a zip, reset the app, and open the import modal.<br/>
            Drop the zip in the import modal — this tab will update automatically.
          </div>
        </div>
      </div>
    )
  }

  const allClean = result.diffs.length === 0

  const panels = [
    { label: 'Original', key: 'originalSnapshot' as const },
    { label: 'Export', key: 'exportSnapshot' as const },
    { label: 'Import', key: 'importSnapshot' as const },
  ]

  // Get the snapshot object for a given panel + file filter
  const getSnapshot = (key: keyof RoundTripResult) => {
    return result[key] as { tokens: object; brand: object; uikit: object; css: object }
  }

  // Get value for a diff path from a given snapshot
  const resolveValue = (
    snapshot: { tokens: object; brand: object; uikit: object; css: object },
    diff: DiffEntry
  ): unknown => {
    const file = snapshot[diff.file] as Record<string, unknown>
    const parts = diff.path.split('.')
    let node: unknown = file
    for (const part of parts) {
      if (node === null || typeof node !== 'object') return undefined
      node = (node as Record<string, unknown>)[part]
    }
    return node
  }

  return (
    <div style={styles.root}>
      {/* ── Top bar ── */}
      <div style={styles.topBar}>
        <span style={styles.title}>Round-Trip Validation</span>

        {/* File filter tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {(['tokens', 'brand', 'uikit', 'css', 'all'] as FileTab[]).map((tab) => {
            const label = tab === 'uikit' ? 'UI Kit' : tab === 'css' ? 'CSS' : tab.charAt(0).toUpperCase() + tab.slice(1)
            return (
            <button
              key={tab}
              style={styles.viewToggle(fileTab === tab)}
              onClick={() => setFileTab(tab)}
            >
              {label}
              {tab !== 'all' && fileCounts[tab] !== undefined ? (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>({fileCounts[tab]})</span>
              ) : null}
            </button>
          )})}
        </div>

        {/* Summary badges */}
        <span style={styles.badge(allClean ? '#166534' : '#1d4ed8')}>
          {filteredDiffs.length} diff{filteredDiffs.length !== 1 ? 's' : ''}
        </span>
        {result.mismatches > 0 && (
          <span style={styles.badge('#92400e')}>
            {result.mismatches} mismatch{result.mismatches !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* ── Sub bar for view modes ── */}
      <div style={{...styles.topBar, borderTop: 'none', background: palette.bgRow, paddingTop: 4, paddingBottom: 4}}>
        <span style={{ fontSize: 11, fontWeight: 600, color: palette.textSecondary, marginRight: 8, textTransform: 'uppercase' }}>View Mode:</span>
        <button style={styles.viewToggle(viewMode === 'diff')} onClick={() => setViewMode('diff')}>
          Diff
        </button>
        <button style={styles.viewToggle(viewMode === 'mismatches')} onClick={() => setViewMode('mismatches')}>
          Mismatches
        </button>
        <button style={styles.viewToggle(viewMode === 'json')} onClick={() => setViewMode('json')}>
          JSON
        </button>
      </div>

      {allClean && (
        <div style={styles.matchBanner}>
          ✓ Import is perfectly consistent — no diffs detected.
        </div>
      )}

      {/* ── Body: sticky column headers + single scroll area ── */}

      <div style={styles.body}>
        {/* Sticky panel header row */}
        <div style={styles.panelHeaderRow}>
          {panels.map(({ label }, i) => (
            <div key={label} style={styles.panelHeaderCell(i === panels.length - 1)}>{label}</div>
          ))}
        </div>

        {/* Single scrollable content area */}
        <div style={styles.singleScroll}>
          {viewMode === 'json' ? (
            /* JSON view: three columns side by side */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1 }}>
              {panels.map(({ key }, i) => {
                const snap = result[key] as { tokens: object; brand: object; uikit: object; css: object }
                return (
                  <div key={key} style={{ borderRight: i < panels.length - 1 ? `1px solid ${palette.border}` : 'none' }}>
                    <JsonPanel data={snap} fileKey={fileTab} styles={styles} p={palette} />
                  </div>
                )
              })}
            </div>
          ) : filteredDiffs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, opacity: 0.5 }}>
              No diffs in {fileTab === 'uikit' ? 'UI Kit' : fileTab}.
            </div>
          ) : (
            /* Diff view: one row per diff path, three value columns */
            filteredDiffs.map((diff, rowIdx) => {
              const snaps = panels.map(({ key }) => result[key] as { tokens: object; brand: object; uikit: object; css: object })
              const origVal = resolveValue(snaps[0], diff)
              const exportVal = resolveValue(snaps[1], diff)
              const importVal = resolveValue(snaps[2], diff)
              
              const origStr = origVal === undefined ? undefined : JSON.stringify(origVal)
              const expStr = exportVal === undefined ? undefined : JSON.stringify(exportVal)
              const impStr = importVal === undefined ? undefined : JSON.stringify(importVal)
              
              let status = 'mismatch'
              if (expStr === impStr) {
                  status = 'modified' // Successfully tracked modification
              } else if (origStr === expStr) {
                  status = 'import-bug' // Import threw away the data or mutated it unnecessarily
              } else if (origStr === impStr) {
                  status = 'reverted' // Import threw away the user modification
              }

              return (
                <div key={`${diff.file}-${diff.path}`}>
                  {/* Full-width path row */}
                  <div style={{ ...styles.pathRow, display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={styles.pathLabel}>{diff.file} › {diff.path}</span>
                    <span style={styles.statusChip(status)}>{status}</span>
                  </div>
                  {/* Three-column value row */}
                  <div style={styles.diffRow(rowIdx % 2 === 1)}>
                    {snaps.map((snap, panelIdx) => {
                      const val = resolveValue(snap, diff)
                      const highlight = (panelIdx === 1 && expStr !== origStr) || (panelIdx === 2 && impStr !== expStr)
                      return (
                        <div key={panelIdx} style={styles.diffCell(panelIdx === snaps.length - 1)}>
                          <div style={styles.valueRow(false)}>
                            <ValueCell
                              value={val}
                              highlight={highlight}
                              highlightColor={palette.jsonNumber}
                              styles={styles}
                              last={true}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
