import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './modules/app/Layout'
import { PalettesPage } from './modules/theme/index'
import TypePage from './modules/type/TypePage'
import PreviewPage from './modules/preview/PreviewPage'
import TokensPage from './modules/tokens/TokensPage'
import LayersPage from './modules/theme/LayersPage'
import { UiKitProvider } from './modules/uikit/UiKitContext'
import { VarsProvider } from './modules/vars/VarsContext'
import './styles/index.css'
import './styles/theme.css.ts'
import { bootstrapTheme } from './core/bootstrap'

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
      <VarsProvider>
        <RouterProvider router={router} />
      </VarsProvider>
    </UiKitProvider>
  </React.StrictMode>,
)
