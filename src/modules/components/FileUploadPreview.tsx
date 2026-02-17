import { useState } from 'react'
import { FileUpload, FileUploadItem } from '../../components/adapters/FileUpload'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface FileUploadPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function FileUploadPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: FileUploadPreviewProps) {
    const { mode } = useThemeMode()
    // Extract variants
    const state = (selectedVariants.states || 'default') as 'default' | 'error' | 'disabled' | 'focus'

    // Show both layouts
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = ['stacked', 'side-by-side']

    const [files, setFiles] = useState<FileUploadItem[]>([
        { id: '1', name: 'document.pdf', size: 1024, type: 'application/pdf', status: 'success' },
        { id: '2', name: 'image.png', size: 2048, type: 'image/png', status: 'success' },
    ])

    const handleUpload = (newFiles: File[]) => {
        const items: FileUploadItem[] = newFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            name: f.name,
            size: f.size,
            type: f.type,
            status: 'success'
        }))
        setFiles(prev => [...prev, ...items])
    }

    const handleRemove = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

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

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: verticalGutter,
            width: '100%',
            alignItems: 'center'
        }}>
            {layoutsToShow.map((layoutVariant) => (
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {state === 'default' && (
                            <>
                                <FileUpload
                                    label="Upload Files"
                                    helpText="Max file size 5MB"
                                    files={files}
                                    onUpload={handleUpload}
                                    onRemove={handleRemove}
                                    layout={layoutVariant}
                                    state="default"
                                    layer={selectedLayer as any}
                                />
                                <FileUpload
                                    label="Empty State"
                                    files={[]}
                                    onUpload={handleUpload}
                                    layout={layoutVariant}
                                    state="default"
                                    layer={selectedLayer as any}
                                />
                            </>
                        )}

                        {state === 'error' && (
                            <FileUpload
                                label="Error State"
                                errorText="Please upload at least one file"
                                files={[]}
                                onUpload={handleUpload}
                                layout={layoutVariant}
                                state="error"
                                layer={selectedLayer as any}
                            />
                        )}

                        {state === 'disabled' && (
                            <FileUpload
                                label="Disabled State"
                                files={files}
                                layout={layoutVariant}
                                state="disabled"
                                layer={selectedLayer as any}
                            />
                        )}

                        {state === 'focus' && (
                            <FileUpload
                                label="Focus State"
                                files={[]}
                                layout={layoutVariant}
                                state="focus"
                                layer={selectedLayer as any}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
