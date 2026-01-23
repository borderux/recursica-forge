/**
 * Tooltip Component Adapter
 * 
 * Unified Tooltip component that wraps children and displays a tooltip on hover.
 * Follows the component adapter pattern for consistency with other components.
 */

import { ReactNode, useState, useEffect, useRef, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useComponent } from '../hooks/useComponent'
import { getComponentCssVar, getComponentLevelCssVar } from '../utils/cssVarNames'
import { getBrandTypographyCssVar } from '../utils/brandCssVars'
import { useThemeMode } from '../../modules/theme/ThemeModeContext'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TooltipProps = {
  children: ReactNode
  label: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  layer?: ComponentLayer
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export function Tooltip({ 
  children, 
  label, 
  position = 'top',
  delay = 300,
  layer = 'layer-1',
  disabled = false,
  className,
  style,
  mantine,
  material,
  carbon,
}: TooltipProps) {
  const Component = useComponent('Tooltip')
  const { mode } = useThemeMode()
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; transform: string } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get CSS variables for tooltip styling
  // Try to use UIKit.json CSS variables if available, fallback to brand CSS variables
  const bgVar = getComponentCssVar('Tooltip', 'colors', 'background', layer)
  const textVar = getComponentCssVar('Tooltip', 'colors', 'text', layer)
  const borderColorVar = getComponentCssVar('Tooltip', 'colors', 'border-color', layer)
  const paddingVar = getComponentLevelCssVar('Tooltip', 'padding')
  const borderRadiusVar = getComponentLevelCssVar('Tooltip', 'border-radius')
  const fontSizeVar = getComponentLevelCssVar('Tooltip', 'font-size')
  const zIndexVar = getComponentLevelCssVar('Tooltip', 'z-index')
  
  // Fallback to brand CSS variables if UIKit.json variables don't exist
  const layerBase = `--recursica-brand-themes-${mode}-layer-${layer}-property`
  const fallbackBg = `var(${layerBase}-surface)`
  const fallbackText = `var(${layerBase}-element-text-color)`
  const fallbackBorder = `var(${layerBase}-border-color)`
  const fallbackOpacity = `var(--recursica-brand-themes-${mode}-text-emphasis-high)`
  
  // Get typography for tooltip text - use caption font size as fallback
  const tooltipFontSizeVar = fontSizeVar || getBrandTypographyCssVar('caption', 'font-size')

  useEffect(() => {
    if (!isVisible || !wrapperRef.current || disabled) {
      setTooltipPosition(null)
      return
    }

    const updatePosition = () => {
      if (!wrapperRef.current) return

      const rect = wrapperRef.current.getBoundingClientRect()
      const scrollX = window.scrollX || window.pageXOffset
      const scrollY = window.scrollY || window.pageYOffset
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const offset = 8
      const viewportPadding = 8 // Minimum distance from viewport edges

      // Estimate tooltip dimensions (we'll measure after first render)
      const estimatedTooltipHeight = 32 // Approximate height including padding
      const estimatedTooltipWidth = Math.max(label.length * 7 + 20, 80) // Rough estimate, minimum 80px

      let top = 0
      let left = 0
      let actualPosition = position
      let transform = ''

      // Determine best position based on available space
      const spaceAbove = rect.top
      const spaceBelow = viewportHeight - rect.bottom
      const spaceLeft = rect.left
      const spaceRight = viewportWidth - rect.right

      // Auto-adjust vertical position if requested position doesn't fit
      if (position === 'top' && spaceAbove < estimatedTooltipHeight + offset + viewportPadding) {
        actualPosition = 'bottom'
      } else if (position === 'bottom' && spaceBelow < estimatedTooltipHeight + offset + viewportPadding) {
        actualPosition = 'top'
      }

      // Auto-adjust horizontal position if requested position doesn't fit
      if (position === 'left' && spaceLeft < estimatedTooltipWidth + offset + viewportPadding) {
        actualPosition = 'right'
      } else if (position === 'right' && spaceRight < estimatedTooltipWidth + offset + viewportPadding) {
        actualPosition = 'left'
      }

      // Calculate position based on actual position
      switch (actualPosition) {
        case 'top':
          top = rect.top + scrollY - offset
          left = rect.left + scrollX + rect.width / 2
          transform = 'translateX(-50%) translateY(-100%)'
          break
        case 'bottom':
          top = rect.bottom + scrollY + offset
          left = rect.left + scrollX + rect.width / 2
          transform = 'translateX(-50%)'
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX - offset
          transform = 'translateX(-100%) translateY(-50%)'
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2
          left = rect.right + scrollX + offset
          transform = 'translateY(-50%)'
          break
      }

      // Adjust horizontal position to keep tooltip within viewport (for top/bottom tooltips)
      if (actualPosition === 'top' || actualPosition === 'bottom') {
        const tooltipHalfWidth = estimatedTooltipWidth / 2
        const tooltipLeft = left - tooltipHalfWidth
        const tooltipRight = left + tooltipHalfWidth
        
        if (tooltipLeft < scrollX + viewportPadding) {
          // Tooltip would overflow left, align to left edge with padding
          left = scrollX + viewportPadding + tooltipHalfWidth
          transform = actualPosition === 'top' ? 'translateY(-100%)' : ''
        } else if (tooltipRight > scrollX + viewportWidth - viewportPadding) {
          // Tooltip would overflow right, align to right edge with padding
          left = scrollX + viewportWidth - viewportPadding - tooltipHalfWidth
          transform = actualPosition === 'top' ? 'translateX(-100%) translateY(-100%)' : 'translateX(-100%)'
        }
      }

      // Adjust vertical position to keep tooltip within viewport (for left/right tooltips)
      if (actualPosition === 'left' || actualPosition === 'right') {
        const tooltipHalfHeight = estimatedTooltipHeight / 2
        const tooltipTop = top - tooltipHalfHeight
        const tooltipBottom = top + tooltipHalfHeight
        
        if (tooltipTop < scrollY + viewportPadding) {
          // Tooltip would overflow top, align to top edge
          top = scrollY + viewportPadding + tooltipHalfHeight
          transform = actualPosition === 'left' ? 'translateX(-100%)' : ''
        } else if (tooltipBottom > scrollY + viewportHeight - viewportPadding) {
          // Tooltip would overflow bottom, align to bottom edge
          top = scrollY + viewportHeight - viewportPadding - tooltipHalfHeight
          transform = actualPosition === 'left' ? 'translateX(-100%) translateY(-100%)' : 'translateY(-100%)'
        }
      }

      setTooltipPosition({ top, left, transform })
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      updatePosition()
    })

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, position, disabled, label])

  const handleMouseEnter = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }


  // If library-specific component is available, use it
  if (Component) {
    return (
      <Suspense fallback={
        <div ref={wrapperRef} className={className} style={style}>
          {children}
        </div>
      }>
        <Component
          label={label}
          position={position}
          delay={delay}
          layer={layer}
          disabled={disabled}
          className={className}
          style={style}
          mantine={mantine}
          material={material}
          carbon={carbon}
        >
          {children}
        </Component>
      </Suspense>
    )
  }

  // Fallback implementation using portal
  return (
    <>
      <div
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
        style={{ display: 'inline-flex', ...style }}
      >
        {children}
      </div>
      {!disabled && isVisible && tooltipPosition && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: tooltipPosition.transform,
            padding: paddingVar ? `var(${paddingVar}, 6px 10px)` : '6px 10px',
            backgroundColor: bgVar ? `var(${bgVar}, var(${layerBase}-surface))` : fallbackBg,
            border: borderColorVar 
              ? `1px solid var(${borderColorVar}, var(${layerBase}-border-color))` 
              : `1px solid ${fallbackBorder}`,
            borderRadius: borderRadiusVar ? `var(${borderRadiusVar}, 6px)` : '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: zIndexVar ? `var(${zIndexVar}, 9999)` : 9999,
            fontSize: tooltipFontSizeVar ? `var(${tooltipFontSizeVar}, 12px)` : '12px',
            color: textVar ? `var(${textVar}, var(${layerBase}-element-text-color))` : fallbackText,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: fallbackOpacity,
          }}
          onMouseEnter={() => !disabled && setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {label}
        </div>,
        document.body
      )}
    </>
  )
}
