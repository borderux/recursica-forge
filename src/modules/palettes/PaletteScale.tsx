import { PaletteEmphasisCell, PalettePrimaryIndicatorCell } from './PaletteGridCell'

export type PaletteScaleProps = {
  level: string
  toneCssVar: string
  onToneCssVar: string
  emphasisCssVar: string
  isPrimary: boolean
  isHovered: boolean
  headerLevels: string[]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSetPrimary: () => void
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
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary'>) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
    />
  )
}

export function PaletteScaleLowEmphasis({
  toneCssVar,
  onToneCssVar,
  emphasisCssVar,
  isPrimary,
  headerLevels,
  onMouseEnter,
  onMouseLeave,
  onSetPrimary,
}: Pick<PaletteScaleProps, 'toneCssVar' | 'onToneCssVar' | 'emphasisCssVar' | 'isPrimary' | 'headerLevels' | 'onMouseEnter' | 'onMouseLeave' | 'onSetPrimary'>) {
  return (
    <PaletteEmphasisCell
      toneCssVar={toneCssVar}
      onToneCssVar={onToneCssVar}
      emphasisCssVar={emphasisCssVar}
      isPrimary={isPrimary}
      headerLevels={headerLevels}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSetPrimary}
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

