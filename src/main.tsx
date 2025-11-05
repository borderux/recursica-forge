import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './modules/app/Layout'
import { CodePenPage } from './modules/theme/index'
import TypePage from './modules/type/TypePage'
import PreviewPage from './modules/preview/PreviewPage'
import TokensPage from './modules/tokens/TokensPage'
import LayersPage from './modules/theme/LayersPage'
import { UiKitProvider } from './modules/uikit/UiKitContext'
import { VarsProvider } from './modules/vars/VarsContext'
import './styles/index.css'
import './styles/theme.css.ts'
import tokensImport from './vars/Tokens.json'
import themeImport from './vars/Brand.json'
import uikitImport from './vars/UIKit.json'

// Bootstrap: ensure Brand/Tokens/UIKit are in localStorage and apply layer CSS vars before first paint
(() => {
  try {
    const write = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v))
    const read = (k: string) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null }
    // Seed LS if missing
    if (!localStorage.getItem('rf:tokens')) write('rf:tokens', tokensImport as any)
    if (!localStorage.getItem('rf:theme')) {
      const normalized = (themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any)
      write('rf:theme', normalized)
    }
    if (!localStorage.getItem('rf:uikit')) write('rf:uikit', uikitImport as any)

    const tokens = read('rf:tokens') || (tokensImport as any)
    const theme = read('rf:theme') || ((themeImport as any)?.brand ? themeImport : ({ brand: themeImport } as any))

    const applyCssVars = (vars: Record<string, string>) => {
      const root = document.documentElement
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    }
    const tokensRoot: any = (tokens as any)?.tokens || {}
    const getTokenValue = (path: string): any => {
      const parts = path.split('/')
      if (parts[0] === 'color' && parts[1] && parts[2]) return tokensRoot?.color?.[parts[1]]?.[parts[2]]?.$value
      if (parts[0] === 'opacity' && parts[1]) return tokensRoot?.opacity?.[parts[1]]?.$value
      if (parts[0] === 'size' && parts[1]) return tokensRoot?.size?.[parts[1]]?.$value
      return undefined
    }
    const toCssValue = (v: any, unitIfNumber?: string): string | undefined => {
      if (v == null) return undefined
      if (typeof v === 'object') {
        if (Object.prototype.hasOwnProperty.call(v as any, 'value')) {
          const val: any = (v as any).value
          const unit: any = (v as any).unit
          if (typeof val === 'number') return unit ? `${val}${unit}` : (unitIfNumber ? `${val}${unitIfNumber}` : String(val))
          return unit ? `${val}${unit}` : String(val)
        }
      }
      if (typeof v === 'number') return unitIfNumber ? `${v}${unitIfNumber}` : String(v)
      return String(v)
    }
    const resolveRef = (input: any, depth = 0): any => {
      if (depth > 8) return undefined
      if (input == null) return undefined
      if (typeof input === 'number') return input
      if (typeof input === 'object') return resolveRef((input as any).$value ?? (input as any).value ?? input, depth + 1)
      const s = String(input).trim()
      if (!s) return undefined
      if (s.startsWith('{') && s.endsWith('}')) {
        const inner = s.slice(1, -1).trim()
        if (/^(tokens|token)\./i.test(inner)) {
          const path = inner.replace(/^(tokens|token)\./i, '').replace(/[.]/g, '/').replace(/\/+/, '/').trim()
          return resolveRef(getTokenValue(path), depth + 1)
        }
        if (/^theme\./i.test(inner)) {
          const full = `brand.${inner.replace(/^theme\./i, '')}`
          const parts = full.split('.').filter(Boolean)
          let node: any = (theme as any)
          for (const p of parts) { if (!node) break; node = node[p] }
          return resolveRef(node, depth + 1)
        }
        if (/^brand\./i.test(inner)) {
          const parts = inner.split('.').filter(Boolean)
          let node: any = (theme as any)
          for (const p of parts) { if (!node) break; node = node[p] }
          return resolveRef(node, depth + 1)
        }
        return undefined
      }
      return s
    }
    const applyForLayer = (id: string, spec: any, prefix: string, out: Record<string, string>) => {
      const base = `--layer-layer-${prefix}-property-`
      const surf = resolveRef(spec?.property?.surface)
      const pad = resolveRef(spec?.property?.padding)
      const bcol = resolveRef(spec?.property?.['border-color'])
      const bth = resolveRef(spec?.property?.['border-thickness'])
      const brad = resolveRef(spec?.property?.['border-radius'])
      if (surf != null) out[`${base}surface`] = String(surf)
      if (pad != null) out[`${base}padding`] = toCssValue(pad, 'px')!
      if (bcol != null) out[`${base}border-color`] = String(bcol)
      if (bth != null) out[`${base}border-thickness`] = toCssValue(bth, 'px')!
      if (brad != null) out[`${base}border-radius`] = toCssValue(brad, 'px')!
      const textBase = `--layer-layer-${prefix}-property-element-text-`
      const tcolor = resolveRef(spec?.element?.text?.color)
      const th = resolveRef(spec?.element?.text?.['high-emphasis'])
      const tl = resolveRef(spec?.element?.text?.['low-emphasis'])
      const talert = resolveRef(spec?.element?.text?.alert)
      const twarn = resolveRef(spec?.element?.text?.warning)
      const tsuccess = resolveRef(spec?.element?.text?.success)
      if (tcolor != null) out[`${textBase}color`] = String(tcolor)
      if (th != null) out[`${textBase}high-emphasis`] = String(th)
      if (tl != null) out[`${textBase}low-emphasis`] = String(tl)
      if (talert != null) out[`${textBase}alert`] = String(talert)
      if (twarn != null) out[`${textBase}warning`] = String(twarn)
      if (tsuccess != null) out[`${textBase}success`] = String(tsuccess)
      const interBase = `--layer-layer-${prefix}-property-element-interactive-`
      const icolor = resolveRef(spec?.element?.interactive?.color)
      const ih = resolveRef(spec?.element?.interactive?.['high-emphasis'])
      const ihover = resolveRef(spec?.element?.interactive?.['hover-color'])
      if (icolor != null) out[`${interBase}color`] = String(icolor)
      if (ih != null) out[`${interBase}high-emphasis`] = String(ih)
      if (ihover != null) out[`${interBase}hover-color`] = String(ihover)
    }
    const troot: any = (theme as any)?.brand ? (theme as any).brand : theme
    const layersLight: any = troot?.light?.layer || {}
    const vars: Record<string, string> = {}
    ;['0','1','2','3'].forEach((lvl) => {
      const key = `layer-${lvl}`
      if (layersLight && Object.prototype.hasOwnProperty.call(layersLight, key)) applyForLayer(lvl, layersLight[key], lvl, vars)
    })
    const alts: any = layersLight?.['layer-alternative'] || {}
    Object.keys(alts).forEach((altKey) => applyForLayer(altKey, alts[altKey], `alternative-${altKey}`, vars))
    if (Object.keys(vars).length) applyCssVars(vars)
  } catch {}
})()

// CSS variables are now seeded and managed by VarsProvider

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/tokens" replace /> },
      { path: '/tokens', element: <TokensPage /> },
      { path: '/palettes', element: <CodePenPage /> },
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
