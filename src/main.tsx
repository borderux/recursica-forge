import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from './modules/app/App'
import { Layout } from './modules/app/Layout'
import { CodePenPage } from './modules/theme/index'
import { UiKitProvider } from './modules/uikit/UiKitContext'
import './styles/index.css'
import './styles/theme.css.ts'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <App /> },
      { path: '/theme', element: <CodePenPage /> },
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
