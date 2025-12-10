import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { CircleStackIcon } from '@heroicons/react/24/solid'
import { readCssVar } from '../../core/css/readCssVar'
import './Dropdown.css'

interface AltLayerDropdownProps {
  selected: string | null
  onSelect: (altLayer: string | null) => void
  mode: 'light' | 'dark'
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

const ALT_LAYERS = [
  { key: null, label: 'None' },
  { key: 'high-contrast', label: 'High Contrast' },
  { key: 'primary-color', label: 'Primary Color' },
  { key: 'alert', label: 'Alert' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
] as const

export default function AltLayerDropdown({ selected, onSelect, mode, open: controlledOpen, onOpenChange }: AltLayerDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const ref = useRef<HTMLDivElement>(null)
  
  const setOpen = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen)
    } else {
      setInternalOpen(isOpen)
    }
  }

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
  }, [open])
  
  // Sync internal state with controlled prop
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setInternalOpen(controlledOpen)
    }
  }, [controlledOpen])

  const getSwatchColor = (altLayer: string | null): string => {
    if (!altLayer) {
      // For "None", use the current layer's surface color
      return readCssVar(`--recursica-brand-${mode}-layer-layer-0-property-surface`) || '#ffffff'
    }

    const surfaceVar = `--recursica-brand-${mode}-layer-layer-alternative-${altLayer}-property-surface`
    const surfaceValue = readCssVar(surfaceVar)
    
    if (surfaceValue) {
      // Try to resolve the CSS var to a hex color
      // For now, return a fallback based on the alt layer type
      if (altLayer === 'high-contrast') {
        return readCssVar(`--recursica-brand-${mode}-palettes-core-black`) || '#000000'
      }
      if (altLayer === 'alert') {
        return readCssVar(`--recursica-brand-${mode}-palettes-core-alert`) || '#ef4444'
      }
      if (altLayer === 'success') {
        return readCssVar(`--recursica-brand-${mode}-palettes-core-success`) || '#10b981'
      }
      if (altLayer === 'warning') {
        return readCssVar(`--recursica-brand-${mode}-palettes-core-warning`) || '#f59e0b'
      }
      if (altLayer === 'primary-color') {
        return readCssVar(`--recursica-brand-${mode}-palettes-palette-1-primary-tone`) || '#3b82f6'
      }
    }

    return '#ffffff'
  }

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className={`toolbar-icon-button ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Alt layer"
        aria-label="Alt layer"
      >
        <CircleStackIcon className="toolbar-icon" />
        <ChevronDownIcon className={`dropdown-chevron ${open ? 'flipped' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {ALT_LAYERS.map(altLayer => (
            <button
              key={altLayer.key || 'none'}
              className={`dropdown-item ${selected === altLayer.key ? 'selected' : ''}`}
              onClick={() => {
                onSelect(altLayer.key)
                setOpen(false)
              }}
            >
              <span
                className="alt-layer-swatch"
                style={{ backgroundColor: getSwatchColor(altLayer.key) }}
              />
              {altLayer.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
