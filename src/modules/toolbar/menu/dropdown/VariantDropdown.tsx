import { useMemo } from 'react'
import { toSentenceCase } from '../../utils/componentToolbarUtils'
import { getVariantLabel } from '../../utils/loadToolbarConfig'
import { Dropdown } from '../../../../components/adapters/Dropdown'
import type { DropdownItem } from '../../../../components/adapters/Dropdown'
import './Dropdown.css'

interface VariantDropdownProps {
  componentName: string
  propName: string
  variants: string[]
  selected: string
  onSelect: (variant: string) => void
  className?: string
}

export default function VariantDropdown({
  componentName,
  propName,
  variants,
  selected,
  onSelect,
  className = ''
}: VariantDropdownProps) {
  const variantLabel = getVariantLabel(componentName, propName) || toSentenceCase(propName)

  // Map variants to DropdownItem format
  const items: DropdownItem[] = useMemo(() => {
    return variants.map(v => ({
      value: v,
      label: toSentenceCase(v)
    }))
  }, [variants])

  return (
    <div className={`variant-dropdown-container ${className}`}>
      <Dropdown
        label={variantLabel}
        items={items}
        value={selected}
        onChange={onSelect}
        layout="side-by-side"
        labelSize="small"
        layer="layer-0"
        disableTopBottomMargin={true}
      />
    </div>
  )
}
