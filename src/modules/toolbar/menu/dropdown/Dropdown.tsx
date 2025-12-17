import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import './Dropdown.css'

export interface DropdownItem {
  key: string
  label: ReactNode
  selected?: boolean
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  onSelect: (key: string) => void
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  open: controlledOpen,
  onOpenChange,
  className = '',
}: DropdownProps) {
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

  const handleItemClick = (key: string) => {
    onSelect(key)
    setOpen(false)
  }

  return (
    <div className={`dropdown-container ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div className="dropdown-menu">
          {items.map(item => (
            <button
              key={item.key}
              className={`dropdown-item ${item.selected ? 'selected' : ''}`}
              onClick={() => handleItemClick(item.key)}
              aria-selected={item.selected}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

