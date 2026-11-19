/**
 * Live-preview parity with the published adapter's component contract.
 *
 * Since @recursica/adapter-mantine-v8 1.6.0 the adapter reads only the stable
 * `--recursica_ui-kit_components_<c>_properties_*` names and selects a variant with
 * data-recursica-<axis> attributes. The export has always written the rules that make that
 * work; this checks the runtime engine writes them too, from the real ui-kit JSON, and that
 * every name those rules point at is actually defined by the same sheet.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { updateScopedCss, resetScopedCssCache } from './scopedCssEngine'
import { buildUIKitVars } from '../resolvers/uikit'
import { expandLayers } from '../uikit/expandLayers'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

let css = ''
let defined = new Set<string>()

beforeAll(() => {
  const uikit = expandLayers(JSON.parse(JSON.stringify(uikitJson)))
  const vars = {
    ...buildUIKitVars(tokensJson as any, brandJson as any, uikit, 'light'),
    ...buildUIKitVars(tokensJson as any, brandJson as any, uikit, 'dark'),
  }
  document.getElementById('recursica-scoped')?.remove()
  resetScopedCssCache()
  updateScopedCss(vars, uikit)
  css = document.getElementById('recursica-scoped')?.textContent ?? ''
  defined = new Set([...css.matchAll(/^\s*(--recursica_[A-Za-z0-9_-]+):/gm)].map((m) => m[1]))
})

describe('scopedCssEngine component contracts', () => {
  it('writes a contract block for components with variants', () => {
    expect(css).toContain('button: component contract.')
    expect(css).toContain('[data-recursica="badge"]')
  })

  it('defines every ui-kit component name the published adapter reads', () => {
    const adapterCss = readFileSync(
      resolve(process.cwd(), 'node_modules/@recursica/adapter-mantine-v8/dist/adapter-mantine-v8.css'),
      'utf8'
    )
    const read = [
      ...new Set(
        [...adapterCss.matchAll(/var\(\s*(--recursica_ui-kit_components_[A-Za-z0-9_-]+)/g)].map((m) => m[1])
      ),
    ]
    expect(read.length).toBeGreaterThan(100) // sanity: we really parsed the adapter CSS
    expect(read.filter((n) => !defined.has(n))).toEqual([])
  })

  it('only points contract names at names the sheet defines', () => {
    const contracts = css.slice(css.indexOf(': component contract.'))
    const targets = [...new Set([...contracts.matchAll(/var\((--recursica_[A-Za-z0-9_-]+)\)/g)].map((m) => m[1]))]
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.filter((n) => !defined.has(n))).toEqual([])
  })
})
