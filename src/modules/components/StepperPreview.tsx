/**
 * Stepper Preview Component
 *
 * Interactive preview showing a multi-step stepper with completed, current,
 * and upcoming states. Includes Next/Back controls for state cycling.
 */

import { useState, useEffect } from 'react'
import { Stepper } from '../../components/adapters/Stepper'
import type { StepperStepData } from '../../components/adapters/Stepper'

interface StepperPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

const STEPS: StepperStepData[] = [
    {
        label: 'Gather reagents',
        description: 'Collect mushroom caps and powdered moonstone',
    },
    {
        label: 'Prepare the crucible',
        description: 'Heat the obsidian vessel to a rolling boil',
    },
    {
        label: 'Invoke the incantation',
    },
    {
        label: 'Seal the enchantment',
    },
]

export default function StepperPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: StepperPreviewProps) {
    const [active, setActive] = useState(1)

    const orientation = (selectedVariants.orientation as 'horizontal' | 'vertical') || 'horizontal'
    const size = (selectedVariants.size as 'large' | 'small') || 'large'

    const nextStep = () => setActive((current) => (current < STEPS.length ? current + 1 : current))
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

    // Key to force re-render when layer/variants change
    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const handleCssVarUpdate = () => {
            setUpdateKey(k => k + 1)
        }
        window.addEventListener('cssVarsUpdated', handleCssVarUpdate)
        return () => window.removeEventListener('cssVarsUpdated', handleCssVarUpdate)
    }, [])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '100%',
                alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
                padding: '16px',
            }}
        >
            <Stepper
                key={`stepper-${updateKey}`}
                active={active}
                onStepClick={setActive}
                orientation={orientation}
                size={size}
                layer={selectedLayer}
                steps={STEPS}
            />

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                    onClick={prevStep}
                    disabled={active === 0}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--recursica-brand-palettes-neutral-200-color-tone)',
                        background: 'transparent',
                        cursor: active === 0 ? 'not-allowed' : 'pointer',
                        opacity: active === 0 ? 0.5 : 1,
                        color: 'inherit',
                        fontSize: '13px',
                    }}
                >
                    Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={active >= STEPS.length}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--recursica-brand-palettes-neutral-200-color-tone)',
                        background: 'transparent',
                        cursor: active >= STEPS.length ? 'not-allowed' : 'pointer',
                        opacity: active >= STEPS.length ? 0.5 : 1,
                        color: 'inherit',
                        fontSize: '13px',
                    }}
                >
                    Next step
                </button>
            </div>
        </div>
    )
}
