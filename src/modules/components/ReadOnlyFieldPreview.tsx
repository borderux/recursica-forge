import { ReadOnlyField } from '../../components/adapters/ReadOnlyField'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getGlobalCssVar } from '../../components/utils/cssVarNames'

interface ReadOnlyFieldPreviewProps {
    selectedVariants: Record<string, string> // e.g., { layouts: "stacked" }
    selectedLayer: string // e.g., "layer-0"
    componentElevation?: string // Not used for ReadOnlyField, but kept for consistency
}

export default function ReadOnlyFieldPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: ReadOnlyFieldPreviewProps) {
    const { mode } = useThemeMode()

    // Extract variants from selectedVariants
    const layout = (selectedVariants.layouts || 'stacked') as 'stacked' | 'side-by-side'

    // Get form vertical gutter CSS variable
    const formVerticalGutterVar = getGlobalCssVar('form', 'properties', 'vertical-item-gap', mode)

    // Get icon component for edit icon example
    const EditIcon = iconNameToReactComponent('pencil')

    // Show both layouts if no specific layout is selected, otherwise show selected layout
    const layoutsToShow: Array<'stacked' | 'side-by-side'> = selectedVariants.layouts
        ? [layout]
        : ['stacked', 'side-by-side']

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
                <div key={layoutVariant} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={h2Style}>
                        {layoutVariant === 'side-by-side' ? 'Side-by-side' : 'Stacked'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(${formVerticalGutterVar})`, width: '100%' }}>
                        {/* Basic read-only field with value */}
                        <ReadOnlyField
                            label="Account ID"
                            value="ACC-12345"
                            layout={layoutVariant}
                            layer={selectedLayer as any}
                        />

                        {/* Read-only field with edit icon */}
                        <ReadOnlyField
                            label="Email Address"
                            value="user@example.com"
                            layout={layoutVariant}
                            layer={selectedLayer as any}
                            editIcon={EditIcon ? <EditIcon style={{ width: '16px', height: '16px' }} /> : null}
                        />

                        {/* Required read-only field */}
                        <ReadOnlyField
                            label="User Name"
                            value="John Doe"
                            required
                            layout={layoutVariant}
                            layer={selectedLayer as any}
                        />

                        {/* Read-only field with no value (shows em dash) */}
                        <ReadOnlyField
                            label="Middle Name"
                            layout={layoutVariant}
                            layer={selectedLayer as any}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
