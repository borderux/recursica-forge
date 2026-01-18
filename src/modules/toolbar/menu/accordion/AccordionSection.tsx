import { useState, ReactNode, useEffect } from 'react'
import { iconNameToReactComponent } from '../../../components/iconUtils'
import { useThemeMode } from '../../../theme/ThemeModeContext'
import './AccordionSection.css'

export interface AccordionSectionProps {
  title: string
  icon?: React.ComponentType<{ className?: string }> | null
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onToggle?: (isOpen: boolean) => void
  className?: string
  selectedValue?: string // For menu-based accordions, show the selected value
}

export default function AccordionSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  className = '',
  selectedValue,
}: AccordionSectionProps) {
  const { mode } = useThemeMode()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  
  // Layer1 base for expanded content
  const layer1Base = `--recursica-brand-themes-${mode}-layer-layer-1-property`
  
  useEffect(() => {
    if (!isControlled && defaultOpen) {
      setInternalOpen(defaultOpen)
    }
  }, [defaultOpen, isControlled])

  const PlusIcon = iconNameToReactComponent('plus')
  const MinusIcon = iconNameToReactComponent('minus')

  const handleToggle = () => {
    const newOpen = !isOpen
    if (isControlled) {
      onToggle?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <div className={`accordion-section ${className}`}>
      <button
        className={`accordion-header ${isOpen ? 'accordion-header-open' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <div className="accordion-header-content">
          {Icon && <Icon className="accordion-icon" />}
          <span className="accordion-title">{title}</span>
        </div>
        <div className="accordion-header-right">
          {selectedValue && (
            <span className="accordion-selected-value">{selectedValue}</span>
          )}
          {isOpen ? (MinusIcon && <MinusIcon className="accordion-toggle-icon" />) : (PlusIcon && <PlusIcon className="accordion-toggle-icon" />)}
        </div>
      </button>
      {isOpen && (
        <div 
          className="accordion-content"
          style={{
            background: `var(${layer1Base}-surface)`,
            borderTop: `1px solid var(${layer1Base}-border-color)`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

