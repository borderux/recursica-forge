import { PaletteEmphasisCell, PalettePrimaryIndicatorCell } from './PaletteGridCell'

export type PaletteScaleProps = {
  level: string
  toneHex: string
  isPrimary: boolean
  isHovered: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSetPrimary: () => void
  getOpacityToken: (name: string) => number
  pickMinAlphaForAA: (toneHex: string, dotHex: string) => number
}

export function PaletteScaleHeader({
  level,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'level' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary'>) {
  const headerWidth = isPrimary ? `${Math.max(0, 100 - (headerLevels.length - 1) * 8)}%` : '8%'

  return (
    <th
      className={isPrimary ? 'default' : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      title={isPrimary ? 'Primary' : 'Set as Primary'}
      style={{ cursor: 'pointer', width: headerWidth }}
    >
      {level}
    </th>
  )
}

export function PaletteScaleHighEmphasis({
  toneHex,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  getOpacityToken,
  pickMinAlphaForAA,
}: Pick<PaletteScaleProps, 'toneHex' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'getOpacityToken' | 'pickMinAlphaForAA'>) {
  return (
    <PaletteEmphasisCell
      toneHex={toneHex}
      emphasis="high"
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      getOpacityToken={getOpacityToken}
      pickMinAlphaForAA={pickMinAlphaForAA}
    />
  )
}

export function PaletteScaleLowEmphasis({
  toneHex,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
  getOpacityToken,
  pickMinAlphaForAA,
}: Pick<PaletteScaleProps, 'toneHex' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary' | 'getOpacityToken' | 'pickMinAlphaForAA'>) {
  return (
    <PaletteEmphasisCell
      toneHex={toneHex}
      emphasis="low"
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
      getOpacityToken={getOpacityToken}
      pickMinAlphaForAA={pickMinAlphaForAA}
    />
  )
}

export function PaletteScalePrimaryIndicator({
  isPrimary,
  isHovered,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'isPrimary' | 'isHovered' | 'onSetPrimary'>) {
  return (
    <PalettePrimaryIndicatorCell
      isPrimary={isPrimary}
      isHovered={isHovered}
      onSetPrimary={onSetPrimary}
    />
  )
}

