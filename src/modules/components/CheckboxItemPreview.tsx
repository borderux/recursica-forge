import { useState, useEffect } from 'react'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'

interface CheckboxItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    activeState?: string
    componentElevation?: string
}

// The preview mirrors the toolbar's current selection instead of showing every state at once:
// the "Checked state" selector (selectedVariants.checked) drives checked/indeterminate, and the
// active interaction-state tab drives disabled. Interaction states the underlying component can't
// render on demand (hover/focus) simply fall back to the base visual.
export default function CheckboxItemPreview({
    selectedVariants,
    selectedLayer,
    activeState = 'base',
}: CheckboxItemPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    const checkedState = selectedVariants['selection-states'] || 'checked'
    const isIndeterminate = checkedState === 'indeterminate'
    const isDisabled = activeState === 'disabled'

    // Local checked mirror so the box stays interactive, re-synced whenever the selector changes.
    const [checked, setChecked] = useState(checkedState === 'checked')
    useEffect(() => {
        setChecked(checkedState === 'checked')
    }, [checkedState])

    // Listen for CSS variable updates to force re-render
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
            width: '100%',
            maxWidth: '400px',
        }} data-update-key={updateKey}>
            <CheckboxItem
                label="A curious goblin crept through the moonlit forest, muttering about a treasure map"
                checked={isIndeterminate ? false : checked}
                indeterminate={isIndeterminate}
                disabled={isDisabled}
                onChange={setChecked}
                layer={selectedLayer as any}
            />
        </div>
    )
}
