import { useState, useEffect } from 'react'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'

interface CheckboxItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function CheckboxItemPreview({
    selectedVariants,
  selectedLayer,
}: CheckboxItemPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    // Interactive state for the preview
    const [checked1, setChecked1] = useState(false)
    const [checked2, setChecked2] = useState(true)
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkedWrap, setCheckedWrap] = useState(false)

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
                <CheckboxItem
                    label="Sharpen the blade"
                    checked={checked1}
                    onChange={setChecked1}
                    disabled={activeState === 'disabled'}
                    layer={selectedLayer as any}
                />
            </div>
        </div>
    )
}
