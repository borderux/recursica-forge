import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './modules/app/Layout'
import PalettesPage from './modules/palettes/PalettesPage'
import TypePage from './modules/type/TypePage'
import PreviewPage from './modules/preview/PreviewPage'
import TokensPage from './modules/tokens/TokensPage'
import LayersPage from './modules/layers/LayersPage'
import { UiKitProvider } from './modules/uikit/UiKitContext'
import { ThemeModeProvider } from './modules/theme/ThemeModeContext'
import { VarsProvider } from './modules/vars/VarsContext'
import { UnifiedThemeProvider } from './components/providers/UnifiedThemeProvider'
import './styles/index.css'
import './styles/theme.css.ts'
import { bootstrapTheme } from './core/bootstrap'

// Initialize component registries
import './components/registry/mantine'
import './components/registry/material'
import './components/registry/carbon'

// Initialize CSS variable audit utility (available in console as window.auditCssVars)
import './core/utils/runCssVarAudit'

// Suppress harmless browser extension errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Suppress Chrome extension async response errors (harmless)
    if (event.message?.includes('message channel closed') || 
        event.message?.includes('asynchronous response')) {
      event.preventDefault()
      return false
    }
  })
  
  // Also catch unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('message channel closed') ||
        event.reason?.message?.includes('asynchronous response')) {
      event.preventDefault()
    }
  })
}

// Initialize theme before React mounts
bootstrapTheme()

// CSS variables are now seeded and managed by VarsProvider

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/tokens" replace /> },
      { path: '/tokens', element: <TokensPage /> },
      { path: '/palettes', element: <PalettesPage /> },
      { path: '/elevation', element: <Navigate to="/layers" replace /> },
      { path: '/type', element: <TypePage /> },
      { path: '/layers', element: <LayersPage /> },
      { path: '/uikit', element: <PreviewPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UiKitProvider>
      <ThemeModeProvider>
        <VarsProvider>
          <UnifiedThemeProvider>
            <RouterProvider router={router} />
          </UnifiedThemeProvider>
        </VarsProvider>
      </ThemeModeProvider>
    </UiKitProvider>
  </React.StrictMode>,
)
