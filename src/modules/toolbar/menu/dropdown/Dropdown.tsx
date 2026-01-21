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
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  
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

  // Calculate menu position to prevent it from going off-screen
  useEffect(() => {
    if (!open || !ref.current || !menuRef.current) {
      setMenuStyle({})
      return
    }

    const calculatePosition = () => {
      const containerRect = ref.current!.getBoundingClientRect()
      const menuRect = menuRef.current!.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const margin = 8 // Minimum margin from viewport edge

      const style: React.CSSProperties = {}

      // Check if menu would go off the right edge
      if (containerRect.left + menuRect.width > viewportWidth - margin) {
        // Align to right edge of trigger
        style.right = '0'
        style.left = 'auto'
        // If still off-screen, align to viewport right edge
        if (containerRect.right - menuRect.width < margin) {
          const rightOffset = viewportWidth - containerRect.right - margin
          style.right = `${Math.max(margin, rightOffset)}px`
          style.left = 'auto'
        }
      }

      // Check if menu would go off the bottom edge
      if (containerRect.bottom + menuRect.height > viewportHeight - margin) {
        // Position above the trigger instead
        style.bottom = 'calc(100% + 4px)'
        style.top = 'auto'
      }

      setMenuStyle(style)
    }

    // Calculate position after menu is rendered
    const rafId = requestAnimationFrame(() => {
      calculatePosition()
      // Also calculate after a small delay to ensure dimensions are stable
      setTimeout(calculatePosition, 0)
    })
    
    // Recalculate on scroll and resize
    window.addEventListener('scroll', calculatePosition, true)
    window.addEventListener('resize', calculatePosition)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', calculatePosition, true)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [open])

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
        <div className="dropdown-menu" ref={menuRef} style={menuStyle}>
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

