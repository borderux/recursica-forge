import { useState, useEffect, useRef } from 'react'
import { iconNameToReactComponent } from '../../components/iconUtils'
import { ColorCell } from './ColorCell'
import { toTitleCase } from './colorUtils'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { JsonLike } from '../../../core/resolvers/tokens'
import { TextField } from '../../../components/adapters/TextField'

export type ColorScaleProps = {
  family: string
  levels: Array<{ level: string; entry: { name: string; value: string | number } }>
  levelOrder: string[]
  values: Record<string, string | number>
  familyNames: Record<string, string>
  deletedFamilies: Record<string, true>
  hoveredSwatch: string | null
  openPicker: { tokenName: string; swatchRect: DOMRect } | null
  setHoveredSwatch: (tokenName: string | null) => void
  setOpenPicker: (picker: { tokenName: string; swatchRect: DOMRect } | null) => void
  onNameFromHex: (family: string, hex: string) => void
  onChange: (tokenName: string, hex: string, cascadeDown: boolean, cascadeUp: boolean) => void
  onFamilyNameChange: (family: string, newName: string) => void
  onDeleteFamily: (family: string) => void
  isUsedInPalettes: boolean
  isLastColorScale: boolean
  tokens?: JsonLike
}

export function ColorScale({
  family,
  levels,
  levelOrder,
  values,
  familyNames,
  deletedFamilies,
  hoveredSwatch,
  openPicker,
  setHoveredSwatch,
  setOpenPicker,
  onNameFromHex,
  onChange,
  onFamilyNameChange,
  onDeleteFamily,
  isUsedInPalettes,
  isLastColorScale,
  tokens,
}: ColorScaleProps) {
  if (deletedFamilies[family]) return null

  const { mode } = useThemeMode()

  const level500 = levels.find((l) => l.level === '500')
  const borderColor = level500 ? (values[level500.entry.name] || level500.entry.value) : 'transparent'

  const displayFamilyName = toTitleCase(familyNames[family] ?? family)
  const isDeleteDisabled = isUsedInPalettes || isLastColorScale

  // Local state for input value (for immediate UI feedback)
  const [localName, setLocalName] = useState(displayFamilyName)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when displayFamilyName changes externally
  useEffect(() => {
    setLocalName(displayFamilyName)
    // Clear any pending debounce timer when name changes externally (e.g., from "name this color" button)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [displayFamilyName])

  // Debounced handler for name changes
  const handleNameChange = (newValue: string) => {
    // Value is already filtered in onChange - keep raw value in localName for typing
    // Don't apply toTitleCase while typing, only on blur/debounce
    setLocalName(newValue)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer to debounce the actual change
    debounceTimerRef.current = setTimeout(() => {
      const v = toTitleCase(newValue)
      onFamilyNameChange(family, v)
    }, 1000) // 1000ms debounce
  }

  // Handle blur - apply immediately
  const handleBlur = () => {
    // Clear any pending debounced call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    // Apply the change immediately on blur - filter to alphanumeric and spaces, then title case
    const filtered = localName.replace(/[^a-zA-Z0-9\s]/g, '')
    const v = toTitleCase(filtered)
    setLocalName(v) // Update local state with title-cased value
    onFamilyNameChange(family, v)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const layer1Base = `--recursica-brand-themes-${mode}-layers-layer-1-properties`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 'var(--recursica-brand-dimensions-gutters-vertical)' }}>
        <TextField
          value={localName}
          onChange={(e) => {
            // Filter input to only allow alphanumeric and spaces
            const filtered = e.currentTarget.value.replace(/[^a-zA-Z0-9\s]/g, '')
            handleNameChange(filtered)
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // Apply immediately on Enter
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          layer="layer-1"
          minWidth={0}
          style={{
            fontSize: 'var(--recursica-brand-typography-body-small-font-size)',
            width: '100%',
          }}
        />
      </div>
      <div style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--recursica-brand-dimensions-border-radii-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }}>
        {levelOrder.map((level, index) => {
          const match = levels.find((l) => l.level === level)
          const entry = match?.entry
          const isGrayFamily = family === 'gray'
          const isEdgeLevel = level === '1000' || level === '000'
          const tokenName = entry?.name || (isEdgeLevel && !isGrayFamily ? undefined : `color/${family}/${level}`)
          const current = tokenName ? String(values[tokenName] ?? (entry ? entry.value : '')) : ''
          const isHovered = hoveredSwatch === tokenName
          const isActive = !!openPicker && openPicker.tokenName === tokenName

          return (
            <ColorCell
              key={`${family}-${level}`}
              tokenName={tokenName}
              currentHex={current}
              level={level}
              family={family}
              isHovered={isHovered}
              isActive={isActive}
              onMouseEnter={() => tokenName && setHoveredSwatch(tokenName)}
              onMouseLeave={() => {
                if (hoveredSwatch === tokenName) setHoveredSwatch(null)
              }}
              onClick={(ev) => {
                if (!tokenName) return
                const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
                setOpenPicker({ tokenName, swatchRect: rect })
              }}
              onChange={(hex, cascadeDown, cascadeUp) => {
                if (tokenName) onChange(tokenName, hex, cascadeDown, cascadeUp)
              }}
              onNameFromHex={onNameFromHex}
              displayFamilyName={displayFamilyName}
              openPicker={openPicker}
              setOpenPicker={setOpenPicker}
              tokens={tokens}
              isFirst={index === 0}
              isLast={index === levelOrder.length - 1}
            />
          )
        })}
      </div>
      <div style={{
        marginTop: 'var(--recursica-brand-dimensions-gutters-vertical)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => {
            if (!isDeleteDisabled) {
              onDeleteFamily(family)
            }
          }}
          disabled={isDeleteDisabled}
          title={
            isDeleteDisabled
              ? isUsedInPalettes
                ? 'Cannot delete: color scale is used in a palette'
                : 'Cannot delete: this is the last color scale'
              : 'Delete color scale'
          }
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid var(--recursica-brand-themes-${mode}-palettes-core-interactive)`,
            background: 'transparent',
            cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: isDeleteDisabled ? 0.5 : 1,
            color: `var(--recursica-brand-themes-${mode}-palettes-core-interactive)`,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isDeleteDisabled) {
              e.currentTarget.style.opacity = '0.8'
            }
          }}
          onMouseLeave={(e) => {
            if (!isDeleteDisabled) {
              e.currentTarget.style.opacity = '1'
            }
          }}
        >
          {(() => {
            const TrashIcon = iconNameToReactComponent('trash')
            return TrashIcon ? <TrashIcon style={{ width: 16, height: 16 }} /> : null
          })()}
        </button>
      </div>
    </div>
  )
}

