import { useState, useEffect } from 'react'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'

interface CheckboxItemPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function CheckboxItemPreview({
    selectedLayer,
}: CheckboxItemPreviewProps) {
    const [updateKey, setUpdateKey] = useState(0)

    // Interactive state for the preview
    const [checked1, setChecked1] = useState(false)
    const [checked2, setChecked2] = useState(true)
    const [indeterminate, setIndeterminate] = useState(false)

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
        }} key={updateKey}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <CheckboxItem
                    label="Unchecked Checkbox"
                    checked={checked1}
                    onChange={setChecked1}
                    layer={selectedLayer as any}
                />

                <CheckboxItem
                    label="Checked Checkbox"
                    checked={checked2}
                    onChange={setChecked2}
                    layer={selectedLayer as any}
                />

                <CheckboxItem
                    label="Indeterminate Checkbox"
                    checked={indeterminate}
                    indeterminate
                    onChange={setIndeterminate}
                    layer={selectedLayer as any}
                />

                <CheckboxItem
                    label="Disabled Unchecked"
                    checked={false}
                    disabled
                    onChange={() => { }}
                    layer={selectedLayer as any}
                />

                <CheckboxItem
                    label="Disabled Checked"
                    checked={true}
                    disabled
                    onChange={() => { }}
                    layer={selectedLayer as any}
                />

                <CheckboxItem
                    label="Label wrapping: The quick brown fox jumps over the lazy dog and the label should wrap nicely."
                    checked={false}
                    onChange={() => { }}
                    layer={selectedLayer as any}
                />
            </div>
        </div>
    )
}
