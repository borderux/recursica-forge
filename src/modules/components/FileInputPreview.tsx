import { useMemo } from 'react'
import { FileInput } from '../../components/adapters/FileInput'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'
import { h2Style, h3Style } from './typographyStyles'


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
    const state = (selectedVariants.states || 'default') 

    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    const verticalGutter = 'var(--recursica_brand_dimensions_gutters_vertical)'

    const layoutsToShow = [selectedVariants.layout || selectedVariants.layouts || 'stacked']

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'flex-start'
        }}>
            
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    
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

                        {/* Custom/unknown state — renders a basic field so styling changes are visible */}
                        {state !== 'default' && state !== 'error' && state !== 'disabled' && state !== 'focus' && (
                            <FileInput
                                label="File Input"
                                state={state as any}
                                layout={layoutVariant as any}
                                layer={selectedLayer as any}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
