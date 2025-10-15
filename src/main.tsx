import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './modules/app/Layout'
import { CodePenPage } from './modules/theme/index'
import ElevationPage from './modules/theme/ElevationPage'
import LayersPage from './modules/theme/LayersPage'
import TypePage from './modules/type/TypePage'
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
      { path: '/', element: <Navigate to="/theme" replace /> },
      { path: '/theme', element: <CodePenPage /> },
      { path: '/elevation', element: <ElevationPage /> },
      { path: '/layers', element: <LayersPage /> },
      { path: '/type', element: <TypePage /> },
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
