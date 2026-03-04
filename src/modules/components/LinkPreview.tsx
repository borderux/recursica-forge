import { Link } from '../../components/adapters/Link'
import { iconNameToReactComponent } from './iconUtils'

interface LinkPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function LinkPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: LinkPreviewProps) {
    const state = (selectedVariants.states || 'default') as 'default' | 'hover' | 'visited' | 'visited-hover'
    const ArrowUpRightIcon = iconNameToReactComponent('arrow-top-right-on-square')

    return (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="#" layer={selectedLayer as any} forceState={state}>Visit the Forge</Link>
            <Link href="#" layer={selectedLayer as any} forceState={state} startIcon={ArrowUpRightIcon ? <ArrowUpRightIcon /> : undefined}>Goblin Archives</Link>
            <Link href="#" layer={selectedLayer as any} forceState={state} endIcon={ArrowUpRightIcon ? <ArrowUpRightIcon /> : undefined}>Rune Codex</Link>
        </div>
    )
}
