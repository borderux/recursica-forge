/**
 * Icon Input Component
 * 
 * Allows users to type an icon name from Phosphor Icons.
 * Updates the target CSS variable with the icon name (kebab-case string).
 * If the icon is not in the kit, uses a fallback icon.
 */

import { useMemo, useState, useEffect } from 'react'
import { iconNameToReactComponent } from './iconUtils'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { TextField } from '../../components/adapters/TextField'
import './IconInput.css'

interface IconInputProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
}

// Fallback icon name if the icon is not found in the kit
const FALLBACK_ICON = 'question-mark'

export default function IconInput({
  targetCssVar,
  targetCssVars = [],
  label,
}: IconInputProps) {
  // Get current icon name from CSS variable
  const currentIconName = useMemo(() => {
    const value = readCssVar(targetCssVar)
    return value || ''
  }, [targetCssVar])
  
  // Local state for the input value
  const [inputValue, setInputValue] = useState(currentIconName)
  
  // Update input value when CSS variable changes
  useEffect(() => {
    setInputValue(currentIconName)
  }, [currentIconName])
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Trim the value when updating CSS variables
    const trimmedValue = newValue.trim()
    
    // Update all target CSS variables with the icon name
    const allVars = [targetCssVar, ...targetCssVars]
    allVars.forEach(cssVar => {
      if (cssVar) {
        updateCssVar(cssVar, trimmedValue)
      }
    })
    
    // Dispatch event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: allVars }
    }))
  }
  
  // Determine which icon to display (use trimmed input value if available, otherwise current icon name, otherwise fallback)
  const displayIconName = (inputValue.trim() || currentIconName || FALLBACK_ICON).trim()
  const IconComponent = iconNameToReactComponent(displayIconName)
  const hasValidIcon = IconComponent !== null && displayIconName.length > 0
  
  // Use fallback if icon is not found or input is empty
  const finalIconName = hasValidIcon ? displayIconName : FALLBACK_ICON
  const FinalIconComponent = iconNameToReactComponent(finalIconName) || iconNameToReactComponent(FALLBACK_ICON)
  
  return (
    <div className="icon-input">
      <label className="icon-input-label">
        <a 
          href="https://phosphoricons.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="icon-input-label-link"
        >
          {label}
        </a>
      </label>
      
      <div className="icon-input-container">
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter icon name (e.g., check, x-mark)"
          className="icon-input-field"
        />
        
        {/* Preview current icon */}
        <div className="icon-input-preview">
          {FinalIconComponent ? (
            <FinalIconComponent width={20} height={20} />
          ) : (
            <span className="icon-input-preview-name">{finalIconName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

