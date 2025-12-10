import { useState, useRef, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'
import { ComponentProp, toSentenceCase, parseComponentStructure } from './componentToolbarUtils'
import { readCssVar } from '../../core/css/readCssVar'
import { updateCssVar } from '../../core/css/updateCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import PaletteColorControl from '../forms/PaletteColorControl'
import DimensionTokenSelector from './DimensionTokenSelector'
import { useVars } from '../vars/VarsContext'
import './PropControl.css'

interface PropControlProps {
  prop: ComponentProp
  componentName: string
  selectedVariants: Record<string, string>
  selectedLayer: string
  anchorElement?: HTMLElement
  onClose: () => void
}

export default function PropControl({
  prop,
  componentName,
  selectedVariants,
  selectedLayer,
  anchorElement,
  onClose,
}: PropControlProps) {
  const { mode } = useThemeMode()
  const { tokens } = useVars()
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

  // Helper function to get CSS vars for a given prop
  const getCssVarsForProp = (propToCheck: ComponentProp): string[] => {
    const vars: string[] = []

    if (propToCheck.isVariantSpecific && propToCheck.variantProp) {
      // For variant-specific props, find the CSS var for the selected variant and layer
      const selectedVariant = selectedVariants[propToCheck.variantProp]
      if (selectedVariant) {
        // For color props, we also need to match the selected layer
        if (propToCheck.category === 'color') {
          // Find the CSS var that matches both the selected variant AND selected layer
          const structure = parseComponentStructure(componentName)
          structure.props.forEach(p => {
            if (p.name === propToCheck.name && p.variantProp === propToCheck.variantProp && p.category === 'color') {
              // Check if this prop matches the selected variant and layer
              const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
              const layerInPath = p.path.find(pathPart => pathPart === selectedLayer)
              if (variantInPath && layerInPath) {
                vars.push(p.cssVar)
              }
            }
          })
        } else {
          // For size props, just match the variant
          const variantInVar = propToCheck.cssVar.match(/-variant-([^-]+)-/)?.[1]
          if (variantInVar) {
            const updatedCssVar = propToCheck.cssVar.replace(`-variant-${variantInVar}-`, `-variant-${selectedVariant}-`)
            vars.push(updatedCssVar)
          } else {
            // Fallback: try to find the prop in the structure with the selected variant
            const structure = parseComponentStructure(componentName)
            structure.props.forEach(p => {
              if (p.name === propToCheck.name && p.variantProp === propToCheck.variantProp) {
                const variantInPath = p.path.find(pathPart => pathPart === selectedVariant)
                if (variantInPath) {
                  vars.push(p.cssVar)
                }
              }
            })
          }
        }
      }
    } else {
      // For non-variant props, update the prop's CSS var directly
      // These props apply to all variants
      vars.push(propToCheck.cssVar)
    }

    // If no vars found, use the prop's CSS var as fallback
    if (vars.length === 0) {
      vars.push(propToCheck.cssVar)
    }

    return vars
  }

  // Get CSS vars for base prop
  const baseCssVars = getCssVarsForProp(prop)
  const primaryCssVar = baseCssVars[0] || prop.cssVar
  
  // Get CSS vars for hover prop if it exists
  const hoverCssVars = prop.hoverProp ? getCssVarsForProp(prop.hoverProp) : []
  const hoverPrimaryCssVar = hoverCssVars[0] || prop.hoverProp?.cssVar

  const handleMouseDown = (e: React.MouseEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  useEffect(() => {
    if (!isDragging) return

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
  }, [isDragging, dragStart])

  const renderControl = (propToRender: ComponentProp, cssVars: string[], primaryVar: string, label: string) => {
    if (propToRender.type === 'color') {
      return (
        <PaletteColorControl
          targetCssVar={primaryVar}
          targetCssVars={cssVars}
          label={label}
        />
      )
    }

    if (propToRender.type === 'dimension') {
      // For dimension props, use dimension token selector (only theme values)
      return (
        <DimensionTokenSelector
          targetCssVar={primaryVar}
          targetCssVars={cssVars}
          label={label}
          propName={propToRender.name}
        />
      )
    }

    // Default: for other types, show a read-only display (shouldn't happen for UIKit props)
    const currentValue = readCssVar(primaryVar) || ''
    return (
      <div className="prop-control-content">
        <label className="prop-control-label">{label}</label>
        <div className="prop-control-readonly">
          {currentValue || 'Not set'}
        </div>
      </div>
    )
  }

  const renderControls = () => {
    const baseLabel = toSentenceCase(prop.name)
    
    // If there's a hover prop, render both controls with spacing
    if (prop.hoverProp && hoverPrimaryCssVar) {
      const hoverLabel = `${baseLabel} (Hover)`
      return (
        <>
          {renderControl(prop, baseCssVars, primaryCssVar, baseLabel)}
          <div style={{ marginTop: 'var(--recursica-brand-dimensions-md)' }}>
            {renderControl(prop.hoverProp, hoverCssVars, hoverPrimaryCssVar, hoverLabel)}
          </div>
        </>
      )
    }
    
    // Otherwise, just render the base control
    return renderControl(prop, baseCssVars, primaryCssVar, baseLabel)
  }

  if (!position) {
    return null
  }

  return createPortal(
    <div
      ref={ref}
      className="prop-control"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div
        className="prop-control-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        <span className="prop-control-title">{toSentenceCase(prop.name)}</span>
        <button
          className="prop-control-close"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="prop-control-close-icon" />
        </button>
      </div>
      <div className="prop-control-body">
        {renderControls()}
      </div>
    </div>,
    document.body
  )
}
