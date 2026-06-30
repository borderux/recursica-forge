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
import { RadioButtonGroup } from '../../../components/adapters/RadioButtonGroup'
import { RadioButtonItem } from '../../../components/adapters/RadioButtonItem'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { OnToneConflict } from '../../../core/css/onToneInterceptor'
import { resolveOnToneConflict, formatSiblingList, formatPropLabel } from '../../../core/css/onToneInterceptor'

export interface OnToneModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: OnToneConflict | null
}

export function OnToneModal({ isOpen, onClose, conflict }: OnToneModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<'update' | 'skip'>('update')
  const { mode } = useThemeMode()
  const layerElements = `--recursica_brand_themes_${mode}_layers_layer-1_elements`

  if (!conflict) return null

  const siblingLabel = formatSiblingList(conflict.siblings)
  const changedPropLabel = formatPropLabel(conflict.changedPropKey).toLowerCase()

  const handleApply = () => {
    const savedConflict = conflict
    onClose()
    queueMicrotask(() => {
      resolveOnToneConflict(selectedChoice, savedConflict, false)
    })
  }

  const handleCancel = () => {
    resolveOnToneConflict('skip', conflict, false)
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
      onClose={handleCancel}
      title="Change related colors?"
      size={640}
      layer="layer-1"
      primaryActionLabel="Ok"
      onPrimaryAction={handleApply}
      showSecondaryButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ ...bodyStyle, marginBottom: '4px' }}>
          You've changed the background color of this layer. To keep the content readable, would you also like to update the text and icon colors to contrast with the new background?
        </p>

        <RadioButtonGroup
          layout="stacked"
          layer="layer-1"
          orientation="vertical"
        >
          <RadioButtonItem
            label={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginLeft: '8px' }}>
                <span style={{ fontWeight: 600 }}>Update colors (Recommended)</span>
                <span style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.4 }}>
                  Automatically changes text, hover states, and icons to contrast properly with your new background.
                </span>
              </div>
            }
            value="update"
            selected={selectedChoice === 'update'}
            onChange={() => setSelectedChoice('update')}
            layer="layer-1"
          />
          <RadioButtonItem
            label={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginLeft: '8px' }}>
                <span style={{ fontWeight: 600 }}>Keep current colors</span>
                <span style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.4 }}>
                  Leaves all text and icon colors unchanged. Warning: this may result in low contrast and poor readability.
                </span>
              </div>
            }
            value="skip"
            selected={selectedChoice === 'skip'}
            onChange={() => setSelectedChoice('skip')}
            layer="layer-1"
          />
        </RadioButtonGroup>
      </div>
    </Modal>
  )
}
