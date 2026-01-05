import { useState, useRef, useEffect, useCallback } from 'react'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import './Dropdown.css'

interface LayerDropdownProps {
  selected: string
  onSelect: (layer: string) => void
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export default function LayerDropdown({ selected, onSelect, open: controlledOpen, onOpenChange, className = '' }: LayerDropdownProps) {
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

  const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

  // Layer icon (hardcoded since it's system-level, not component-specific)
  const LayerIcon = iconNameToReactComponent('square-3-stack-3d')
  const CaretDownIcon = iconNameToReactComponent('chevron-down')
  const selectedLabel = selected.charAt(0).toUpperCase() + selected.slice(1).replace('-', ' ')

  return (
    <div className={`dropdown-container ${className}`} ref={ref}>
      <button
        className={`toolbar-icon-button ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Layer"
        aria-label="Layer"
      >
        {LayerIcon && <LayerIcon className="toolbar-icon" />}
        <span className="dropdown-label-value">
          <span className="dropdown-label">Layer</span>
        </span>
        <span className="dropdown-value">{selectedLabel}</span>
        {CaretDownIcon && <CaretDownIcon className={`dropdown-chevron ${open ? 'flipped' : ''}`} />}
      </button>
      {open && (
        <div className="dropdown-menu">
          {layers.map(layer => (
            <button
              key={layer}
              className={`dropdown-item ${selected === layer ? 'selected' : ''}`}
              onClick={() => {
                onSelect(layer)
                setOpen(false)
              }}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

