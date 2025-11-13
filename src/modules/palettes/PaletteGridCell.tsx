export type PaletteEmphasisCellProps = {
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}

export function PaletteEmphasisCell({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: PaletteEmphasisCellProps) {
  return (
    <td
      className={`palette-box${isPrimary ? ' default' : ''}`}
      style={{ backgroundColor: `var(${toneCssVar})`, cursor: 'pointer', width: isPrimary ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%' }}
      title={isPrimary ? 'Primary' : 'Set as Primary'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="palette-dot" style={{ backgroundColor: `var(${onToneCssVar})`, opacity: `var(${emphasisCssVar})` }} />
    </td>
  )
}

export type PalettePrimaryIndicatorCellProps = {
  isPrimary: boolean
  isHovered: boolean
  onSetPrimary: () => void
}

export function PalettePrimaryIndicatorCell({
  isPrimary,
  isHovered,
  onSetPrimary,
}: PalettePrimaryIndicatorCellProps) {
  return (
    <td className={isPrimary ? 'default' : undefined} style={{ textAlign: 'center', verticalAlign: 'top', height: 28 }}>
      {isPrimary ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: '1px solid var(--layer-layer-1-property-border-color)',
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
          }}
        >primary</span>
      ) : isHovered ? (
        <button
          onClick={onSetPrimary}
          style={{
            display: 'inline-block',
            fontSize: 11,
            lineHeight: '14px',
            padding: '2px 8px',
            border: '1px dashed var(--layer-layer-1-property-border-color)',
            borderRadius: 999,
            background: 'transparent',
            textTransform: 'capitalize',
            cursor: 'pointer',
          }}
          title="Set as Primary"
        >Set as Primary</button>
      ) : null}
    </td>
  )
}


