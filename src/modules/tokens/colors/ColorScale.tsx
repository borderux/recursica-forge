import { useState, useEffect, useRef } from 'react'
import { ColorCell } from './ColorCell'
import { toTitleCase } from './colorUtils'

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
}: ColorScaleProps) {
  if (deletedFamilies[family]) return null

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
    const v = toTitleCase(newValue)
    setLocalName(v)
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Set new timer to debounce the actual change
    debounceTimerRef.current = setTimeout(() => {
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
    // Apply the change immediately on blur
    const v = toTitleCase(localName)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 4 }}>
        <input
          required
          value={localName}
          onChange={(e) => handleNameChange(e.currentTarget.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // Apply immediately on Enter
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          style={{ fontSize: 13, padding: '4px 8px', border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)', borderRadius: 6, width: '100%' }}
        />
      </div>
      {levelOrder.map((level) => {
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
          />
        )
      })}
      <div style={{ marginTop: 6 }}>
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
              : 'Delete color column'
          }
          style={{
            border: '1px solid var(--recursica-brand-light-layer-layer-1-property-border-color)',
            background: 'transparent',
            cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
            borderRadius: 6,
            padding: '6px 8px',
            width: '100%',
            opacity: isDeleteDisabled ? 0.5 : 1,
          }}
        >🗑️</button>
      </div>
    </div>
  )
}

