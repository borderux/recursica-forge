type LayerModuleProps = {
  level?: number | string
  alternativeKey?: string
  title?: string
  className?: string
  children?: any
}

export default function LayerModule({ level, alternativeKey, title, className, children }: LayerModuleProps) {
  const isAlternative = typeof alternativeKey === 'string' && alternativeKey.length > 0
  const layerId = level != null ? String(level) : '0'
  const base = isAlternative ? `--layer-layer-alternative-${alternativeKey}-property-` : `--layer-layer-${layerId}-property-`
  const includeBorder = !isAlternative && !(layerId === '0')
  const paletteBackground = isAlternative
    ? alternativeKey === 'alert' ? 'var(--palette-alert)'
      : alternativeKey === 'warning' ? 'var(--palette-warning)'
      : alternativeKey === 'success' ? 'var(--palette-success)'
      : alternativeKey === 'high-contrast' ? 'var(--palette-black)'
      : alternativeKey === 'primary-color' ? 'var(--palette-palette-1-primary-tone)'
      : null
    : null

  // Alternative layer text color/opacity binding to palette on-tone and emphasis
  const altOnToneColor = isAlternative
    ? alternativeKey === 'primary-color' ? 'var(--palette-palette-1-primary-on-tone)'
      : alternativeKey === 'high-contrast' ? 'var(--palette-white)'
      : alternativeKey === 'alert' ? 'var(--palette-alert-on-tone)'
      : alternativeKey === 'warning' ? 'var(--palette-warning-on-tone)'
      : alternativeKey === 'success' ? 'var(--palette-success-on-tone)'
      : undefined
    : undefined
  const altHighOpacity = isAlternative
    ? alternativeKey === 'primary-color' ? 'var(--palette-palette-1-primary-high-emphasis)'
      : '1'
    : '1'
  const altLowOpacity = isAlternative
    ? alternativeKey === 'primary-color' ? 'var(--palette-palette-1-primary-low-emphasis)'
      : '0.5'
    : '0.5'

  return (
    <div
      className={className ? `layer-container ${className}` : 'layer-container'}
      style={{
        backgroundColor: paletteBackground ?? `var(${base}surface)`,
        color: `var(${base}element-text-color)`,
        padding: `var(${base}padding)`,
        border: includeBorder ? `var(${base}border-thickness) solid var(${base}border-color)` : undefined,
        borderRadius: includeBorder ? `var(${base}border-radius)` : undefined,
      }}
    >
      <div className="layer-content">
        <div className="layer-text-samples">
          {title ? <h3 style={isAlternative ? { color: altOnToneColor, opacity: altHighOpacity } as any : undefined}>{title}</h3> : null}
          <p style={isAlternative ? { color: altOnToneColor, opacity: altHighOpacity } as any : { opacity: `var(${base}element-text-high-emphasis)` }}>High Emphasis Text / Icon</p>
          <p style={isAlternative ? { color: altOnToneColor, opacity: altLowOpacity } as any : { opacity: `var(${base}element-text-low-emphasis)` }}>Low Emphasis Text / Icon</p>
          <p style={{ color: `var(${base}element-interactive-color)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Interactive (Link / Button)</p>
          <p style={{ color: `var(${base}element-interactive-color)`, opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
          {!isAlternative && (
            <>
              <p style={{ color: `var(${base}element-text-alert)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Alert</p>
              <p style={{ color: `var(${base}element-text-warning)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Warning</p>
              <p style={{ color: `var(${base}element-text-success)`, opacity: `var(${base}element-interactive-high-emphasis)` }}>Success</p>
            </>
          )}
        </div>

        {children ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}


