import { useState, useEffect } from 'react'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'

interface RadioButtonItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    activeState?: string
    componentElevation?: string
}

// Mirrors the toolbar's current selection instead of showing every state at once: the "Selection"
// selector (selectedVariants.selected) drives selected/unselected, and the active interaction-state
// tab drives disabled. Interaction states the component can't render on demand (hover/focus) fall
// back to the base visual.
export default function RadioButtonItemPreview({
    selectedVariants,
    selectedLayer,
    activeState = 'base',
}: RadioButtonItemPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    const selectionState = selectedVariants['selection-states'] || 'selected'
    const isDisabled = activeState === 'disabled'

    const [selected, setSelected] = useState(selectionState === 'selected')
    useEffect(() => {
        setSelected(selectionState === 'selected')
    }, [selectionState])

    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateKey(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        window.addEventListener('cssVarsReset', handleCssVarUpdate)

        const observer = new MutationObserver(handleCssVarUpdate)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        })

        return () => {
            window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
            window.removeEventListener('cssVarsReset', handleCssVarUpdate)
            observer.disconnect()
        }
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '16px',
            width: '100%',
            maxWidth: '400px',
        }} data-update-key={updateKey}>
            <RadioButtonItem
                label="A curious goblin crept through the moonlit forest, muttering about a treasure map"
                selected={selected}
                disabled={isDisabled}
                onChange={setSelected}
                layer={selectedLayer as any}
            />
        </div>
    )
}
