/**
 * DeleteVariantModal
 *
 * Lists all custom variants for the current component (across all axes)
 * and lets the user pick one to permanently delete.
 */

import { useState, useEffect } from 'react'
import { Modal } from '../../../components/adapters/Modal'
import { Dropdown } from '../../../components/adapters/Dropdown'
import type { DropdownItem } from '../../../components/adapters/Dropdown'
import { toSentenceCase } from '../utils/componentToolbarUtils'

export interface CustomVariantEntry {
  axis: string
  axisCategory: string
  name: string
}

export interface DeleteVariantModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (axisCategory: string, variantName: string) => void
  customVariants: CustomVariantEntry[]
}

export function DeleteVariantModal({
  isOpen,
  onClose,
  onConfirm,
  customVariants,
}: DeleteVariantModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>('')

  useEffect(() => {
    if (isOpen && customVariants.length > 0) {
      setSelectedKey(`${customVariants[0].axisCategory}:${customVariants[0].name}`)
    }
  }, [isOpen, customVariants])

  const items: DropdownItem[] = customVariants.map(v => ({
    value: `${v.axisCategory}:${v.name}`,
    label: `${toSentenceCase(v.name)} (${toSentenceCase(v.axis)})`,
  }))

  const handleConfirm = () => {
    const [axisCategory, variantName] = selectedKey.split(':')
    if (axisCategory && variantName) {
      onConfirm(axisCategory, variantName)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete variant"
      size="sm"
      layer="layer-1"
      primaryActionLabel="Delete variant"
      primaryActionDisabled={!selectedKey}
      onPrimaryAction={handleConfirm}
      secondaryActionLabel="Cancel"
      onSecondaryAction={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_md)' }}>
        <p style={{ margin: 0, fontSize: 'var(--recursica_brand_typography_body-small-font-size)', opacity: 0.75 }}>
          Deleting a variant cannot be undone. Only custom variants can be deleted.
        </p>
        <Dropdown
          label="Select variant to delete"
          items={items}
          value={selectedKey}
          onChange={setSelectedKey}
          layer="layer-1"
          layout="stacked"
          disableTopBottomMargin
        />
      </div>
    </Modal>
  )
}
