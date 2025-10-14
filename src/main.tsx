import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from './modules/app/App'
import { CodePenPage } from './modules/theme/index'
import './styles/index.css'
import './styles/theme.css.ts'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/theme', element: <CodePenPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
