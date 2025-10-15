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
import './styles/index.css'
import './styles/theme.css.ts'

// Ensure CSS variables are set before initial render to avoid half-loaded state
applyTheme(LIGHT_MODE)

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
      { path: '/preview', element: <PreviewPage /> },
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
