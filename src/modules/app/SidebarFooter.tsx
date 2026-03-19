/**
 * SidebarFooter Component
 * 
 * Shared footer used across all sidebar pages (Tokens, Theme, Components).
 * Contains external links and copyright notice using Link components.
 */

import { Link } from '../../components/adapters/Link'
import { useThemeMode } from '../theme/ThemeModeContext'
import { genericLayerText } from '../../core/css/cssVarBuilder'
import { iconNameToReactComponent } from '../components/iconUtils'
import packageJson from '../../../package.json'

export function SidebarFooter() {
    const { mode } = useThemeMode()
    const layer0TextColor = genericLayerText(0, 'color')
    const layer0TextLow = genericLayerText(0, 'low-emphasis')

    const ExternalLinkIcon = iconNameToReactComponent('arrow-top-right-on-square')
    const DocumentIcon = iconNameToReactComponent('document-text')
    const InfoIcon = iconNameToReactComponent('info')

    const dimStyle: React.CSSProperties = {
        color: `var(${layer0TextColor})`,
        opacity: `var(${layer0TextLow})` as any,
    }

    return (
        <>
            {/* Footer Links */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--recursica_brand_dimensions_general_default)',
                    marginTop: 'auto',
                    paddingTop: 'var(--recursica_brand_dimensions_general_lg)',
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
                    marginTop: 'var(--recursica_brand_dimensions_gutters_vertical)',
                    fontFamily: 'var(--recursica_brand_typography_caption-font-family)',
                    fontSize: 'var(--recursica_brand_typography_caption-font-size)',
                    fontWeight: 'var(--recursica_brand_typography_caption-font-weight)' as any,
                    letterSpacing: 'var(--recursica_brand_typography_caption-font-letter-spacing)',
                    lineHeight: 'var(--recursica_brand_typography_caption-line-height)',
                    textDecoration: 'var(--recursica_brand_typography_caption-text-decoration)',
                    textTransform: 'var(--recursica_brand_typography_caption-text-transform)' as any,
                    fontStyle: 'var(--recursica_brand_typography_caption-font-style)',
                } as React.CSSProperties}
            >
                <span style={dimStyle}>© 2025–{new Date().getFullYear()}{' '}</span>
                <Link
                    href="https://www.borderux.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    layer="layer-0"
                    endIcon={ExternalLinkIcon ? <ExternalLinkIcon style={{ width: '1em', height: '1em' }} /> : undefined}
                >
                    Border LLC
                </Link>
                <span style={dimStyle}>{'.'}<br />Version {packageJson.version} ·{' '}</span>
                <Link
                    href="https://github.com/borderux/recursica-forge"
                    target="_blank"
                    rel="noopener noreferrer"
                    layer="layer-0"
                    endIcon={ExternalLinkIcon ? <ExternalLinkIcon style={{ width: '1em', height: '1em' }} /> : undefined}
                >
                    GitHub
                </Link>
            </div>
        </>
    )
}
