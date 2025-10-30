import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './modules/app/Layout'
import { CodePenPage } from './modules/theme/index'
import ElevationPage from './modules/theme/ElevationPage'
import TypePage from './modules/type/TypePage'
import PreviewPage from './modules/preview/PreviewPage'
import TokensPage from './modules/tokens/TokensPage'
import LayersPage from './modules/theme/LayersPage'
import { UiKitProvider } from './modules/uikit/UiKitContext'
import { applyTheme, LIGHT_MODE } from './modules/theme/index'
import tokensJson from './vars/Tokens.json'
import { applyCssVars } from './modules/theme/varsUtil'
import './styles/index.css'
import './styles/theme.css.ts'

// Ensure CSS variables are set before initial render to avoid half-loaded state
applyTheme(LIGHT_MODE)

// Seed core palette CSS variables so alternative layers render correct backgrounds
try {
  const get = (name: string): string | undefined => {
    // Support legacy names like "color/gray/1000"
    const parts = (name || '').split('/')
    if (parts[0] === 'color' && parts.length >= 3) {
      const fam = parts[1]
      const lvl = parts[2]
      const v = (tokensJson as any)?.color?.[fam]?.[lvl]?.$value
      return typeof v === 'string' ? v : undefined
    }
    return undefined
  }
  const defaults: Record<string, { token: string; hex: string }> = {
    '--palette-black': { token: 'color/gray/1000', hex: get('color/gray/1000') || '#000000' },
    '--palette-white': { token: 'color/gray/000', hex: get('color/gray/000') || '#ffffff' },
    '--palette-alert': { token: 'color/mandy/500', hex: get('color/mandy/500') || get('color/mandy/600') || '#d40d0d' },
    '--palette-warning': { token: 'color/mandarin/500', hex: get('color/mandarin/500') || '#fc7527' },
    '--palette-success': { token: 'color/greensheen/500', hex: get('color/greensheen/500') || '#008b38' },
  }
  let merged = { ...defaults }
  try {
    const raw = localStorage.getItem('palette-bindings')
    if (raw) {
      const bindings = JSON.parse(raw) as Record<string, { token: string; hex: string }>
      merged = { ...merged, ...bindings }
    }
  } catch {}
  const colors: Record<string, string> = {}
  Object.entries(merged).forEach(([cssVar, info]) => { colors[cssVar] = info.hex })
  applyCssVars(colors)
} catch {}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/tokens" replace /> },
      { path: '/tokens', element: <TokensPage /> },
      { path: '/palettes', element: <CodePenPage /> },
      { path: '/elevation', element: <ElevationPage /> },
      { path: '/type', element: <TypePage /> },
      { path: '/layers', element: <LayersPage /> },
      { path: '/uikit', element: <PreviewPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UiKitProvider>
      <RouterProvider router={router} />
    </UiKitProvider>
  </React.StrictMode>,
)
