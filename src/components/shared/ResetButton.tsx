/**
 * ResetButton
 *
 * A shared button that shows the "undo" icon and the label "Reset".
 * When clicked:
 *   - If the user has imported files, a modal appears asking whether to reset
 *     to the "imported" or "original" state. The resolved `resetTarget` is
 *     passed to the `onReset` callback.
 *   - If no files have been imported, `onReset('original')` is called directly.
 *
 * Usage:
 *   <ResetButton onReset={(target) => myReset(target)} layer="layer-0" />
 */
import { useState } from 'react'
import { Button } from '../adapters/Button'
import { Modal } from '../adapters/Modal'
import { RadioButtonGroup } from '../adapters/RadioButtonGroup'
import { RadioButtonItem } from '../adapters/RadioButtonItem'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import { getVarsStore } from '../../core/store/varsStore'

export type ResetTarget = 'imported' | 'original'

interface ResetButtonProps {
  /** Called with the selected reset target when the user confirms. */
  onReset: (target: ResetTarget) => void
  /** Variant forwarded to the Button adapter. Defaults to "outline". */
  variant?: 'solid' | 'outline' | 'text'
  /** Size forwarded to the Button adapter. Defaults to "small". */
  size?: 'default' | 'small'
  /** Layer forwarded to the Button adapter. Defaults to "layer-0". */
  layer?: 'layer-0' | 'layer-1' | 'layer-2' | 'layer-3'
  /** Modal title. Defaults to "Reset". */
  modalTitle?: string
  /** Modal body copy when no import files are present. */
  modalMessage?: string
  disabled?: boolean
  /** Optional override for the button label. Defaults to "Reset". */
  label?: string
}

export function ResetButton({
  onReset,
  variant = 'outline',
  size = 'small',
  layer = 'layer-0',
  modalTitle = 'Reset',
  modalMessage = 'This will discard all customisations and restore the default values.',
  disabled,
  label = 'Reset',
}: ResetButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<ResetTarget>('imported')

  const UndoIcon = iconNameToReactComponent('arrow-uturn-left')

  const handleClick = () => {
    const hasImported = getVarsStore().hasUserImportedFiles()
    if (hasImported) {
      setResetTarget('imported')
      setModalOpen(true)
    } else {
      onReset('original')
    }
  }

  const handleConfirm = () => {
    setModalOpen(false)
    onReset(resetTarget)
  }

  const hasImported = getVarsStore().hasUserImportedFiles()

  return (
    <>
      <Button
        variant={variant}
        size={size}
        layer={layer}
        onClick={handleClick}
        disabled={disabled}
        icon={UndoIcon ? <UndoIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} /> : undefined}
      >
        {label}
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        size="sm"
        layer="layer-1"
        primaryActionLabel="Reset"
        onPrimaryAction={handleConfirm}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setModalOpen(false)}
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: 'var(--recursica_brand_typography_body-small-font-size)', opacity: 0.75 }}>
              {modalMessage}
            </p>
            {hasImported && (
              <RadioButtonGroup label="Reset destination" required>
                <RadioButtonItem
                  selected={resetTarget === 'imported'}
                  onChange={() => setResetTarget('imported')}
                  label="Reset to last imported version"
                />
                <RadioButtonItem
                  selected={resetTarget === 'original'}
                  onChange={() => setResetTarget('original')}
                  label="Reset to app defaults"
                />
              </RadioButtonGroup>
            )}
          </div>
        }
      />
    </>
  )
}
