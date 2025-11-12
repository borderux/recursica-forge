import { contrastRatio } from '../theme/contrastUtil'

export type PaletteEmphasisCellProps = {
  toneHex: string
  emphasis: 'high' | 'low'
  isPrimary: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  getOpacityToken: (name: string) => number
  pickMinAlphaForAA: (toneHex: string, dotHex: string) => number
}

export function PaletteEmphasisCell({
  toneHex,
  emphasis,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onClick,
  getOpacityToken,
  pickMinAlphaForAA,
}: PaletteEmphasisCellProps) {
  const black = '#000000'
  const white = '#ffffff'
  const cBlack = contrastRatio(toneHex, black)
  const cWhite = contrastRatio(toneHex, white)
  const dotColor = (cBlack >= 4.5 || cBlack >= cWhite) ? black : white
  
  const opacity = emphasis === 'high'
    ? getOpacityToken('opacity/solid')
    : pickMinAlphaForAA(toneHex, dotColor)

  return (
    <td
      className={`palette-box${isPrimary ? ' default' : ''}`}
      style={{ backgroundColor: toneHex, cursor: 'pointer', width: isPrimary ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%' }}
      title={isPrimary ? 'Primary' : 'Set as Primary'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="palette-dot" style={{ backgroundColor: dotColor, opacity }} />
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

