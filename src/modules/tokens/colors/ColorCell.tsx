import { ColorPickerOverlay } from '../../pickers/ColorPickerOverlay'
import { tokenToCssVar } from '../../../core/css/tokenRefs'

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
}: ColorCellProps) {
  const lvlNum = Number(level)
  const isDark = lvlNum >= 500
  const isLight = lvlNum <= 400
  const hoverShadow = isHovered ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.5)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.5)' : undefined) : undefined
  const activeShadow = isActive ? (isDark ? 'inset 0 0 0 2px rgba(255,255,255,0.8)' : isLight ? 'inset 0 0 0 2px rgba(0,0,0,0.8)' : undefined) : undefined
  const boxShadow = activeShadow || hoverShadow || undefined

  // Convert token name (e.g., "color/gray/100" or "colors/cornflower/100") to CSS variable
  // Use tokenToCssVar to handle both old and new formats properly
  const cssVar = tokenName ? (() => {
    const cssVarRef = tokenToCssVar(tokenName)
    if (cssVarRef) {
      // Extract CSS var name from var(--name) format
      return cssVarRef.replace(/^var\s*\(\s*|\)\s*$/g, '')
    }
    // Fallback to simple conversion
    return `--recursica-tokens-${tokenName.replace(/\//g, '-')}`
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

