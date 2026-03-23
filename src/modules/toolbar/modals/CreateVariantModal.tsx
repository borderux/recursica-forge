/**
 * CreateVariantModal
 *
 * Allows the user to:
 *  1. Choose a source variant to clone from (on an existing axis)
 *  2. Optionally name a NEW axis (only shown when the component has zero variant axes)
 *  3. Name the new variant
 *
 * Opened by VariantDropdown when the user selects "New variant…"
 * or by the "Add variant" button in the toolbar header for zero-variant components.
 */

import { useState, useEffect } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { TextField } from '../../../components/adapters/TextField'
import { Dropdown } from '../../../components/adapters/Dropdown'
import type { DropdownItem } from '../../../components/adapters/Dropdown'
import { validateVariantName, validateAxisName, axisToCategoryKey, normalizeVariantName } from '../../../core/uikit/createVariantInUIKit'
import { toSentenceCase } from '../utils/componentToolbarUtils'

export interface CreateVariantModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (axisCategory: string, sourceVariantName: string, newVariantName: string) => void
  /** Toolbar prop-name for the axis, e.g. "style". Pre-populated when opened from a dropdown. */
  axisName: string
  /** Existing variant names on this axis (used for uniqueness validation). */
  existingVariantNames: string[]
  /** If true, the user also needs to input an axis name (zero-variant component). */
  showAxisField?: boolean
  /** Existing axis names on the component (used for axis uniqueness validation). */
  existingAxisNames?: string[]
}

export function CreateVariantModal({
  isOpen,
  onClose,
  onConfirm,
  axisName,
  existingVariantNames,
  showAxisField = false,
  existingAxisNames = [],
}: CreateVariantModalProps) {
  const [sourceVariant, setSourceVariant] = useState<string>('')
  const [customAxisName, setCustomAxisName] = useState<string>('')
  const [newName, setNewName] = useState<string>('')
  const [axisError, setAxisError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSourceVariant(existingVariantNames[0] ?? '')
      setCustomAxisName('')
      setNewName('')
      setAxisError(null)
      setNameError(null)
    }
  }, [isOpen, existingVariantNames])

  const handleAxisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomAxisName(value)
    if (value) {
      setAxisError(validateAxisName(axisToCategoryKey(value), existingAxisNames))
    } else {
      setAxisError(null)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewName(value)
    if (value) {
      setNameError(validateVariantName(value, existingVariantNames))
    } else {
      setNameError(null)
    }
  }

  const handleConfirm = () => {
    const resolvedAxis = showAxisField ? axisToCategoryKey(customAxisName) : axisToCategoryKey(axisName)
    const axisErr = showAxisField ? validateAxisName(customAxisName, existingAxisNames) : null
    const nameErr = validateVariantName(newName, existingVariantNames)

    if (axisErr) { setAxisError(axisErr); return }
    if (nameErr) { setNameError(nameErr); return }

    onConfirm(resolvedAxis, sourceVariant, normalizeVariantName(newName))
    onClose()
  }

  const sourceItems: DropdownItem[] = existingVariantNames.map(v => ({
    value: v,
    label: toSentenceCase(v),
  }))

  const isValid =
    newName.trim().length > 0 &&
    !nameError &&
    (!showAxisField || (customAxisName.trim().length > 0 && !axisError))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New variant"
      size="sm"
      layer="layer-1"
      primaryActionLabel="Create variant"
      primaryActionDisabled={!isValid}
      onPrimaryAction={handleConfirm}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_md)' }}>
        {showAxisField && (
          <TextField
            label="Axis name"
            helpText='e.g. "style", "size", "layout"'
            value={customAxisName}
            onChange={handleAxisChange}
            errorText={axisError ?? undefined}
            state={axisError ? 'error' : 'default'}
            layer="layer-1"
            layout="stacked"
            disableTopBottomMargin
          />
        )}

        {existingVariantNames.length > 0 && (
          <Dropdown
            label="Clone from"
            items={sourceItems}
            value={sourceVariant}
            onChange={setSourceVariant}
            layer="layer-1"
            layout="stacked"
            disableTopBottomMargin
          />
        )}

        <TextField
          label="Variant name"
          helpText="Letters and spaces only."
          value={newName}
          onChange={handleNameChange}
          errorText={nameError ?? undefined}
          state={nameError ? 'error' : 'default'}
          layer="layer-1"
          layout="stacked"
          disableTopBottomMargin
        />
      </div>
    </Modal>
  )
}
