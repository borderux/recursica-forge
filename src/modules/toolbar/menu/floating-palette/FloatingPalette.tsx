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

  // Calculate position based on anchor element
  // Update position when anchor element changes or page scrolls/resizes
  useEffect(() => {
    if (!anchorElement) {
      setPosition(null)
      return
    }

    const calculatePosition = () => {
      const rect = anchorElement.getBoundingClientRect()
      
      // For absolute positioning, we need to account for scroll position
      // getBoundingClientRect() gives viewport coordinates, so we add scroll offsets
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0
      
      // Position at the same Y as dropdown menus (4px below the button, matching dropdown-menu CSS)
      let x = rect.left + scrollX
      let y = rect.bottom + scrollY + 4 // Same as dropdown-menu: top: calc(100% + 4px)
      
      // Use estimated dimensions (will be adjusted after render if needed)
      const controlWidth = 280 // min-width from CSS
      const controlHeight = 200 // estimated height
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Adjust if it would go off the right edge (viewport-relative check)
      if (rect.left + controlWidth > screenWidth) {
        x = rect.right + scrollX - controlWidth
        // If still off, align to right edge of viewport
        if (x < scrollX) {
          x = scrollX + screenWidth - controlWidth - 16 // 16px margin from edge
        }
      }
      
      // Adjust if it would go off the left edge (viewport-relative check)
      if (rect.left < 16) {
        x = scrollX + 16
      }
      
      // Adjust if it would go off the bottom edge (viewport-relative check)
      if (rect.bottom + controlHeight > screenHeight) {
        // Try positioning above the button instead
        y = rect.top + scrollY - controlHeight - 4
        // If still off screen, position at top of viewport
        if (rect.top < 16) {
          y = scrollY + 16
        }
      }
      
      setPosition({ x, y })
    }

    // Calculate initial position
    calculatePosition()

    // Update position on scroll and resize
    const handleScroll = () => {
      calculatePosition()
    }
    const handleResize = () => {
      calculatePosition()
    }

    window.addEventListener('scroll', handleScroll, true) // Use capture to catch all scroll events
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [anchorElement])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !ref.current || !position) return
    
    const scrollX = window.scrollX || window.pageXOffset || 0
    const scrollY = window.scrollY || window.pageYOffset || 0
    
    // Calculate offset from mouse position to element position
    // For absolute positioning, we need document coordinates
    setDragStart({
      x: e.clientX + scrollX - position.x,
      y: e.clientY + scrollY - position.y,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging || !draggable) return

    const handleMouseMove = (e: MouseEvent) => {
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0
      
      // Convert viewport coordinates to document coordinates for absolute positioning
      setPosition({
        x: e.clientX + scrollX - dragStart.x,
        y: e.clientY + scrollY - dragStart.y,
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

  // Force position: absolute on the DOM element to override any other styles
  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('position', 'absolute', 'important')
    }
  }, [])

  if (!position) {
    return null
  }

  const CloseIcon = iconNameToReactComponent('x-mark')

  return createPortal(
    <div
      ref={ref}
      className={`floating-palette ${className}`}
      style={{
        position: 'absolute',
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

