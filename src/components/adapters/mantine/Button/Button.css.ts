/**
 * Mantine Button CSS Overrides
 * 
 * Overrides Mantine Button styles to use fully namespaced Recursica CSS variables.
 * CSS variables are set on the wrapper div by the TSX file.
 */

import { globalStyle } from '@vanilla-extract/css'

/* Base styles - use CSS vars from button element (set by TSX file) */
/* Use !important to override Mantine's default styles */
globalStyle('.mantine-Button-root', {
  borderRadius: 'var(--button-border-radius) !important',
  fontFamily: 'var(--button-font-family) !important',
  fontSize: 'var(--button-font-size) !important',
  fontWeight: 'var(--button-font-weight) !important',
  letterSpacing: 'var(--button-letter-spacing) !important',
  lineHeight: 'var(--button-line-height) !important',
} as any)

/* Size-specific styles - use CSS variables set on button element (from TSX) */
/* The TSX file sets --button-height, --button-padding-x, --button-min-width, --button-fz on the button element */
/* These can be overridden via propOverrides, so we use them here */
globalStyle('.mantine-Button-root[data-size="xs"]', {
  // Use CSS variables set on button element (which may have prop overrides)
  height: 'var(--button-height)',
  minWidth: 'var(--button-min-width)',
  paddingLeft: 'var(--button-padding-x)',
  paddingRight: 'var(--button-padding-x)',
} as any)

globalStyle('.mantine-Button-root[data-size="md"], .mantine-Button-root[data-size="lg"]', {
  // Use CSS variables set on button element (which may have prop overrides)
  height: 'var(--button-height)',
  minWidth: 'var(--button-min-width)',
  paddingLeft: 'var(--button-padding-x)',
  paddingRight: 'var(--button-padding-x)',
} as any)

/* Layer-specific styles - use CSS vars from button element (set by TSX file) */
/* Use !important to override Mantine's default styles */
/* Layer 0 */
globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="filled"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="filled"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="outline"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
  // Border is handled by general rule in Button.css with !important
} as any)

globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="outline"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="subtle"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-0 .mantine-Button-root[data-variant="subtle"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

/* Layer 1 */
globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="filled"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="filled"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="outline"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
  // Border is handled by general rule in Button.css with !important
} as any)

globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="outline"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="subtle"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-1 .mantine-Button-root[data-variant="subtle"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

/* Layer 2 */
globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="filled"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="filled"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="outline"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
  // Border is handled by general rule in Button.css with !important
} as any)

globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="outline"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="subtle"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-2 .mantine-Button-root[data-variant="subtle"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

/* Layer 3 */
globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="filled"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="filled"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="outline"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
  // Border is handled by general rule in Button.css with !important
} as any)

globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="outline"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="subtle"]', {
  backgroundColor: 'var(--button-bg) !important',
  color: 'var(--button-color) !important',
} as any)

globalStyle('.recursica-layer-3 .mantine-Button-root[data-variant="subtle"]:hover:not(:disabled)', {
  backgroundColor: 'var(--button-hover) !important',
  color: 'var(--button-text-hover, var(--button-color)) !important',
} as any)

/* Override Mantine Button leftSection margin to use intermediate CSS variables */
/* These variables are set on the button element and can be overridden via propOverrides */
globalStyle(
  '.recursica-button-left-section, .mantine-Button-root .recursica-button-left-section, [class*="m_a74036a"].recursica-button-left-section, [class*="m_a74036a"][data-position="left"], .mantine-Button-root .mantine-Button-leftSection, .mantine-Button-root[data-position="left"], .mantine-Button-leftSection[data-position="left"], [class*="mantine-Button-leftSection"][data-position="left"]',
  {
    marginInlineEnd: 'var(--button-icon-gap)',
    width: 'var(--button-icon-size)',
    height: 'var(--button-icon-size)',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
)

/* Ensure SVG icons scale to fill their container in leftSection */
globalStyle('.mantine-Button-root .mantine-Button-leftSection svg', {
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  flexShrink: 0,
})

/* General rule: Set all SVGs in buttons to use intermediate CSS variable */
/* --button-icon-size is set on the button element based on size prop and can be overridden via propOverrides */
globalStyle(
  '.mantine-Button-root svg, .mantine-Button-root svg[width], .mantine-Button-root svg[height], .mantine-Button-root svg[width="0"], .mantine-Button-root svg[height="0"], .mantine-Button-root svg[style*="width"], .mantine-Button-root svg[style*="height"], .mantine-Button-root svg[style*="width: 0"], .mantine-Button-root svg[style*="height: 0"], .mantine-Button-root svg[style*="width:0"], .mantine-Button-root svg[style*="height:0"], .mantine-Button-root .mantine-Button-label svg, .mantine-Button-root > svg',
  {
    width: 'var(--button-icon-size)',
    height: 'var(--button-icon-size)',
    minWidth: 'var(--button-icon-size)',
    minHeight: 'var(--button-icon-size)',
    maxWidth: 'var(--button-icon-size)',
    maxHeight: 'var(--button-icon-size)',
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    flexShrink: 0,
  }
)

/* Ensure button label can truncate text with ellipsis */
/* Use CSS variables from wrapper/button element (can be overridden via propOverrides) */
/* --button-icon-size and --button-icon-gap are set on the wrapper div and inherit to button */
globalStyle('.mantine-Button-root .mantine-Button-label', {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block',
  maxWidth: 'calc(var(--button-max-width, 500px) - var(--button-icon-size, 0px) - var(--button-icon-gap, 0px))',
})

/* When icon exists, we need to center the icon+text group, not expand the label */
globalStyle('.mantine-Button-root:has(.mantine-Button-leftSection) .mantine-Button-label', {
  flex: 'none',
  minWidth: 0,
})

/* For text-only buttons (no icon), don't use flex: 1 to allow centering */
globalStyle('.mantine-Button-root:not(:has(.mantine-Button-leftSection)) .mantine-Button-label', {
  flex: 'none',
})

/* For icon-only buttons, set the span (or container) around the SVG to display: flex */
globalStyle(
  '.mantine-Button-root:not(:has(.mantine-Button-label)):not(:has(.mantine-Button-leftSection)) > span, .mantine-Button-root:not(:has(.mantine-Button-label)):not(:has(.mantine-Button-leftSection)) > *:has(svg), .mantine-Button-root:not(:has(.mantine-Button-label)):not(:has(.mantine-Button-leftSection)) span:has(svg)',
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
)

/* When there is no text and only an icon, the span with class mantine-Button-label needs to be display: flex */
globalStyle(
  '.mantine-Button-root:not(:has(.mantine-Button-leftSection)) .mantine-Button-label:empty, .mantine-Button-root:not(:has(.mantine-Button-leftSection)) .mantine-Button-label:not(:has(text)), .mantine-Button-root:not(:has(.mantine-Button-leftSection)) .mantine-Button-label:not(:has(*:not(svg)))',
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
)

/* Border styles are handled by Button.css with !important to override Mantine's CSS-in-JS */
/* This ensures consistent border application across all layers */

/* Handle disabled state - use opacity from brand state */
globalStyle('.mantine-Button-root[data-disabled="true"], .mantine-Button-root:disabled', {
  opacity: 'var(--recursica-brand-themes-light-state-disabled, var(--recursica-brand-themes-dark-state-disabled, 0.5))',
})

/* Handle elevation via box-shadow - elevation is set on wrapper */
globalStyle('.mantine-Button-root', {
  boxShadow: 'var(--recursica-ui-kit-components-button-elevation, none)',
})
