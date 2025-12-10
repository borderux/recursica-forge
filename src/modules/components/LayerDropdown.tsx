import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Squares2X2Icon } from '@heroicons/react/24/solid'
import './Dropdown.css'

interface LayerDropdownProps {
  selected: string
  onSelect: (layer: string) => void
}

export default function LayerDropdown({ selected, onSelect }: LayerDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  const layers = ['layer-0', 'layer-1', 'layer-2', 'layer-3']

  return (
    <div className="dropdown-container" ref={ref}>
      <button
        className="toolbar-icon-button"
        onClick={() => setOpen(!open)}
        title="Layer"
        aria-label="Layer"
      >
        <Squares2X2Icon className="toolbar-icon" />
        <ChevronDownIcon className="dropdown-chevron" />
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
