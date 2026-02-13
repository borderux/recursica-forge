import React, { useMemo, useState, useEffect } from 'react'
import { getAvailableIconNames, getIcon } from './iconLibrary'
import { updateCssVar } from '../../core/css/updateCssVar'
import { readCssVar } from '../../core/css/readCssVar'
import { useCssVar } from '../../components/hooks/useCssVar'
import { useThemeMode } from '../theme/ThemeModeContext'
import { TextField } from '../../components/adapters/TextField'
import { Label } from '../../components/adapters/Label'
import './IconSelector.css'

interface IconSelectorProps {
    targetCssVar: string
    label: string
    allowedIconNames?: string[]
}

export default function IconSelector({
    targetCssVar,
    label,
    allowedIconNames,
}: IconSelectorProps) {
    const { mode } = useThemeMode()
    const [searchTerm, setSearchTerm] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    // Get current icon name from CSS variable
    const iconFromVar = useCssVar(targetCssVar, 'arrow-right')
    const currentIconName = iconFromVar || 'arrow-right'

    const [selectedIcon, setSelectedIcon] = useState(currentIconName)

    useEffect(() => {
        setSelectedIcon(currentIconName)
    }, [currentIconName])

    const allIconNames = useMemo(() => {
        const libraryIcons = getAvailableIconNames()
        if (allowedIconNames && allowedIconNames.length > 0) {
            // Only include icons that exist in library
            return allowedIconNames.filter(name => libraryIcons.includes(name))
        }
        return libraryIcons
    }, [allowedIconNames])

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return allIconNames.slice(0, 100) // Increase slice for filtered sets
        return allIconNames
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 100)
    }, [searchTerm, allIconNames])

    const handleIconSelect = (iconName: string) => {
        setSelectedIcon(iconName)
        updateCssVar(targetCssVar, iconName)
        setIsOpen(false)

        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('cssVarsUpdated', {
            detail: { cssVars: [targetCssVar] }
        }))
    }

    const CurrentIcon = getIcon(selectedIcon) || getIcon('question')

    return (
        <div className={`icon-selector theme-${mode}`}>
            <Label layer="layer-3" layout="stacked">{label}</Label>

            <div className="icon-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="icon-selector-current">
                    {CurrentIcon && React.createElement(CurrentIcon, { size: 20 })}
                    <span className="icon-selector-name">{selectedIcon}</span>
                </div>
                <div className={`icon-selector-chevron ${isOpen ? 'open' : ''}`}>
                    {getIcon('caret-down') && React.createElement(getIcon('caret-down')!, { size: 16 })}
                </div>
            </div>

            {isOpen && (
                <div className="icon-selector-dropdown">
                    <div className="icon-selector-search">
                        <TextField
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search icons..."
                            autoFocus
                        />
                    </div>
                    <div className="icon-selector-grid">
                        {filteredIcons.map(name => {
                            const Icon = getIcon(name)
                            return (
                                <div
                                    key={name}
                                    className={`icon-selector-item ${selectedIcon === name ? 'selected' : ''}`}
                                    onClick={() => handleIconSelect(name)}
                                    title={name}
                                >
                                    {Icon && React.createElement(Icon, { size: 24 })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
