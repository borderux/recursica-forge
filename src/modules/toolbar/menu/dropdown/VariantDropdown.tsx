import { useState, useRef, useEffect, useCallback } from 'react'
import { toSentenceCase } from '../../utils/componentToolbarUtils'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import { getVariantIcon, getVariantLabel } from '../../utils/loadToolbarConfig'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import './Dropdown.css'

interface VariantDropdownProps {
  componentName: string
  propName: string
  variants: string[]
  selected: string
  onSelect: (variant: string) => void
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export default function VariantDropdown({ componentName, propName, variants, selected, onSelect, open: controlledOpen, onOpenChange, className = '' }: VariantDropdownProps) {
  const { mode } = useThemeMode()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const ref = useRef<HTMLDivElement>(null)
  
  const setOpen = useCallback((isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen)
    } else {
      setInternalOpen(isOpen)
    }
  }, [onOpenChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])
  
  // Sync internal state with controlled prop
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setInternalOpen(controlledOpen)
    }
  }, [controlledOpen])

  // Get icon for variant prop type from toolbar config
  const getIconComponent = () => {
    const iconName = getVariantIcon(componentName, propName)
    if (iconName) {
      return iconNameToReactComponent(iconName)
    }
    return null
  }

  const IconComponent = getIconComponent()
  const CaretDownIcon = iconNameToReactComponent('chevron-down')
  const variantLabel = getVariantLabel(componentName, propName) || toSentenceCase(propName)
  const selectedValue = toSentenceCase(selected)

  return (
    <div className={`variant-dropdown-container ${className}`} ref={ref}>
      <div className="variant-dropdown-wrapper">
        {/* Label section - styled like accordion header */}
        <div className="variant-label-section">
          {IconComponent && <IconComponent className="variant-label-icon" />}
          <span className="variant-label-text">{variantLabel}</span>
        </div>
        
        {/* Dropdown section - only the value */}
        <div className="variant-dropdown-section">
          <button
            className={`variant-dropdown-button ${open ? 'active' : ''}`}
            onClick={() => setOpen(!open)}
            title={selectedValue}
            aria-label={`${variantLabel}: ${selectedValue}`}
          >
            <span className="variant-dropdown-value">{selectedValue}</span>
            {CaretDownIcon && <CaretDownIcon className={`variant-dropdown-chevron ${open ? 'flipped' : ''}`} />}
          </button>
          {open && (
            <div className="variant-dropdown-menu">
              {variants.map(variant => {
                const isSelected = selected === variant
                return (
                  <button
                    key={variant}
                    className={`variant-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelect(variant)
                      setOpen(false)
                    }}
                    aria-selected={isSelected}
                  >
                    {toSentenceCase(variant)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

