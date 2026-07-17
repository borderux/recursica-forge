/**
 * OnToneModal
 *
 * Shown when a user changes a component layer's surface/tone color and the same
 * layer group has text/icon (on-tone) properties that were paired with the OLD
 * color for contrast. The user picks between two radio options — keep the current
 * colors, or update them to the contrast-matched (compliant) ones — each rendered
 * as a live preview of the new background. The compliant option is selected by
 * default, and the choice is committed with a single Save button (no dismiss).
 */

import { useState, useEffect } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { RadioButtonItem } from '../../../components/adapters/RadioButtonItem'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { OnToneConflict } from '../../../core/css/onToneInterceptor'
import { resolveOnToneConflict, formatPropLabel } from '../../../core/css/onToneInterceptor'

export interface OnToneModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: OnToneConflict | null
}

type Choice = 'update' | 'keep'

/**
 * '{brand.palettes.neutral.500.color.tone}' → 'var(--recursica_brand_palettes_neutral_500_color_tone)'.
 * These brand-token refs resolve to global `--recursica_brand_*` vars, so we map dots → underscores
 * against that prefix directly.
 */
function refToVar(ref: string): string {
  const path = ref.replace(/[{}]/g, '').trim().replace(/\./g, '_')
  return `var(--recursica_${path})`
}

/**
 * A selectable option: a radio indicator plus a miniature of the changed surface — the new
 * background with sample text + an icon dot in `fgRef` — so the contrast is visible.
 */
function OptionCard({
  selected,
  onSelect,
  bgRef,
  fgRef,
  label,
  accentColor,
  idleBorder,
}: {
  selected: boolean
  onSelect: () => void
  bgRef: string
  fgRef: string
  label: string
  accentColor: string
  idleBorder: string
}) {
  return (
    // Clickable card (a div, not a button, so it can contain the RadioButtonItem's label/input).
    // onSelect is idempotent, so the card click and the radio's own onChange can both fire safely.
    <div
      onClick={onSelect}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        borderRadius: 'var(--recursica_brand_dimensions_border-radii_default, 8px)',
        border: `2px solid ${selected ? accentColor : idleBorder}`,
        background: 'transparent',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {/* Preview: the new background with sample text + an icon dot in the option's on-tone color */}
      <span
        style={{
          background: refToVar(bgRef),
          color: refToVar(fgRef),
          borderRadius: '6px',
          padding: '14px 16px',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          aria-hidden
          style={{ width: '18px', height: '18px', borderRadius: '999px', background: 'currentColor', flexShrink: 0 }}
        />
        <span style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1 }}>Ag</span>
      </span>

      {/* Radio dot + label — the real RadioButtonItem component */}
      <RadioButtonItem
        selected={selected}
        onChange={() => onSelect()}
        label={label}
        layer="layer-1"
      />
    </div>
  )
}

export function OnToneModal({ isOpen, onClose, conflict }: OnToneModalProps) {
  const { mode } = useThemeMode()
  const layerElements = `--recursica_brand_themes_${mode}_layers_layer-1_elements`
  const textColor = `var(${layerElements}_text-color)`
  const accentColor = `var(${layerElements}_interactive-tone)`
  const idleBorder = 'rgba(128,128,128,0.35)'

  // The compliant ("update") option is selected by default; reset whenever a new conflict opens.
  const [choice, setChoice] = useState<Choice>('update')
  useEffect(() => {
    if (conflict) setChoice('update')
  }, [conflict])

  if (!conflict) return null

  const changedPropLabel = formatPropLabel(conflict.changedPropKey).toLowerCase()
  const currentOnToneRef = conflict.siblings[0]?.currentRef || conflict.newOnToneRef

  const handleSave = () => {
    const savedConflict = conflict
    const savedChoice = choice
    onClose()
    queueMicrotask(() => {
      resolveOnToneConflict(savedChoice === 'update' ? 'update' : 'skip', savedConflict)
    })
  }

  const bodyStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 'var(--recursica_brand_typography_body-font-size)',
    fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
    fontFamily: 'var(--recursica_brand_typography_body-font-family)',
    letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_body-line-height)',
    color: textColor,
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keep colors readable?"
      size={560}
      layer="layer-1"
      showCloseButton={false}
      primaryActionLabel="Save"
      onPrimaryAction={handleSave}
      showSecondaryButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={bodyStyle}>
          You changed the <strong>{changedPropLabel}</strong>. These colors sit on top of it and were
          matched to the previous color for contrast:
        </p>

        <ul style={{ ...bodyStyle, margin: 0, paddingLeft: '22px' }}>
          {conflict.siblings.map(s => (
            <li key={s.propertyKey}>{formatPropLabel(s.propertyKey)}</li>
          ))}
        </ul>

        <p style={bodyStyle}>Choose how they should look:</p>

        <div role="radiogroup" style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          <OptionCard
            selected={choice === 'keep'}
            onSelect={() => setChoice('keep')}
            bgRef={conflict.newToneRef}
            fgRef={currentOnToneRef}
            label="Current color"
            accentColor={accentColor}
            idleBorder={idleBorder}
          />
          <OptionCard
            selected={choice === 'update'}
            onSelect={() => setChoice('update')}
            bgRef={conflict.newToneRef}
            fgRef={conflict.newOnToneRef}
            label="WCAG AA compliant color"
            accentColor={accentColor}
            idleBorder={idleBorder}
          />
        </div>
      </div>
    </Modal>
  )
}
