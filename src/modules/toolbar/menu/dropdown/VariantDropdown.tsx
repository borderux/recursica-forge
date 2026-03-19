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
  onCreateVariant?: () => void
  className?: string
}

const NEW_VARIANT_SENTINEL = '__new_variant__'

export default function VariantDropdown({
  componentName,
  propName,
  variants,
  selected,
  onSelect,
  onCreateVariant,
  className = ''
}: VariantDropdownProps) {
  const variantLabel = getVariantLabel(componentName, propName) || toSentenceCase(propName)

  // Map variants to DropdownItem format, appending "New variant…" as a special entry
  const items: DropdownItem[] = useMemo(() => {
    const baseItems: DropdownItem[] = variants.map(v => ({
      value: v,
      label: toSentenceCase(v)
    }))

    baseItems.push({
      value: NEW_VARIANT_SENTINEL,
      label: 'New variant',
      divider: 'none',
      leadingIconType: 'icon',
      leadingIcon: (
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }}>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    })

    return baseItems
  }, [variants])

  const handleChange = (value: string) => {
    if (value === NEW_VARIANT_SENTINEL) {
      onCreateVariant?.()
    } else {
      onSelect(value)
    }
  }

  return (
    <div className={`variant-dropdown-container ${className}`}>
      <Dropdown
        label={variantLabel}
        items={items}
        value={selected}
        onChange={handleChange}
        layout="side-by-side"
        labelSize="small"
        layer="layer-0"
        disableTopBottomMargin={true}
      />
    </div>
  )
}
