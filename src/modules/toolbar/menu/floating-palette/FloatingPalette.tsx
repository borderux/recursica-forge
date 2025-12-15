import { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import './FloatingPalette.css'

export interface FloatingPaletteProps {
  anchorElement: HTMLElement | null
  title: string
  children: ReactNode
  onClose: () => void
  draggable?: boolean
  className?: string
}

export default function FloatingPalette({
  anchorElement,
  title,
  children,
  onClose,
  draggable = true,
  className = '',
}: FloatingPaletteProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  // Calculate initial position based on anchor element
  useEffect(() => {
    if (!anchorElement) {
      setPosition(null)
      return
    }

    const calculatePosition = () => {
      const rect = anchorElement.getBoundingClientRect()
      
      // Position at the same Y as dropdown menus (4px below the button, matching dropdown-menu CSS)
      let x = rect.left
      let y = rect.bottom + 4 // Same as dropdown-menu: top: calc(100% + 4px)
      
      // Use estimated dimensions (will be adjusted after render if needed)
      const controlWidth = 280 // min-width from CSS
      const controlHeight = 200 // estimated height
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Adjust if it would go off the right edge
      if (x + controlWidth > screenWidth) {
        x = screenWidth - controlWidth - 16 // 16px margin from edge
      }
      
      // Adjust if it would go off the left edge
      if (x < 16) {
        x = 16
      }
      
      // Adjust if it would go off the bottom edge
      if (y + controlHeight > screenHeight) {
        // Try positioning above the button instead
        y = rect.top - controlHeight - 4
        // If still off screen, position at top of screen
        if (y < 16) {
          y = 16
        }
      }
      
      setPosition({ x, y })
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(calculatePosition)
  }, [anchorElement])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging || !draggable) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, draggable])

  // Removed click-outside handler - palette can only be closed via the X button

  if (!position) {
    return null
  }

  const CloseIcon = iconNameToReactComponent('x-mark')

  return createPortal(
    <div
      ref={ref}
      className={`floating-palette ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div
        className="floating-palette-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: draggable ? 'grab' : 'default' }}
      >
        <span className="floating-palette-title">{title}</span>
        <button
          className="floating-palette-close"
          onClick={onClose}
          aria-label="Close"
        >
          {CloseIcon && <CloseIcon className="floating-palette-close-icon" />}
        </button>
      </div>
      <div className="floating-palette-body">
        {children}
      </div>
    </div>,
    document.body
  )
}

