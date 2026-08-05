/**
 * Adapter Wiring Report
 *
 * Answers two questions about @recursica/mantine-adapter without opening a browser:
 *
 *   1. DRIFT    — which --recursica_* variables does the adapter's shipped CSS read
 *                 that Forge does not emit? Each one is a component that renders
 *                 unstyled. These are renames Forge has made since the adapter was
 *                 published, and together they form the upstream work queue.
 *
 *   2. UNWIRED  — which variables does Forge emit that the adapter never reads?
 *                 Each one is a prop you can change in Forge with no effect on the
 *                 real component, i.e. a prop that isn't wired up in the adapter.
 *
 * Both sides come from real artifacts, not hand-maintained lists:
 *   - adapter side: the prebuilt CSS shipped in node_modules (what actually runs)
 *   - Forge side:   Forge's own export transform over the root recursica_*.json
 *
 * SCOPE: this measures the EXPORTED shape — what a consumer gets from Forge's export,
 * which is the contract that matters for shipping. The live preview is slightly worse,
 * because Forge's runtime scoped CSS engine (src/core/css/scopedCssEngine.ts) keeps the
 * layer segment inside generic names (..._colors_layer-0_background-color) while the
 * export strips it and resolves layer through the cascade (..._colors_background-color).
 * So the runtime and the export currently disagree, and a variable can be reported as
 * matched here while still not resolving in the browser. Worth fixing separately.
 *
 * This script only reads. It never writes to Forge's token files or CSS.
 *
 * Usage:
 *   npx tsx scripts/adapter-wiring-report.ts          # summary
 *   npx tsx scripts/adapter-wiring-report.ts --full   # every variable name
 *   npx tsx scripts/adapter-wiring-report.ts --json   # machine-readable
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { recursicaJsonTransform } from '../src/core/export/recursicaJsonTransformScoped'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const ADAPTER_CSS = [
  'node_modules/@recursica/mantine-adapter/dist/mantine-adapter.css',
  'node_modules/@recursica/adapter-common/dist/adapter-common.css',
]

const VAR_REFERENCE = /var\(\s*(--recursica_[A-Za-z0-9_-]+)/g
const VAR_DECLARATION = /^\s*(--recursica_[A-Za-z0-9_-]+)\s*:/gm

/** Every --recursica_* variable the adapter's shipped CSS reads via var(). */
function readAdapterReferences(): { vars: Set<string>; sources: string[] } {
  const vars = new Set<string>()
  const sources: string[] = []

  for (const rel of ADAPTER_CSS) {
    const path = resolve(repoRoot, rel)
    if (!existsSync(path)) {
      console.error(`  ! missing ${rel} — run npm install`)
      continue
    }
    sources.push(rel)
    const css = readFileSync(path, 'utf8')
    for (const match of css.matchAll(VAR_REFERENCE)) vars.add(match[1])
  }

  return { vars, sources }
}

/**
 * Every --recursica_* variable Forge emits, split into the specific names that live on
 * :root and the generic names the theme/layer blocks alias. The adapter only ever reads
 * generic names — theme and layer are resolved through the cascade — so a comparison
 * has to use the generic set.
 */
function readForgeEmitted(): { generic: Set<string>; specific: Set<string> } {
  const json = {
    tokens: JSON.parse(readFileSync(resolve(repoRoot, 'recursica_tokens.json'), 'utf8')),
    brand: JSON.parse(readFileSync(resolve(repoRoot, 'recursica_brand.json'), 'utf8')),
    uikit: JSON.parse(readFileSync(resolve(repoRoot, 'recursica_ui-kit.json'), 'utf8')),
  }

  const css = recursicaJsonTransform(json)[0].contents

  // Everything before the first scope selector is :root (specific names).
  // Everything after is the theme / theme+layer blocks (generic aliases).
  // Anchor to a selector at the start of a line: the generated file's header comment
  // documents the [data-recursica-theme] contract in prose, and matching that would
  // put the whole :root block on the wrong side of the split.
  const firstScope = css.search(/^\[data-recursica-theme=/m)
  const rootSection = firstScope === -1 ? css : css.slice(0, firstScope)
  const scopedSection = firstScope === -1 ? '' : css.slice(firstScope)

  const specific = new Set<string>()
  for (const m of rootSection.matchAll(VAR_DECLARATION)) specific.add(m[1])

  const generic = new Set<string>()
  for (const m of scopedSection.matchAll(VAR_DECLARATION)) generic.add(m[1])

  // Names declared on :root but never re-scoped (tokens, brand.typography,
  // brand.dimensions) are read directly by consumers, so they count as available too.
  for (const name of specific) {
    if (!name.includes('_themes_')) generic.add(name)
  }

  return { generic, specific }
}

/** Groups variable names by component subtree so the summary stays readable. */
function groupByComponent(vars: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const v of vars) {
    const match = /^--recursica_ui-kit_components_([a-z0-9-]+)_/.exec(v)
    const key = match
      ? match[1]
      : /^--recursica_ui-kit_globals_/.test(v)
        ? '(globals)'
        : /^--recursica_brand_/.test(v)
          ? '(brand)'
          : /^--recursica_tokens_/.test(v)
            ? '(tokens)'
            : '(other)'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(v)
  }
  return new Map([...groups].sort((a, b) => b[1].length - a[1].length))
}

function printSection(
  title: string,
  explanation: string[],
  vars: string[],
  emptyMessage: string,
  full: boolean
) {
  console.log(`\n\n${title}`)
  console.log('─'.repeat(74))
  for (const line of explanation) console.log(`   ${line}`)
  console.log()

  if (vars.length === 0) {
    console.log(`   ${emptyMessage}`)
    return
  }

  const groups = groupByComponent(vars)
  console.log(`   ${vars.length} variables across ${groups.size} subtrees:\n`)
  for (const [component, names] of groups) {
    console.log(`   ${component.padEnd(26)} ${String(names.length).padStart(4)}`)
    if (full) for (const name of names) console.log(`        ${name}`)
  }
}

function main() {
  const full = process.argv.includes('--full')
  const asJson = process.argv.includes('--json')

  const { vars: adapterReads, sources } = readAdapterReferences()
  const { generic: forgeEmits } = readForgeEmitted()

  const drift = [...adapterReads].filter((v) => !forgeEmits.has(v)).sort()
  const matched = [...adapterReads].filter((v) => forgeEmits.has(v)).sort()

  // Unwired only counts ui-kit variables — those are the component properties Forge's
  // editor actually exposes. brand.* and tokens.* are the underlying primitives that
  // ui-kit variables reference; a component not reading them directly is correct by
  // design, so counting them here would bury the real signal.
  const allUnwired = [...forgeEmits].filter((v) => !adapterReads.has(v)).sort()
  const unwired = allUnwired.filter((v) => v.startsWith('--recursica_ui-kit_'))
  const indirectCount = allUnwired.length - unwired.length

  if (asJson) {
    console.log(JSON.stringify({ drift, unwired, matched, sources }, null, 2))
    return
  }


  const pct = adapterReads.size
    ? ((matched.length / adapterReads.size) * 100).toFixed(1)
    : '0.0'

  console.log('\nAdapter Wiring Report  (exported-CSS shape — see header note on runtime)')
  console.log('═'.repeat(74))
  console.log(`   adapter CSS:             ${sources.join(', ')}`)
  console.log(`   variables adapter reads: ${adapterReads.size}`)
  console.log(`   variables Forge emits:   ${forgeEmits.size}`)
  console.log(`   resolving correctly:     ${matched.length} of ${adapterReads.size} (${pct}%)`)

  printSection(
    '1. DRIFT — adapter reads these, Forge does not emit them',
    [
      'These render unstyled. Fix by renaming them in the adapter (upstream) to',
      "match Forge's current schema, then upgrading the installed version.",
    ],
    drift,
    "None — the adapter is in sync with Forge's token names.",
    full
  )

  printSection(
    '2. UNWIRED — Forge emits these, adapter never reads them',
    [
      'Changing these props in Forge has no effect on the real component.',
      "Fix by wiring the variable into the adapter's CSS (upstream).",
    ],
    unwired,
    'None — the adapter consumes every ui-kit variable Forge emits.',
    full
  )

  console.log(
    `\n   (${indirectCount} brand/token primitives are also unread, which is expected —` +
      `\n    ui-kit variables reference them, so components never read them directly.)`
  )

  if (!full) {
    console.log('\n\nRe-run with --full for every variable name, or --json for raw data.')
  }
  console.log()
}

main()
