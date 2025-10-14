import './index.css'
import { useEffect, useMemo, useState } from 'react'

type ThemeVars = Record<string, string>

const HSL = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`

const LIGHT_MODE: ThemeVars = {
  "--temp-disabled": "rgba(0,0,0,0.38)",
  "--temp-overlay": "rgba(0,0,0,0.68)",
  "--temp-elevation-0": "rgba(0,0,0,0.14)",

  "--palette-alert": "#000000",
  "--palette-black": "#000000",
  "--palette-success": "#000000",
  "--palette-warning": "#000000",
  "--palette-white": "#000000",
  "--palette-overlay": "0.38",
  "--palette-disabled": "0.38",

  "--palette-neutral-900-tone": "#000000",
  "--palette-neutral-800-tone": "#000000",
  "--palette-neutral-700-tone": "#000000",
  "--palette-neutral-600-tone": "#000000",
  "--palette-neutral-500-tone": "#000000",
  "--palette-neutral-400-tone": "#000000",
  "--palette-neutral-300-tone": "#000000",
  "--palette-neutral-200-tone": "#000000",
  "--palette-neutral-100-tone": "#000000",
  "--palette-neutral-050-tone": "#000000",

  "--palette-neutral-900-on-tone": "#000000",
  "--palette-neutral-800-on-tone": "#000000",
  "--palette-neutral-700-on-tone": "#000000",
  "--palette-neutral-600-on-tone": "#000000",
  "--palette-neutral-500-on-tone": "#000000",
  "--palette-neutral-400-on-tone": "#000000",
  "--palette-neutral-300-on-tone": "#000000",
  "--palette-neutral-200-on-tone": "#000000",
  "--palette-neutral-100-on-tone": "#000000",
  "--palette-neutral-050-on-tone": "#000000",

  "--palette-neutral-900-high-emphasis": "1",
  "--palette-neutral-800-high-emphasis": "1",
  "--palette-neutral-700-high-emphasis": "1",
  "--palette-neutral-600-high-emphasis": "1",
  "--palette-neutral-500-high-emphasis": "1",
  "--palette-neutral-400-high-emphasis": "1",
  "--palette-neutral-300-high-emphasis": "1",
  "--palette-neutral-200-high-emphasis": "1",
  "--palette-neutral-100-high-emphasis": "1",
  "--palette-neutral-050-high-emphasis": "1",

  "--palette-neutral-900-low-emphasis": "0.38",
  "--palette-neutral-800-low-emphasis": "0.38",
  "--palette-neutral-700-low-emphasis": "0.38",
  "--palette-neutral-600-low-emphasis": "0.38",
  "--palette-neutral-500-low-emphasis": "0.38",
  "--palette-neutral-400-low-emphasis": "0.38",
  "--palette-neutral-300-low-emphasis": "0.38",
  "--palette-neutral-200-low-emphasis": "0.38",
  "--palette-neutral-100-low-emphasis": "0.38",
  "--palette-neutral-050-low-emphasis": "0.38",

  "--elevation-elevation-0-shadow-color": "#000000",
  "--elevation-elevation-0-blur": "0px",
  "--elevation-elevation-0-spread": "0px",
  "--elevation-elevation-0-x-axis": "0px",
  "--elevation-elevation-0-y-axis": "0px",

  "--elevation-elevation-1-shadow-color": "#000000",
  "--elevation-elevation-1-blur": "4px",
  "--elevation-elevation-1-spread": "4px",
  "--elevation-elevation-1-x-axis": "4px",
  "--elevation-elevation-1-y-axis": "4px",

  "--elevation-elevation-2-shadow-color": "#000000",
  "--elevation-elevation-2-blur": "8px",
  "--elevation-elevation-2-spread": "8px",
  "--elevation-elevation-2-x-axis": "8px",
  "--elevation-elevation-2-y-axis": "8px",

  "--elevation-elevation-3-shadow-color": "#000000",
  "--elevation-elevation-3-blur": "12px",
  "--elevation-elevation-3-spread": "12px",
  "--elevation-elevation-3-x-axis": "12px",
  "--elevation-elevation-3-y-axis": "12px",

  "--elevation-elevation-4-shadow-color": "#000000",
  "--elevation-elevation-4-blur": "16px",
  "--elevation-elevation-4-spread": "16px",
  "--elevation-elevation-4-x-axis": "16px",
  "--elevation-elevation-4-y-axis": "16px",

  "--font-h1-font-family": "lexend",
  "--font-h1-font-size": "64",
  "--font-h1-font-weight": "bold",
  "--font-h1-font-letter-spacing": "0",

  "--font-h2-font-family": "lexend",
  "--font-h2-font-size": "64",
  "--font-h2-font-weight": "bold",
  "--font-h2-font-letter-spacing": "0",

  "--font-h3-font-family": "lexend",
  "--font-h3-font-size": "64",
  "--font-h3-font-weight": "bold",
  "--font-h3-font-letter-spacing": "0",

  "--font-h4-font-family": "lexend",
  "--font-h4-font-size": "64",
  "--font-h4-font-weight": "bold",
  "--font-h4-font-letter-spacing": "0",

  "--font-h5-font-family": "lexend",
  "--font-h5-font-size": "64",
  "--font-h5-font-weight": "bold",
  "--font-h5-font-letter-spacing": "0",

  "--font-h6-font-family": "lexend",
  "--font-h6-font-size": "64",
  "--font-h6-font-weight": "bold",
  "--font-h6-font-letter-spacing": "0",

  "--font-button-font-family": "lexend",
  "--font-button-font-size": "16",
  "--font-button-font-weight": "regular",
  "--font-button-font-letter-spacing": "0",

  "--font-caption-font-family": "lexend",
  "--font-caption-font-size": "16",
  "--font-caption-font-weight": "regular",
  "--font-caption-font-letter-spacing": "0",

  "--font-overline-font-family": "lexend",
  "--font-overline-font-size": "16",
  "--font-overline-font-weight": "regular",
  "--font-overline-font-letter-spacing": "0",

  "--font-body-1-font-family": "lexend",
  "--font-body-1-font-size": "16",
  "--font-body-1-font-weight-normal": "regular",
  "--font-body-1-font-weight-strong": "bold",
  "--font-body-1-font-letter-spacing": "0",

  "--font-body-2-font-family": "lexend",
  "--font-body-2-font-size": "16",
  "--font-body-2-font-weight-normal": "regular",
  "--font-body-2-font-weight-strong": "bold",
  "--font-body-2-font-letter-spacing": "0",

  "--font-subtitle-1-font-family": "lexend",
  "--font-subtitle-1-font-size": "16",
  "--font-subtitle-1-font-weight-normal": "regular",
  "--font-subtitle-1-font-weight-strong": "bold",
  "--font-subtitle-1-font-letter-spacing": "0",

  "--font-subtitle-2-font-family": "lexend",
  "--font-subtitle-2-font-size": "16",
  "--font-subtitle-2-font-weight-normal": "regular",
  "--font-subtitle-2-font-weight-strong": "bold",
  "--font-subtitle-2-font-letter-spacing": "0",

  "--layer-layer-0-property-surface": "#FFFFFF",
  "--layer-layer-0-property-padding": "24px",
  "--layer-layer-0-property-element-text-alert": "#000000",
  "--layer-layer-0-property-element-text-warning": "#000000",
  "--layer-layer-0-property-element-text-success": "#000000",
  "--layer-layer-0-property-element-text-color": "#000000",
  "--layer-layer-0-property-element-text-high-emphasis": "1",
  "--layer-layer-0-property-element-text-low-emphasis": "0.5",
  "--layer-layer-0-property-element-interactive-color": "#000000",
  "--layer-layer-0-property-element-interactive-high-emphasis": "1",

  "--layer-layer-1-property-surface": "#FFFFFF",
  "--layer-layer-1-property-border-color": "#000000",
  "--layer-layer-1-property-border-thickness": "1px",
  "--layer-layer-1-property-border-radius": "4px",
  "--layer-layer-1-property-padding": "24px",
  "--layer-layer-1-property-elevation": "1",
  "--layer-layer-1-property-element-text-alert": "#000000",
  "--layer-layer-1-property-element-text-warning": "#000000",
  "--layer-layer-1-property-element-text-success": "#000000",
  "--layer-layer-1-property-element-text-color": "#000000",
  "--layer-layer-1-property-element-text-high-emphasis": "1",
  "--layer-layer-1-property-element-text-low-emphasis": "0.5",
  "--layer-layer-1-property-element-interactive-color": "#000000",
  "--layer-layer-1-property-element-interactive-high-emphasis": "1",

  "--layer-layer-2-property-surface": "#FFFFFF",
  "--layer-layer-2-property-border-color": "#000000",
  "--layer-layer-2-property-border-thickness": "1px",
  "--layer-layer-2-property-border-radius": "4px",
  "--layer-layer-2-property-padding": "24px",
  "--layer-layer-2-property-elevation": "1",
  "--layer-layer-2-property-element-text-alert": "#000000",
  "--layer-layer-2-property-element-text-warning": "#000000",
  "--layer-layer-2-property-element-text-success": "#000000",
  "--layer-layer-2-property-element-text-color": "#000000",
  "--layer-layer-2-property-element-text-high-emphasis": "1",
  "--layer-layer-2-property-element-text-low-emphasis": "0.5",
  "--layer-layer-2-property-element-interactive-color": "#000000",
  "--layer-layer-2-property-element-interactive-high-emphasis": "1",

  "--layer-layer-3-property-surface": "#FFFFFF",
  "--layer-layer-3-property-border-color": "#000000",
  "--layer-layer-3-property-border-thickness": "1px",
  "--layer-layer-3-property-border-radius": "4px",
  "--layer-layer-3-property-padding": "24px",
  "--layer-layer-3-property-elevation": "1",
  "--layer-layer-3-property-element-text-alert": "#000000",
  "--layer-layer-3-property-element-text-warning": "#000000",
  "--layer-layer-3-property-element-text-success": "#000000",
  "--layer-layer-3-property-element-text-color": "#000000",
  "--layer-layer-3-property-element-text-high-emphasis": "1",
  "--layer-layer-3-property-element-text-low-emphasis": "0.5",
  "--layer-layer-3-property-element-interactive-color": "#000000",
  "--layer-layer-3-property-element-interactive-high-emphasis": "1",

  "--layer-layer-alternative-warning-property-surface": "gray",
  "--layer-layer-alternative-warning-property-padding": "24px",
  "--layer-layer-alternative-warning-property-element-text-color": "#000000",
  "--layer-layer-alternative-warning-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-warning-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-warning-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-warning-property-element-interactive-high-emphasis": "1",

  "--layer-layer-alternative-high-contrast-property-surface": "gray",
  "--layer-layer-alternative-high-contrast-property-padding": "24px",
  "--layer-layer-alternative-high-contrast-property-element-text-color": "#000000",
  "--layer-layer-alternative-high-contrast-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-high-contrast-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-high-contrast-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-high-contrast-property-element-interactive-high-emphasis": "1",

  "--layer-layer-alternative-primary-color-property-surface": "gray",
  "--layer-layer-alternative-primary-color-property-padding": "24px",
  "--layer-layer-alternative-primary-color-property-element-text-color": "#000000",
  "--layer-layer-alternative-primary-color-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-primary-color-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-primary-color-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-primary-color-property-element-interactive-high-emphasis": "1",

  "--layer-layer-alternative-alert-property-surface": "gray",
  "--layer-layer-alternative-alert-property-padding": "24px",
  "--layer-layer-alternative-alert-property-element-text-color": "#000000",
  "--layer-layer-alternative-alert-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-alert-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-alert-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-alert-property-element-interactive-high-emphasis": "1",

  "--layer-layer-alternative-success-property-surface": "gray",
  "--layer-layer-alternative-success-property-padding": "24px",
  "--layer-layer-alternative-success-property-element-text-color": "#000000",
  "--layer-layer-alternative-success-property-element-text-high-emphasis": "1",
  "--layer-layer-alternative-success-property-element-text-low-emphasis": "0.5",
  "--layer-layer-alternative-success-property-element-interactive-color": "#000000",
  "--layer-layer-alternative-success-property-element-interactive-high-emphasis": "1",
}

const DARK_MODE: ThemeVars = {
  // Define dark mode overrides when available
}

function applyTheme(theme: ThemeVars) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value)
  }
}

export function CodePenPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    applyTheme(LIGHT_MODE)
    // set initial switch background for light mode
    const el = document.getElementById('darkModeSwitch') as HTMLDivElement | null
    if (el) el.style.backgroundColor = 'var(--color-neutral-300)'
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      applyTheme(DARK_MODE)
    } else {
      applyTheme(LIGHT_MODE)
    }
  }, [isDarkMode])

  return (
    <div id="body" className="antialiased" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)' }}>
      <div className="container-padding">
        <div className="header-group">
          <h1 id="theme-mode-label">{isDarkMode ? 'Dark Theme' : 'Light Theme'}</h1>
          <div className="toggle-group">
            <span>Dark Mode</span>
            <div
              id="darkModeSwitch"
              className={`toggle-switch${isDarkMode ? ' dark-mode' : ''}`}
              style={{ backgroundColor: isDarkMode ? 'var(--color-scale1-500)' : 'var(--color-neutral-300)' }}
              onClick={() => setIsDarkMode((v) => !v)}
            />
          </div>
        </div>

        <div className="section">
          <h2>Colors</h2>
          <table className="color-swatches">
            <thead>
              <tr>
                <th>Black</th>
                <th>White</th>
                <th>Alert</th>
                <th>Warn</th>
                <th>Success</th>
                <th>
                  Disabled
                  <br />(opacity)
                </th>
                <th>
                  Overlay
                  <br />(opacity)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="swatch-box" style={{ backgroundColor: 'var(--palette-black)' }} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--palette-white)' }} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--palette-alert)' }} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--palette-warning)' }} />
                <td className="swatch-box" style={{ backgroundColor: 'var(--palette-success)' }} />
                <td className="swatch-box disabled" />
                <td className="swatch-box overlay" />
              </tr>
              <tr>
                <td>#ffffff<br />@varname</td>
                <td>#ffffff<br />@varname</td>
                <td>#ffffff<br />@varname</td>
                <td>#ffffff<br />@varname</td>
                <td>#ffffff<br />@varname</td>
                <td>68%<br />@varname</td>
                <td>38%<br />@varname</td>
              </tr>
            </tbody>
          </table>

          <div className="palette-container">
            <h3>Neutral (Grayscale)</h3>
            <table className="color-palettes">
              <thead>
                <tr>
                  <th>Emphasis</th>
                  <th>900</th>
                  <th>800</th>
                  <th>700</th>
                  <th>600</th>
                  <th>500</th>
                  <th>400</th>
                  <th>300</th>
                  <th className="default">200</th>
                  <th>100</th>
                  <th>050</th>
                </tr>
              </thead>
              <tbody>
                <tr className="high-emphasis">
                  <td>High</td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-900-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-900-on-tone)', opacity: 'var(--palette-neutral-900-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-800-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-800-on-tone)', opacity: 'var(--palette-neutral-800-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-700-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-700-on-tone)', opacity: 'var(--palette-neutral-700-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-600-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-600-on-tone)', opacity: 'var(--palette-neutral-600-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-500-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-500-on-tone)', opacity: 'var(--palette-neutral-500-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-400-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-400-on-tone)', opacity: 'var(--palette-neutral-400-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-300-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-300-on-tone)', opacity: 'var(--palette-neutral-300-high-emphasis)' }} />
                  </td>
                  <td className="palette-box default" style={{ backgroundColor: 'var(--palette-neutral-200-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-200-on-tone)', opacity: 'var(--palette-neutral-200-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-100-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-100-on-tone)', opacity: 'var(--palette-neutral-100-high-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-050-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-050-on-tone)', opacity: 'var(--palette-neutral-050-high-emphasis)' }} />
                  </td>
                </tr>
                <tr className="low-emphasis">
                  <td>Low</td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-900-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-900-on-tone)', opacity: 'var(--palette-neutral-900-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-800-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-800-on-tone)', opacity: 'var(--palette-neutral-800-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-700-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-700-on-tone)', opacity: 'var(--palette-neutral-700-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-600-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-600-on-tone)', opacity: 'var(--palette-neutral-600-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-500-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-500-on-tone)', opacity: 'var(--palette-neutral-500-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-400-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-400-on-tone)', opacity: 'var(--palette-neutral-400-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-300-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-300-on-tone)', opacity: 'var(--palette-neutral-300-low-emphasis)' }} />
                  </td>
                  <td className="palette-box default" style={{ backgroundColor: 'var(--palette-neutral-200-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-200-on-tone)', opacity: 'var(--palette-neutral-200-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-100-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-100-on-tone)', opacity: 'var(--palette-neutral-100-low-emphasis)' }} />
                  </td>
                  <td className="palette-box" style={{ backgroundColor: 'var(--palette-neutral-050-tone)' }}>
                    <div className="palette-dot" style={{ backgroundColor: 'var(--palette-neutral-050-on-tone)', opacity: 'var(--palette-neutral-050-low-emphasis)' }} />
                  </td>
                </tr>
                <tr>
                  <td>Tone</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td className="default">#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                  <td>#ffffff<br />@varname</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <h2>Layers</h2>
          <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', color: 'var(--layer-layer-0-property-element-text-color)', padding: 'var(--layer-layer-0-property-padding)' }}>
            <div className="layer-content">
              <div className="layer-text-samples">
                <h3>Layer 0 (Background)</h3>
                <p style={{ opacity: 'var(--layer-layer-0-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                <p style={{ opacity: 'var(--layer-layer-0-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-interactive-color)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-alert)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Alert</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-warning)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Warning</p>
                <p style={{ color: 'var(--layer-layer-0-property-element-text-success)', opacity: 'var(--layer-layer-0-property-element-interactive-high-emphasis)' }}>Success</p>
              </div>

              <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-1-property-surface)', color: 'var(--layer-layer-1-property-element-text-color)', padding: 'var(--layer-layer-1-property-padding)', border: 'var(--layer-layer-1-property-border-thickness) solid var(--layer-layer-1-property-border-color)', borderRadius: 'var(--layer-layer-1-property-border-radius)' }}>
                <div className="layer-content">
                  <div className="layer-text-samples">
                    <h3>Layer 1</h3>
                    <p style={{ opacity: 'var(--layer-layer-1-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                    <p style={{ opacity: 'var(--layer-layer-1-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-interactive-color)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-alert)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Alert</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-warning)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Warning</p>
                    <p style={{ color: 'var(--layer-layer-1-property-element-text-success)', opacity: 'var(--layer-layer-1-property-element-interactive-high-emphasis)' }}>Success</p>
                  </div>

                  <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-2-property-surface)', color: 'var(--layer-layer-2-property-element-text-color)', padding: 'var(--layer-layer-2-property-padding)', border: 'var(--layer-layer-2-property-border-thickness) solid var(--layer-layer-2-property-border-color)', borderRadius: 'var(--layer-layer-2-property-border-radius)' }}>
                    <div className="layer-content">
                      <div className="layer-text-samples">
                        <h3>Layer 2</h3>
                        <p style={{ opacity: 'var(--layer-layer-2-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                        <p style={{ opacity: 'var(--layer-layer-2-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-interactive-color)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-alert)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Alert</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-warning)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Warning</p>
                        <p style={{ color: 'var(--layer-layer-2-property-element-text-success)', opacity: 'var(--layer-layer-2-property-element-interactive-high-emphasis)' }}>Success</p>
                      </div>

                      <div className="layer-container" style={{ backgroundColor: 'var(--layer-layer-3-property-surface)', color: 'var(--layer-layer-3-property-element-text-color)', padding: 'var(--layer-layer-3-property-padding)', border: 'var(--layer-layer-3-property-border-thickness) solid var(--layer-layer-3-property-border-color)', borderRadius: 'var(--layer-layer-3-property-border-radius)' }}>
                        <div className="layer-content">
                          <div className="layer-text-samples">
                            <h3>Layer 3</h3>
                            <p style={{ opacity: 'var(--layer-layer-3-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
                            <p style={{ opacity: 'var(--layer-layer-3-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-interactive-color)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Interactive (Link / Button)</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-alert)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Alert</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-warning)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Warning</p>
                            <p style={{ color: 'var(--layer-layer-3-property-element-text-success)', opacity: 'var(--layer-layer-3-property-element-interactive-high-emphasis)' }}>Success</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Alternative Layers</h2>
          <div className="alt-layers-wrapper">
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-high-contrast-property-surface)', color: 'var(--layer-layer-alternative-high-contrast-property-element-text-color)', padding: 'var(--layer-layer-alternative-high-contrast-property-padding)' }}>
              <h3>High Contrast</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-high-contrast-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-high-contrast-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-high-contrast-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-primary-color-property-surface)', color: 'var(--layer-layer-alternative-primary-color-property-element-text-color)', padding: 'var(--layer-layer-alternative-primary-color-property-padding)' }}>
              <h3>Primary Color</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-primary-color-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-primary-color-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-alert-property-surface)', color: 'var(--layer-layer-alternative-alert-property-element-text-color)', padding: 'var(--layer-layer-alternative-alert-property-padding)' }}>
              <h3>Alert</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-alert-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-alert-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-alert-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-alert-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-alert-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-warning-property-surface)', color: 'var(--layer-layer-alternative-warning-property-element-text-color)', padding: 'var(--layer-layer-alternative-warning-property-padding)' }}>
              <h3>Warning</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-warning-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-warning-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-warning-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-warning-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
            <div className="card alt-layer-card" style={{ backgroundColor: 'var(--layer-layer-alternative-success-property-surface)', color: 'var(--layer-layer-alternative-success-property-element-text-color)', padding: 'var(--layer-layer-alternative-success-property-padding)' }}>
              <h3>Success</h3>
              <p style={{ opacity: 'var(--layer-layer-alternative-success-property-element-text-high-emphasis)' }}>High Emphasis Text / Icon</p>
              <p style={{ opacity: 'var(--layer-layer-alternative-success-property-element-text-low-emphasis)' }}>Low Emphasis Text / Icon</p>
              <p style={{ color: 'var(--layer-layer-alternative-success-property-element-interactive-color)', opacity: 'var(--layer-layer-alternative-success-property-element-text-high-emphasis)' }}>Interactive</p>
              <p style={{ color: 'var(--layer-layer-alternative-success-property-element-interactive-color)', opacity: 'var(--palette-disabled)' }}>Disabled Interactive</p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Elevation</h2>
          <div className="elevation-grid">
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-0-x-axis) var(--elevation-elevation-0-y-axis) var(--elevation-elevation-0-blur) var(--elevation-elevation-0-spread) var(--elevation-elevation-0-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>0</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-1-x-axis) var(--elevation-elevation-1-y-axis) var(--elevation-elevation-1-blur) var(--elevation-elevation-1-spread) var(--elevation-elevation-1-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>1</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-2-x-axis) var(--elevation-elevation-2-y-axis) var(--elevation-elevation-2-blur) var(--elevation-elevation-2-spread) var(--elevation-elevation-2-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>2</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-3-x-axis) var(--elevation-elevation-3-y-axis) var(--elevation-elevation-3-blur) var(--elevation-elevation-3-spread) var(--elevation-elevation-3-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>3</span>
            </div>
            <div className="card text-center" style={{ backgroundColor: 'var(--layer-layer-0-property-surface)', boxShadow: 'var(--elevation-elevation-4-x-axis) var(--elevation-elevation-4-y-axis) var(--elevation-elevation-4-blur) var(--elevation-elevation-4-spread) var(--elevation-elevation-4-shadow-color)' }}>
              <span style={{ color: 'var(--color-black)' }}>4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


