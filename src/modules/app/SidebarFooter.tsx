/**
 * SidebarFooter Component
 * 
 * Shared footer used across all sidebar pages (Tokens, Theme, Components).
 * Contains external links and copyright notice using Link components.
 */

import { Link } from '../../components/adapters/Link'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import packageJson from '../../../package.json'

export function SidebarFooter() {
    const { mode } = useThemeMode()
    const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

    const ExternalLinkIcon = iconNameToReactComponent('arrow-top-right-on-square')
    const DocumentIcon = iconNameToReactComponent('document-text')
    const InfoIcon = iconNameToReactComponent('info')

    return (
        <>
            {/* Footer Links */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--recursica-brand-dimensions-general-default)',
                    marginTop: 'auto',
                    paddingTop: 'var(--recursica-brand-dimensions-general-lg)',
                    flexShrink: 0,
                }}
            >
                <Link
                    href="https://www.recursica.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    layer="layer-0"
                    startIcon={ExternalLinkIcon ? <ExternalLinkIcon /> : undefined}
                >
                    Visit Recursica.com
                </Link>
                <Link
                    href="https://www.recursica.com/docs/foundations/colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    layer="layer-0"
                    startIcon={DocumentIcon ? <DocumentIcon /> : undefined}
                >
                    Read documentation
                </Link>
                <Link
                    href="https://join.slack.com/t/recursica/shared_invite/zt-3emx80y9u-DfG5WO~SApkTJjVCiYk0WQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    layer="layer-0"
                    startIcon={InfoIcon ? <InfoIcon /> : undefined}
                >
                    Help
                </Link>
            </div>

            {/* Copyright */}
            <div
                style={{
                    marginTop: 'var(--recursica-brand-dimensions-gutters-vertical)',
                    fontFamily: 'var(--recursica-brand-typography-caption-font-family)',
                    fontSize: 'var(--recursica-brand-typography-caption-font-size)',
                    fontWeight: 'var(--recursica-brand-typography-caption-font-weight)' as any,
                    letterSpacing: 'var(--recursica-brand-typography-caption-font-letter-spacing)',
                    lineHeight: 'var(--recursica-brand-typography-caption-line-height)',
                    color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                    opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                }}
            >
                © 2025–{new Date().getFullYear()} <Link href="https://www.borderux.com" target="_blank" rel="noopener noreferrer" layer="layer-0" endIcon={ExternalLinkIcon ? <ExternalLinkIcon /> : undefined}>Border LLC</Link>.<br />Version {packageJson.version} · <Link href="https://github.com/borderux/recursica-forge" target="_blank" rel="noopener noreferrer" layer="layer-0" endIcon={ExternalLinkIcon ? <ExternalLinkIcon /> : undefined}>GitHub</Link>
            </div>
        </>
    )
}
