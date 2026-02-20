import { useMemo } from 'react'
import { FileInput } from '../../components/adapters/FileInput'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface FileInputPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function FileInputPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: FileInputPreviewProps) {
    const { mode } = useThemeMode()

    const mockFiles = useMemo(() => [
        new File([''], 'document.pdf', { type: 'application/pdf' }),
        new File([''], 'image.png', { type: 'image/png' }),
        new File([''], 'spreadsheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    ], [])

    // Extract variants
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'

    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const h2Style = {
        margin: 0,
        marginBottom: 16,
        textTransform: 'capitalize' as const,
        fontFamily: 'var(--recursica-brand-typography-h2-font-family)',
        fontSize: 'var(--recursica-brand-typography-h2-font-size)',
        fontWeight: 'var(--recursica-brand-typography-h2-font-weight)',
        letterSpacing: 'var(--recursica-brand-typography-h2-font-letter-spacing)',
        lineHeight: 'var(--recursica-brand-typography-h2-line-height)',
    } as React.CSSProperties

    const verticalGutter = 'var(--recursica-brand-dimensions-gutters-vertical)'

    const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {state === 'default' && (
                            <>
                                <FileInput
                                    label="Single File"
                                    placeholder="Select a file..."
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                                <FileInput
                                    label="Multiple Files"
                                    placeholder="Select files..."
                                    multiple
                                    value={mockFiles}
                                    state="default"
                                    layout={layoutVariant}
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {state === 'error' && (
                            <FileInput
                                label="Error State"
                                errorText="A file is required"
                                state="error"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {state === 'disabled' && (
                            <FileInput
                                label="Disabled State"
                                state="disabled"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}

                        {state === 'focus' && (
                            <FileInput
                                label="Focus State"
                                state="focus"
                                layout={layoutVariant}
                                layer={selectedLayer as any}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
