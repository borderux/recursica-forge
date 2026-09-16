/**
 * Rewrites recursica_ui-kit.json into the collapsed layer form.
 *
 * Pass component names to convert just those, or no arguments to convert the whole file:
 *   npx tsx scripts/collapse-uikit-layers.ts button
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { collapseLayers, expandLayers } from '../src/core/uikit/expandLayers'

const path = resolve(process.cwd(), 'recursica_ui-kit.json')
const raw = JSON.parse(readFileSync(path, 'utf8'))
const root = raw['ui-kit'] ?? raw
const names = process.argv.slice(2)
const targets = names.length > 0 ? names : Object.keys(root.components)

let before = 0
let after = 0
for (const name of targets) {
  const component = root.components?.[name]
  if (!component) {
    console.error(`no component "${name}"`)
    process.exit(1)
  }
  const original = JSON.stringify(component)
  const collapsed = collapseLayers(JSON.parse(original))
  // Never write something that does not expand back to exactly what was there.
  const roundTrip = JSON.stringify(expandLayers(JSON.parse(JSON.stringify(collapsed))))
  if (roundTrip !== original) {
    console.error(`${name}: collapsed form does not expand back to the original — not written`)
    process.exit(1)
  }
  before += original.length
  after += JSON.stringify(collapsed).length
  root.components[name] = collapsed
}

writeFileSync(path, JSON.stringify(raw, null, 2) + '\n')
console.log(`${targets.length} component(s): ${before} → ${after} chars (${Math.round((1 - after / before) * 100)}% smaller)`)
