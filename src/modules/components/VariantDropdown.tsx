import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { toSentenceCase } from './componentToolbarUtils'
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

  // Get icon for variant prop type
  const getIcon = () => {
    if (propName === 'color') {
      return (
        <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    }
    if (propName === 'size') {
      return (
        <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <path d="M3 21h18" />
          <path d="M3 7h18" />
          <path d="M3 3v18" />
          <path d="M21 3v18" />
        </svg>
      )
    }
    return null
  }

  const icon = getIcon()

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className={`toolbar-icon-button ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title={`${toSentenceCase(propName)} variant`}
        aria-label={`${toSentenceCase(propName)} variant`}
      >
        {icon}
        <ChevronDownIcon className={`dropdown-chevron ${open ? 'flipped' : ''}`} />
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
