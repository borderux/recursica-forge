/**
 * SidebarFooter Component
 * 
 * Shared footer used across all sidebar pages (Tokens, Theme, Components).
 * Contains external links and copyright notice using Link components.
 */

import { Link } from '../../components/adapters/Link'
import { useThemeMode } from '../theme/ThemeModeContext'
import { iconNameToReactComponent } from '../components/iconUtils'
import { buildComponentCssVarPath } from '../../components/utils/cssVarNames'
import packageJson from '../../../package.json'

export function SidebarFooter() {
    const { mode } = useThemeMode()
    const layer0Base = `--recursica-brand-themes-${mode}-layers-layer-0-properties`

    const ExternalLinkIcon = iconNameToReactComponent('arrow-top-right-on-square')
    const DocumentIcon = iconNameToReactComponent('document-text')
    const InfoIcon = iconNameToReactComponent('info')

    // Link component color for the copyright links
    const linkTextColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'colors', 'layer-0', 'text')
    const linkHoverColorVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'colors', 'layer-0', 'text')

    // Link component text properties - default state
    const linkFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-weight')
    const linkTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-decoration')
    const linkTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'text-transform')
    const linkFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'default', 'properties', 'text', 'font-style')

    // Link component text properties - hover state
    const linkHoverFontWeightVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-weight')
    const linkHoverTextDecorationVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-decoration')
    const linkHoverTextTransformVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'text-transform')
    const linkHoverFontStyleVar = buildComponentCssVarPath('Link', 'variants', 'states', 'hover', 'properties', 'text', 'font-style')

    // Hover handlers that apply full Link hover state
    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget
        el.style.color = `var(${linkHoverColorVar})`
        el.style.fontWeight = `var(${linkHoverFontWeightVar})`
        el.style.textDecoration = `var(${linkHoverTextDecorationVar}, none)`
        el.style.textTransform = `var(${linkHoverTextTransformVar}, none)`
        el.style.fontStyle = `var(${linkHoverFontStyleVar}, normal)`
    }
    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget
        el.style.color = `var(${linkTextColorVar})`
        el.style.fontWeight = `var(${linkFontWeightVar})`
        el.style.textDecoration = `var(${linkTextDecorationVar}, none)`
        el.style.textTransform = `var(${linkTextTransformVar}, none)`
        el.style.fontStyle = `var(${linkFontStyleVar}, normal)`
    }

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
                    textDecoration: 'var(--recursica-brand-typography-caption-text-decoration)',
                    textTransform: 'var(--recursica-brand-typography-caption-text-transform)' as any,
                    fontStyle: 'var(--recursica-brand-typography-caption-font-style)',
                    color: `var(${layer0Base.replace('-properties', '-elements')}-text-color)`,
                    opacity: `var(${layer0Base.replace('-properties', '-elements')}-text-low-emphasis)`,
                } as React.CSSProperties}
            >
                © 2025–{new Date().getFullYear()}{' '}
                <a
                    href="https://www.borderux.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: `var(${linkTextColorVar})`,
                        fontWeight: `var(${linkFontWeightVar})`,
                        textDecoration: `var(${linkTextDecorationVar}, none)`,
                        textTransform: `var(${linkTextTransformVar}, none)` as any,
                        fontStyle: `var(${linkFontStyleVar}, normal)`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25em',
                    } as React.CSSProperties}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    Border LLC
                    {ExternalLinkIcon && <ExternalLinkIcon style={{ width: '1em', height: '1em', color: 'inherit' }} />}
                </a>
                .
                <br />
                Version {packageJson.version} ·{' '}
                <a
                    href="https://github.com/borderux/recursica-forge"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: `var(${linkTextColorVar})`,
                        fontWeight: `var(${linkFontWeightVar})`,
                        textDecoration: `var(${linkTextDecorationVar}, none)`,
                        textTransform: `var(${linkTextTransformVar}, none)` as any,
                        fontStyle: `var(${linkFontStyleVar}, normal)`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25em',
                    } as React.CSSProperties}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    GitHub
                    {ExternalLinkIcon && <ExternalLinkIcon style={{ width: '1em', height: '1em', color: 'inherit' }} />}
                </a>
            </div>
        </>
    )
}
