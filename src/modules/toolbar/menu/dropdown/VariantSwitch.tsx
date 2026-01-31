import { useMemo } from 'react'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import { getVariantIcon, getVariantLabel } from '../../utils/loadToolbarConfig'
import { Switch } from '../../../../components/adapters/Switch'
import './Dropdown.css'

interface VariantSwitchProps {
  componentName: string
  propName: string
  variants: string[]
  selected: string
  onSelect: (variant: string) => void
  className?: string
}

export default function VariantSwitch({ componentName, propName, variants, selected, onSelect, className = '' }: VariantSwitchProps) {
  // Get icon for variant prop type from toolbar config
  const getIconComponent = () => {
    const iconName = getVariantIcon(componentName, propName)
    if (iconName) {
      return iconNameToReactComponent(iconName)
    }
    return null
  }

  const IconComponent = getIconComponent()
  const variantLabel = getVariantLabel(componentName, propName) || propName

  // Determine which variant is "true" (checked) and which is "false" (unchecked)
  // Common patterns: true/false, yes/no, on/off, enabled/disabled, show/hide
  const { checkedVariant, uncheckedVariant } = useMemo(() => {
    const normalizedVariants = variants.map(v => v.toLowerCase())
    
    // Check for true/false
    if (normalizedVariants.includes('true') && normalizedVariants.includes('false')) {
      return { checkedVariant: 'true', uncheckedVariant: 'false' }
    }
    
    // Check for yes/no
    if (normalizedVariants.includes('yes') && normalizedVariants.includes('no')) {
      return { checkedVariant: 'yes', uncheckedVariant: 'no' }
    }
    
    // Check for on/off
    if (normalizedVariants.includes('on') && normalizedVariants.includes('off')) {
      return { checkedVariant: 'on', uncheckedVariant: 'off' }
    }
    
    // Check for enabled/disabled
    if (normalizedVariants.includes('enabled') && normalizedVariants.includes('disabled')) {
      return { checkedVariant: 'enabled', uncheckedVariant: 'disabled' }
    }
    
    // Check for show/hide
    if (normalizedVariants.includes('show') && normalizedVariants.includes('hide')) {
      return { checkedVariant: 'show', uncheckedVariant: 'hide' }
    }
    
    // Default: first variant is checked, second is unchecked
    return { checkedVariant: variants[0], uncheckedVariant: variants[1] || variants[0] }
  }, [variants])

  // Determine if switch should be checked based on selected variant
  const isChecked = useMemo(() => {
    const normalizedSelected = selected.toLowerCase()
    return normalizedSelected === checkedVariant.toLowerCase()
  }, [selected, checkedVariant])

  const handleChange = (checked: boolean) => {
    const newVariant = checked ? checkedVariant : uncheckedVariant
    onSelect(newVariant)
  }

  return (
    <div className={`variant-dropdown-container ${className}`}>
      <div className="variant-dropdown-wrapper">
        {/* Label section - styled like accordion header */}
        <div className="variant-label-section">
          {IconComponent && <IconComponent className="variant-label-icon" />}
          <span className="variant-label-text">{variantLabel}</span>
        </div>
        
        {/* Switch section */}
        <div className="variant-dropdown-section">
          <Switch
            checked={isChecked}
            onChange={handleChange}
            layer="layer-0"
          />
        </div>
      </div>
    </div>
  )
}
