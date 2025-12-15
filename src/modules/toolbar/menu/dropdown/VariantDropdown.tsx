import { useState, useRef, useEffect, useCallback } from 'react'
import { toSentenceCase } from '../../utils/componentToolbarUtils'
import propIconMapping from '../../utils/propIconMapping.json'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import './Dropdown.css'

interface VariantDropdownProps {
  propName: string
  variants: string[]
  selected: string
  onSelect: (variant: string) => void
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export default function VariantDropdown({ propName, variants, selected, onSelect, open: controlledOpen, onOpenChange }: VariantDropdownProps) {
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

  // Get icon for variant prop type from mapping
  const getIcon = () => {
    const mappingKey = `variant-${propName}`
    const iconName = (propIconMapping as Record<string, string>)[mappingKey]
    if (iconName) {
      const IconComponent = iconNameToReactComponent(iconName)
      if (IconComponent) {
        return <IconComponent className="toolbar-icon" />
      }
    }
    return null
  }

  const icon = getIcon()
  const CaretDownIcon = iconNameToReactComponent('chevron-down')

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className={`toolbar-icon-button ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title={`${toSentenceCase(propName)} variant`}
        aria-label={`${toSentenceCase(propName)} variant`}
      >
        {icon}
        {CaretDownIcon && <CaretDownIcon className={`dropdown-chevron ${open ? 'flipped' : ''}`} />}
      </button>
      {open && (
        <div className="dropdown-menu">
          {variants.map(variant => {
            const isSelected = selected === variant
            return (
              <button
                key={variant}
                className={`dropdown-item ${isSelected ? 'selected' : ''}`}
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
  )
}

