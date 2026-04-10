/**
 * GlobalRefModal
 *
 * Shown when a user edits a component property that is backed by a
 * shared `{ui-kit.globals.*}` reference.  Asks whether to update the
 * global (affecting all components that share it) or override just
 * the current component.
 */

import { useState } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { CheckboxItem } from '../../../components/adapters/CheckboxItem'
import { useThemeMode } from '../../theme/ThemeModeContext'
import type { GlobalRefConflict } from '../../../core/css/globalRefInterceptor'
import { resolveGlobalRefConflict } from '../../../core/css/globalRefInterceptor'

export interface GlobalRefModalProps {
  isOpen: boolean
  onClose: () => void
  conflict: GlobalRefConflict | null
}

export function GlobalRefModal({ isOpen, onClose, conflict }: GlobalRefModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false)
  const { mode } = useThemeMode()
  const layerElements = `--recursica_brand_themes_${mode}_layers_layer-1_elements`

  if (!conflict) return null

  const handleOverride = () => {
    resolveGlobalRefConflict('override', conflict, rememberChoice)
    setRememberChoice(false)
    onClose()
  }

  const handleUpdateGlobal = () => {
    const savedConflict = conflict
    const savedRemember = rememberChoice
    setRememberChoice(false)
    onClose()
    // Defer the actual DOM mutations so they don't trigger the Mantine Modal's
    // MutationObserver while the modal is still in its closing transition.
    queueMicrotask(() => {
      resolveGlobalRefConflict('update-global', savedConflict, savedRemember)
    })
  }

  const handleClose = () => {
    // Closing without choosing = keep the override (same as "Override")
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
      title="Shared Property"
      size={720}
      layer="layer-1"
      primaryActionLabel="Update all"
      onPrimaryAction={handleUpdateGlobal}
      secondaryActionLabel={`${conflict.componentName} only`}
      onSecondaryAction={handleOverride}
      showSecondaryButton={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={bodyStyle}>
          This property is shared across multiple components via{' '}
          <strong>{conflict.globalRefLabel}</strong>.
        </p>
        <p style={bodyStyle}>
          Would you like to update it everywhere, or only override it for{' '}
          <strong>{conflict.componentName}</strong>?
        </p>

        <CheckboxItem
          checked={rememberChoice}
          onChange={(checked: boolean) => setRememberChoice(checked)}
          label="Remember my choice"
          layer="layer-1"
        />
      </div>
    </Modal>
  )
}

