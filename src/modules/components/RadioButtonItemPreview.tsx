import { useState, useEffect } from 'react'
import { RadioButtonItem } from '../../components/adapters/RadioButtonItem'

interface RadioButtonItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function RadioButtonItemPreview({
    selectedVariants,
  selectedLayer,
}: RadioButtonItemPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    // Interactive state for the preview
    const [selected, setSelected] = useState('option1')

    // Listen for CSS variable updates to force re-render
    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateKey(prev => prev + 1)
        }

        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        window.addEventListener('cssVarsReset', handleCssVarUpdate)

        // Also listen for style changes on documentElement
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

    const activeState = (selectedVariants.states || selectedVariants.__hasStateControl === 'true') ? (selectedVariants.states || selectedVariants.__activeState || 'default') : null
  return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            padding: 0,
            width: '100%',
            maxWidth: '400px',
        }} data-update-key={updateKey}>
      
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <RadioButtonItem
                    label="Goblin war axe"
                    value="option1"
                    selected={selected === 'option1'}
                    onChange={() => setSelected('option1')}
                    disabled={activeState === 'disabled'}
                    layer={selectedLayer as any}
                />
            </div>
        </div>
    )
}
