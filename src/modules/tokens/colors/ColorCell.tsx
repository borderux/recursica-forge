import { ColorPickerOverlay } from '../../pickers/ColorPickerOverlay'
import { tokenToCssVar } from '../../../core/css/tokenRefs'
import type { JsonLike } from '../../../core/resolvers/tokens'

export type ColorCellProps = {
  tokenName: string | undefined
  currentHex: string
  level: string
  family: string
  isHovered: boolean
  isActive: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: (ev: React.MouseEvent<HTMLDivElement>) => void
  onChange: (hex: string, cascadeDown: boolean, cascadeUp: boolean) => void
  onNameFromHex: (family: string, hex: string) => void
  displayFamilyName: string
  openPicker: { tokenName: string; swatchRect: DOMRect } | null
  setOpenPicker: (picker: { tokenName: string; swatchRect: DOMRect } | null) => void
  tokens?: JsonLike
  isFirst?: boolean
  isLast?: boolean
}

export function ColorCell({
  tokenName,
  currentHex,
  level,
  family: _family,
  isHovered,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onChange,
  onNameFromHex,
  displayFamilyName,
  openPicker,
  setOpenPicker,
  tokens,
  isFirst,
  isLast,
}: ColorCellProps) {
  const lvlNum = Number(level)
  const isDark = lvlNum >= 500
  const isLight = lvlNum <= 400
  const hoverShadow = isHovered ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.5)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.5)' : undefined) : undefined
  const activeShadow = isActive ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.8)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.8)' : undefined) : undefined
  const boxShadow = activeShadow || hoverShadow || undefined

  // Convert token name (e.g., "color/gray/100" or "colors/cornflower/100") to CSS variable
  // Use tokenToCssVar to handle both old and new formats properly
  // Must pass tokens parameter to resolve aliases to scale keys
  const cssVar = tokenName ? (() => {
    const cssVarRef = tokenToCssVar(tokenName, tokens)
    if (cssVarRef) {
      return cssVarRef.replace(/^var\s*\(\s*|\)\s*$/g, '')
    }
    return null
  })() : null

  return (
    <div>
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        role="button"
        title={tokenName ? `${tokenName} ${currentHex}` : ''}
        style={{
          height: 40,
          background: cssVar ? `var(${cssVar})` : 'transparent',
          cursor: tokenName ? 'pointer' : 'default',
          boxShadow,
          borderTopLeftRadius: isFirst ? 'var(--recursica_brand_dimensions_border-radii_lg)' : 0,
          borderTopRightRadius: isFirst ? 'var(--recursica_brand_dimensions_border-radii_lg)' : 0,
          borderBottomLeftRadius: isLast ? 'var(--recursica_brand_dimensions_border-radii_lg)' : 0,
          borderBottomRightRadius: isLast ? 'var(--recursica_brand_dimensions_border-radii_lg)' : 0,
        }}
      />
      {tokenName && openPicker && openPicker.tokenName === tokenName && (
        <ColorPickerOverlay
          tokenName={tokenName}
          currentHex={/^#([0-9a-f]{6})$/i.test(currentHex) ? currentHex : '#000000'}
          swatchRect={openPicker.swatchRect}
          onClose={() => setOpenPicker(null)}
          onNameFromHex={onNameFromHex}
          displayFamilyName={displayFamilyName}
          onChange={onChange}
        />
      )}
    </div>
  )
}

