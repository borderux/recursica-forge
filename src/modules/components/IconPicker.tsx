/**
 * Icon Picker Component
 * 
 * Allows users to select an icon from the available icon library via a dropdown.
 * Updates the target CSS variable with the selected icon name (kebab-case string).
 */

import { useMemo } from 'react'
import { getAvailableIconNames } from './iconLibrary'
import { iconNameToReactComponent } from './iconUtils'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { toSentenceCase } from '../toolbar/utils/componentToolbarUtils'
import './IconPicker.css'

interface IconPickerProps {
  targetCssVar: string
  targetCssVars?: string[]
  label: string
}

export default function IconPicker({
  targetCssVar,
  targetCssVars = [],
  label,
}: IconPickerProps) {
  // Get all available icon names
  const allIconNames = useMemo(() => getAvailableIconNames(), [])
  
  // Get current icon name from CSS variable
  const currentIconName = useMemo(() => {
    const value = readCssVar(targetCssVar)
    return value || ''
  }, [targetCssVar])
  
  // Handle icon selection
  const handleIconSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iconName = e.target.value
    // Update all target CSS variables with the icon name
    const allVars = [targetCssVar, ...targetCssVars]
    allVars.forEach(cssVar => {
      if (cssVar) {
        updateCssVar(cssVar, iconName)
      }
    })
    
    // Dispatch event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
      detail: { cssVars: allVars }
    }))
  }
  
  return (
    <div className="icon-picker">
      <label className="icon-picker-label">{label}</label>
      
      <select
        className="icon-picker-select"
        value={currentIconName}
        onChange={handleIconSelect}
      >
        <option value="">None</option>
        {allIconNames.map(iconName => {
          const IconComponent = iconNameToReactComponent(iconName)
          return (
            <option key={iconName} value={iconName}>
              {toSentenceCase(iconName)}
            </option>
          )
        })}
      </select>
      
      {/* Preview current icon */}
      {currentIconName && (
        <div className="icon-picker-preview">
          {(() => {
            const IconComponent = iconNameToReactComponent(currentIconName)
            return IconComponent ? (
              <IconComponent width={20} height={20} />
            ) : (
              <span className="icon-picker-preview-name">{currentIconName}</span>
            )
          })()}
        </div>
      )}
    </div>
  )
}

