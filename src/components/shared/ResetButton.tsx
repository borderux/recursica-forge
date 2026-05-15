/**
 * ResetButton
 *
 * A shared button that shows the "undo" icon and the label "Reset".
 * - No imported files: calls onReset('original') immediately (no modal).
 * - Has imported files: shows a modal so the user can choose between
 *   "reset to imported" or "reset to app defaults".
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
  disabled?: boolean
  /** Optional override for the button label. Defaults to "Reset". */
  label?: string
}

export function ResetButton({
  onReset,
  variant = 'outline',
  size = 'small',
  layer = 'layer-0',
  disabled,
  label = 'Reset',
}: ResetButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<ResetTarget>('imported')

  const UndoIcon = iconNameToReactComponent('arrow-uturn-left')

  const handleClick = () => {
    if (getVarsStore().hasUserImportedFiles()) {
      setResetTarget('imported')
      setModalOpen(true)
    } else {
      onReset('original')
    }
  }

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
        title="Reset"
        size="sm"
        layer="layer-1"
        primaryActionLabel="Reset"
        onPrimaryAction={() => {
          setModalOpen(false)
          onReset(resetTarget)
        }}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => setModalOpen(false)}
        content={
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
        }
      />
    </>
  )
}
