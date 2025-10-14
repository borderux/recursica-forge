import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './modules/app/App'
import './styles/index.css'
import './styles/theme.css.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
