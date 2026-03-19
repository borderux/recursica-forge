import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import { genericLayerProperty, genericLayerText } from '../../../../core/css/cssVarBuilder'
import { getElevationBoxShadow, parseElevationValue } from '../../../../components/utils/brandCssVars'
import { getComponentLevelCssVar } from '../../../../components/utils/cssVarNames'
import { readCssVar } from '../../../../core/css/readCssVar'
import { Button } from '../../../../components/adapters/Button'
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
  const { mode } = useThemeMode()
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)
  // Guard to prevent the post-render adjustment running in a loop
  const positionAdjusted = useRef(false)

  // Forge design system tokens — use Modal component tokens to match its appearance
  const elevationVar = getComponentLevelCssVar('Modal', 'elevation')
  const elevation = getElevationBoxShadow(mode, parseElevationValue(readCssVar(elevationVar)))
  const borderRadiusVar = getComponentLevelCssVar('Modal', 'border-radius')
  const surface = `var(${genericLayerProperty(3, 'surface')})`
  const borderColor = `var(${genericLayerProperty(3, 'border-color')})`
  const borderRadius = `var(${borderRadiusVar})`
  const padding = `var(${genericLayerProperty(3, 'padding')})`
  const textColor = `var(${genericLayerText(3, 'color')})`

  // Calculate position from the anchor element using page coordinates
  useEffect(() => {
    if (!anchorElement) {
      setPosition(null)
      return
    }
    positionAdjusted.current = false

    const calculatePosition = () => {
      const rect = anchorElement.getBoundingClientRect()
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0

      // Default: open below the anchor, aligned to its left edge
      let x = rect.left + scrollX
      let y = rect.bottom + scrollY + 4

      // Right-edge guard: align right edge of palette with right edge of anchor
      const knownWidth = ref.current?.offsetWidth || 300
      if (rect.left + knownWidth > window.innerWidth - 16) {
        x = Math.max(scrollX + 16, rect.right + scrollX - knownWidth)
      }

      setPosition({ x, y })
      // Allow the post-render adjustment to re-run on each new calculation
      positionAdjusted.current = false
    }

    calculatePosition()
    window.addEventListener('scroll', calculatePosition, true)
    window.addEventListener('resize', calculatePosition)
    return () => {
      window.removeEventListener('scroll', calculatePosition, true)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [anchorElement])

  // After the palette renders with real dimensions, flip it above the anchor if it
  // would overflow the bottom of the viewport. Uses actual height, not an estimate.
  useLayoutEffect(() => {
    if (!ref.current || !position || !anchorElement || positionAdjusted.current) return
    positionAdjusted.current = true

    const rect = anchorElement.getBoundingClientRect()
    const actualHeight = ref.current.offsetHeight
    const actualWidth = ref.current.offsetWidth
    const scrollY = window.scrollY || 0
    const scrollX = window.scrollX || 0

    let { x: newX, y: newY } = position
    let changed = false

    // Flip above if bottom would overflow the viewport
    const viewportBottom = (newY - scrollY) + actualHeight
    if (viewportBottom > window.innerHeight - 16) {
      const aboveY = rect.top + scrollY - actualHeight - 4
      newY = aboveY > scrollY + 16
        ? aboveY
        : Math.max(scrollY + 16, scrollY + window.innerHeight - actualHeight - 16)
      changed = true
    }

    // Re-check horizontal after we know the actual width
    const viewportRight = (newX - scrollX) + actualWidth
    if (viewportRight > window.innerWidth - 16) {
      newX = Math.max(scrollX + 16, rect.right + scrollX - actualWidth)
      changed = true
    }

    if (changed) setPosition({ x: newX, y: newY })
  }, [position, anchorElement])

  // Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !ref.current || !position) return
    const scrollX = window.scrollX || window.pageXOffset || 0
    const scrollY = window.scrollY || window.pageYOffset || 0
    setDragStart({ x: e.clientX + scrollX - position.x, y: e.clientY + scrollY - position.y })
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging || !draggable) return
    const handleMouseMove = (e: MouseEvent) => {
      const scrollX = window.scrollX || window.pageXOffset || 0
      const scrollY = window.scrollY || window.pageYOffset || 0
      setPosition({ x: e.clientX + scrollX - dragStart.x, y: e.clientY + scrollY - dragStart.y })
    }
    const handleMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, draggable])

  // Force absolute position override
  useEffect(() => {
    if (ref.current) ref.current.style.setProperty('position', 'absolute', 'important')
  }, [])

  if (!position) return null

  const CloseIcon = iconNameToReactComponent('x-mark')

  return createPortal(
    <div
      ref={ref}
      className={`floating-palette ${className}`}
      data-recursica-layer="3"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        background: surface,
        border: `1px solid ${borderColor}`,
        borderRadius,
        boxShadow: elevation || '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      <div
        className="floating-palette-header"
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding,
          borderBottom: `1px solid ${borderColor}`,
          background: surface,
          borderRadius: `calc(${borderRadius}) calc(${borderRadius}) 0 0`,
          cursor: draggable ? 'grab' : 'default',
        }}
      >
        <h3 style={{
          margin: 0,
          fontFamily: 'var(--recursica_brand_typography_h3-font-family)',
          fontSize: 'var(--recursica_brand_typography_h3-font-size)',
          fontWeight: 'var(--recursica_brand_typography_h3-font-weight)',
          letterSpacing: 'var(--recursica_brand_typography_h3-font-letter-spacing)',
          lineHeight: 'var(--recursica_brand_typography_h3-line-height)',
          color: textColor,
        }}>
          {title}
        </h3>
        <Button
          variant="text"
          size="small"
          icon={CloseIcon
            ? <CloseIcon style={{ width: 'var(--recursica_brand_dimensions_icons_default)', height: 'var(--recursica_brand_dimensions_icons_default)' }} />
            : undefined}
          onClick={onClose}
          layer="layer-3"
        />
      </div>
      <div className="floating-palette-body" style={{ padding, display: 'flex', flexDirection: 'column', gap: 'var(--recursica_brand_dimensions_general_sm)' }}>
        {children}
      </div>
    </div>,
    document.body
  )
}
