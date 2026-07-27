/**
 * EditVariantModal
 *
 * Edits a custom variant: rename it (Save) or delete it. When the component has more than one
 * custom variant, a picker selects which one to edit. Opened by the "Edit variant" button in the
 * toolbar footer (only enabled when custom variants exist).
 */

import { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { TextField } from '../../../components/adapters/TextField'
import { Dropdown } from '../../../components/adapters/Dropdown'
import type { DropdownItem } from '../../../components/adapters/Dropdown'
import { validateVariantName, normalizeVariantName } from '../../../core/uikit/createVariantInUIKit'
import { toSentenceCase } from '../utils/componentToolbarUtils'

export interface CustomVariantEntry {
  axis: string
  axisCategory: string
  name: string
}

export interface EditVariantModalProps {
  isOpen: boolean
  onClose: () => void
  onRename: (axisCategory: string, oldName: string, newName: string) => void
  onDelete: (axisCategory: string, variantName: string) => void
  customVariants: CustomVariantEntry[]
  /** All variant names (built-in + custom) per axisCategory, for uniqueness validation. */
  existingNamesByAxis: Record<string, string[]>
}

/** Stored keys are lowercase/hyphenated; show them de-normalized (spaces) so they're editable
 *  under the "letters and spaces only" rule, then re-normalize on save. */
function denormalize(name: string): string {
  return name.replace(/-/g, ' ')
}

export function EditVariantModal({
  isOpen,
  onClose,
  onRename,
  onDelete,
  customVariants,
  existingNamesByAxis,
}: EditVariantModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [nameError, setNameError] = useState<string | null>(null)

  const selected = useMemo(() => {
    const [axisCategory, ...rest] = selectedKey.split(':')
    const variantName = rest.join(':')
    return customVariants.find(v => v.axisCategory === axisCategory && v.name === variantName) ?? null
  }, [selectedKey, customVariants])

  // Reset selection + prefill the name when opened or when the chosen variant changes.
  useEffect(() => {
    if (isOpen && customVariants.length > 0) {
      setSelectedKey(`${customVariants[0].axisCategory}:${customVariants[0].name}`)
    }
  }, [isOpen, customVariants])

  // Prefill the name field with the current variant's name whenever the modal opens or the
  // selected variant changes — gated on isOpen so reopening always repopulates (even if the user
  // had cleared the field and the selected variant reference is unchanged).
  useEffect(() => {
    if (isOpen && selected) {
      setName(denormalize(selected.name))
      setNameError(null)
    }
  }, [isOpen, selected])

  // Names on the selected variant's axis, excluding the variant itself (so keeping the name is valid).
  const otherNames = useMemo(() => {
    if (!selected) return []
    return (existingNamesByAxis[selected.axisCategory] ?? []).filter(n => n !== selected.name)
  }, [selected, existingNamesByAxis])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    setNameError(value ? validateVariantName(value, otherNames) : null)
  }

  const handleSave = () => {
    if (!selected) return
    const err = validateVariantName(name, otherNames)
    if (err) { setNameError(err); return }
    onRename(selected.axisCategory, selected.name, normalizeVariantName(name))
    onClose()
  }

  const handleDelete = () => {
    if (!selected) return
    onDelete(selected.axisCategory, selected.name)
    onClose()
  }

  const items: DropdownItem[] = customVariants.map(v => ({
    value: `${v.axisCategory}:${v.name}`,
    label: `${toSentenceCase(v.name)} (${toSentenceCase(v.axis)})`,
  }))

  const isValid = name.trim().length > 0 && !nameError

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit variant"
      size="sm"
      layer="layer-1"
      primaryActionLabel="Save"
      primaryActionDisabled={!isValid}
      onPrimaryAction={handleSave}
      secondaryActionLabel="Delete variant"
      onSecondaryAction={handleDelete}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_md)' }}>
        {customVariants.length > 1 && (
          <Dropdown
            label="Variant"
            items={items}
            value={selectedKey}
            onChange={setSelectedKey}
            layer="layer-1"
            layout="stacked"
            disableTopBottomMargin
          />
        )}

        <TextField
          label="Variant name"
          helpText="Letters and spaces only."
          value={name}
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
