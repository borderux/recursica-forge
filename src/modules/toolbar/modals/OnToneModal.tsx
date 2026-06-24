/**
 * OnToneModal
 *
 * Shown when a user changes a component layer color to a new `.tone` value
 * and the same layer group has sibling properties that currently point to the
 * matching `.on-tone` of the OLD value.
 *
 * Asks whether to update the related on-tone properties automatically.
 */

import { useState } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { CheckboxItem } from '../../../components/adapters/CheckboxItem'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { OnToneConflict } from '../../../core/css/onToneInterceptor'
import { resolveOnToneConflict, formatSiblingList, formatPropLabel } from '../../../core/css/onToneInterceptor'

export interface OnToneModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: OnToneConflict | null
}

export function OnToneModal({ isOpen, onClose, conflict }: OnToneModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const { mode } = useThemeMode()
  const layerElements = `--recursica_brand_themes_${mode}_layers_layer-1_elements`

  if (!conflict) return null

  const siblingLabel = formatSiblingList(conflict.siblings)
  const changedPropLabel = formatPropLabel(conflict.changedPropKey).toLowerCase()

  const handleUpdate = () => {
    const savedConflict = conflict
    const savedRemember = rememberChoice
    setRememberChoice(false)
    onClose()
    queueMicrotask(() => {
      resolveOnToneConflict('update', savedConflict, savedRemember)
    })
  }

  const handleSkip = () => {
    resolveOnToneConflict('skip', conflict, rememberChoice)
    setRememberChoice(false)
    onClose()
  }

  const handleClose = () => {
    resolveOnToneConflict('skip', conflict, false)
    setRememberChoice(false)
    onClose()
  }

  const bodyStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 'var(--recursica_brand_typography_body-font-size)',
    fontWeight: 'var(--recursica_brand_typography_body-font-weight)',
    fontFamily: 'var(--recursica_brand_typography_body-font-family)',
    letterSpacing: 'var(--recursica_brand_typography_body-font-letter-spacing)',
    lineHeight: 'var(--recursica_brand_typography_body-line-height)',
    color: `var(${layerElements}_text-color)`,
    opacity: `var(${layerElements}_text-high-emphasis)`,
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update related colors"
      size={720}
      layer="layer-1"
      primaryActionLabel="Update on-tones"
      onPrimaryAction={handleUpdate}
      secondaryActionLabel={`Only update ${changedPropLabel}`}
      onSecondaryAction={handleSkip}
      showSecondaryButton={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={bodyStyle}>
          The related <strong>{siblingLabel}</strong> in this layer{' '}
          {conflict.siblings.length === 1 ? 'is' : 'are'} currently set to the
          matching on-tone color. Would you also like to update the on-tone colors?
        </p>

        <CheckboxItem
          checked={rememberChoice}
          onChange={(checked: boolean) => setRememberChoice(checked)}
          label="Don't ask me again"
          layer="layer-1"
        />
      </div>
    </Modal>
  )
}
