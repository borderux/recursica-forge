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
 *   npx tsx scripts/adapter-wiring-report.ts             # summary
 *   npx tsx scripts/adapter-wiring-report.ts --full      # every variable name
 *   npx tsx scripts/adapter-wiring-report.ts --json      # machine-readable
 *   npx tsx scripts/adapter-wiring-report.ts --markdown [path]
 *       # full gap report with inferred rename suggestions,
 *       # written to docs/ADAPTER_GAP_REPORT.md by default
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs'
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

/**
 * Collapses the differences we know are systematic rather than semantic, so a variable the
 * adapter reads can be matched to the variable Forge now emits for the same thing:
 *
 *   - `_layer-N` — Forge's runtime keeps the layer in the name; the export (and the
 *     adapter) resolve layer through the cascade instead.
 *   - a trailing `-color` — Forge renamed its colour leaves (`background` →
 *     `background-color`, `text` → `text-color`, `icon` → `icon-color`).
 *
 * Two names with the same normalized key almost certainly mean the same token, which turns
 * an opaque list of missing variables into "read this instead".
 */
function normalizeKey(varName: string): string {
  return varName.replace(/_layer-\d+/g, '').replace(/-color$/, '')
}

/** Returns the component subtree a ui-kit variable belongs to, or null. */
function componentOf(varName: string): string | null {
  return /^--recursica_ui-kit_components_([a-z0-9-]+)_/.exec(varName)?.[1] ?? null
}

/**
 * Splits a variable name into comparable segments. By default the component prefix is
 * dropped so two names within one component compare on their property path alone; pass
 * `withComponent` to keep it, which is what makes a cross-component move (Forge splitting
 * `tabs` into `tabs` + `tabs-item`) score sensibly.
 */
function segmentsOf(varName: string, withComponent = false): string[] {
  const stripped = withComponent
    ? varName.replace(/^--recursica_ui-kit_/, '')
    : varName.replace(/^--recursica_ui-kit_(components_[a-z0-9-]+_|globals_)?/, '')
  return stripped.split(/[_-]/).filter(Boolean)
}

/** Ranks candidate replacements for one drifted variable, best first. */
function rankCandidates(reads: string, pool: string[], withComponent: boolean): string[] {
  const wantedList = segmentsOf(reads, withComponent)
  const wanted = new Set(wantedList)
  // The final segment is the property itself (font-family, opacity, …). Requiring it to
  // match keeps suggestions to the same kind of property.
  const leaf = wantedList[wantedList.length - 1]

  return pool
    .map((candidate) => {
      const segments = segmentsOf(candidate, withComponent)
      if (segments[segments.length - 1] !== leaf) return null
      const present = new Set(segments)
      const shared = [...wanted].filter((s) => present.has(s)).length
      // Dropping a segment the adapter asked for (losing `selected`, say) is a far worse
      // sign than carrying extra path segments, which is exactly what restructuring adds
      // (`variants_selection-states_…`). Weight the two asymmetrically or the correct,
      // longer candidate loses to a shorter unrelated one.
      const missing = wanted.size - shared
      const extra = segments.filter((s) => !wanted.has(s)).length
      return { candidate, score: shared * 2 - missing * 3 - extra * 0.25 }
    })
    .filter((x): x is { candidate: string; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.candidate.length - b.candidate.length)
    .slice(0, 3)
    .map((s) => s.candidate)
}

export interface DriftEntry {
  /** The variable the adapter's CSS reads. */
  reads: string
  /** Forge variable for the same token, found by normalising layer and `-color`. */
  exact: string | null
  /**
   * Ranked guesses when there is no exact match, for variables Forge restructured rather
   * than renamed. Scored by how many name segments they share, so they are suggestions for
   * a human to confirm — not assertions.
   */
  candidates: string[]
}

/**
 * Classifies each drifted variable.
 *
 * An exact match means a mechanical rename: apply it. Candidates mean Forge moved the token
 * somewhere else in the tree — the common case being interactive states, which Forge
 * centralised (so the adapter's `..._sizes_default_properties_hover-color` and
 * `..._colors_text-hover` no longer exist as leaves). Neither means someone must decide
 * where the adapter should now read from.
 */
function classifyDrift(drift: string[], forgeEmits: Set<string>): DriftEntry[] {
  const byKey = new Map<string, string>()
  const byComponent = new Map<string, string[]>()
  const allUiKit: string[] = []

  for (const name of forgeEmits) {
    if (!name.startsWith('--recursica_ui-kit_')) continue
    const key = normalizeKey(name)
    // Prefer the shortest spelling: it is the least layer/suffix-decorated one.
    const existing = byKey.get(key)
    if (!existing || name.length < existing.length) byKey.set(key, name)

    allUiKit.push(name)
    const component = componentOf(name)
    if (component) {
      if (!byComponent.has(component)) byComponent.set(component, [])
      byComponent.get(component)!.push(name)
    }
  }

  return drift.map((reads) => {
    const exact = byKey.get(normalizeKey(reads)) ?? null
    if (exact) return { reads, exact, candidates: [] }

    const component = componentOf(reads)
    const sameComponent = rankCandidates(reads, component ? (byComponent.get(component) ?? []) : [], false)
    if (sameComponent.length) return { reads, exact: null, candidates: sameComponent }

    // Nothing in this component. Forge may have moved the token to a different component
    // entirely — it split Tabs into Tabs + TabsItem, for instance — so widen the search.
    return { reads, exact: null, candidates: rankCandidates(reads, allUiKit, true) }
  })
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

/** Renders the whole gap analysis as a markdown document. */
function renderMarkdown(
  entries: DriftEntry[],
  unwired: string[],
  matched: string[],
  adapterReads: Set<string>,
  sources: string[]
): string {
  const adapterVersion = JSON.parse(
    readFileSync(resolve(repoRoot, 'node_modules/@recursica/mantine-adapter/package.json'), 'utf8')
  ).version
  const releaseVersion = JSON.parse(
    readFileSync(resolve(repoRoot, 'node_modules/@recursica/official-release/package.json'), 'utf8')
  ).version

  const renamed = entries.filter((e) => e.exact)
  const restructured = entries.filter((e) => !e.exact && e.candidates.length > 0)
  const absent = entries.filter((e) => !e.exact && e.candidates.length === 0)
  const pct = ((matched.length / adapterReads.size) * 100).toFixed(1)

  /** Groups drift entries by component, largest group first. */
  const byComponent = (list: DriftEntry[]) => {
    const groups = new Map<string, DriftEntry[]>()
    for (const e of list) {
      const key = componentOf(e.reads) ?? (/_globals_/.test(e.reads) ? '(globals)' : '(other)')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }
    return new Map(
      [...groups]
        .map(([k, v]) => [k, v.sort((a, b) => a.reads.localeCompare(b.reads))] as const)
        .sort((a, b) => b[1].length - a[1].length)
    )
  }

  const L: string[] = []
  L.push('# Adapter Gap Report')
  L.push('')
  L.push(
    `Generated by \`npm run report:adapter-wiring -- --markdown\` from ` +
      `\`@recursica/mantine-adapter@${adapterVersion}\` and ` +
      `\`@recursica/official-release@${releaseVersion}\`, compared against Forge's current ` +
      `\`recursica_ui-kit.json\`.`
  )
  L.push('')
  L.push('| | count |')
  L.push('| --- | --- |')
  L.push(`| Variables the adapter reads | ${adapterReads.size} |`)
  L.push(`| Resolving correctly | ${matched.length} (${pct}%) |`)
  L.push(`| **Drifted** — adapter reads, Forge no longer emits | **${entries.length}** |`)
  L.push(`| ↳ mechanical rename (exact counterpart found) | ${renamed.length} |`)
  L.push(`| ↳ restructured (candidates suggested) | ${restructured.length} |`)
  L.push(`| ↳ no counterpart at all | ${absent.length} |`)
  L.push(`| **Unwired** — Forge emits, adapter never reads | **${unwired.length}** |`)
  L.push('')
  L.push('## How to read this')
  L.push('')
  L.push(
    'Two independent problems. **Drift** means the adapter asks for a variable name Forge ' +
      'stopped emitting, so that property renders unstyled. **Unwired** means Forge exposes a ' +
      'property the adapter never consumes, so changing it in Forge does nothing.'
  )
  L.push('')
  L.push(
    'Drift splits three ways, and the split matters: only the first group is a find-and-replace. ' +
      `The bulk (${restructured.length}) is Forge having **restructured** where a token lives rather ` +
      'than renamed it — most visibly interactive states, which Forge centralised, so adapter ' +
      'leaves like `..._sizes_default_properties_hover-color` and `..._colors_text-hover` no ' +
      'longer exist anywhere. Those need a decision about where the adapter should read from, ' +
      'not a rename.'
  )
  L.push('')
  L.push(
    'Scope: this compares Forge\'s **exported** CSS shape. The live preview is worse still, ' +
      'because Forge\'s runtime engine (`src/core/css/scopedCssEngine.ts`) keeps the layer ' +
      'segment inside generic names (`..._colors_layer-0_background-color`) while its own ' +
      'export strips it and resolves layer through the cascade (`..._colors_background-color`). ' +
      'Runtime and export therefore disagree, and a variable listed as matched here can still ' +
      'fail to resolve in the browser. That discrepancy is a separate Forge-side fix.'
  )
  L.push('')

  L.push(`## 1. Mechanical renames — apply directly (${renamed.length})`)
  L.push('')
  L.push(
    'These have an unambiguous counterpart: the names differ only by the layer segment and/or ' +
      "Forge's added `-color` suffix (`background` → `background-color`, `text` → `text-color`). " +
      'Change the left name to the right name in the adapter CSS.'
  )
  L.push('')
  for (const [component, list] of byComponent(renamed)) {
    L.push(`### ${component} (${list.length})`)
    L.push('')
    L.push('| adapter reads | should read |')
    L.push('| --- | --- |')
    for (const e of list) L.push(`| \`${e.reads}\` | \`${e.exact}\` |`)
    L.push('')
  }

  L.push(`## 2. Restructured — needs a decision (${restructured.length})`)
  L.push('')
  L.push(
    'No exact counterpart exists. The candidates are ranked by name-segment overlap within the ' +
      'same component and are **suggestions to confirm, not answers** — verify each against ' +
      "Forge's `recursica_ui-kit.json` before changing the adapter."
  )
  L.push('')
  for (const [component, list] of byComponent(restructured)) {
    L.push(`### ${component} (${list.length})`)
    L.push('')
    L.push('| adapter reads | candidates in Forge |')
    L.push('| --- | --- |')
    for (const e of list) {
      const from = componentOf(e.reads)
      const cells = e.candidates.map((c) => {
        const to = componentOf(c)
        // Flag a move to another component — the reader needs to know the property changed
        // owner, not just path.
        return to && to !== from ? `\`${c}\` **→ ${to}**` : `\`${c}\``
      })
      L.push(`| \`${e.reads}\` | ${cells.join('<br>')} |`)
    }
    L.push('')
  }

  if (absent.length) {
    L.push(`## 3. No counterpart at all (${absent.length})`)
    L.push('')
    L.push(
      'No candidate anywhere shares even the final property segment. Almost all of these are the ' +
        'adapter fusing a **state into the leaf name** — `text-hover`, `border-color-hover`, ' +
        '`background-checked`, `background-unchecked`, `background-indeterminate`, ' +
        '`active-background`, `disabled-border` — whereas Forge now models states as their own ' +
        'variant nodes (`variants_states_hover_properties_colors_text-color`, and so on). So the ' +
        'value usually does exist in Forge; it just is not reachable by matching property names. ' +
        'These need the adapter restructured to read per-state variants, not a rename.'
    )
    L.push('')
    for (const [component, list] of byComponent(absent)) {
      L.push(`### ${component} (${list.length})`)
      L.push('')
      for (const e of list) L.push(`- \`${e.reads}\``)
      L.push('')
    }
  }

  L.push(`## 4. Unwired — Forge emits, adapter ignores (${unwired.length})`)
  L.push('')
  L.push(
    'Editing these in Forge has no visible effect on the real component. Ordered by ' +
      'component, largest gap first.'
  )
  L.push('')
  for (const [component, vars] of groupByComponent(unwired)) {
    L.push(`### ${component} (${vars.length})`)
    L.push('')
    for (const v of vars.sort()) L.push(`- \`${v}\``)
    L.push('')
  }

  L.push('---')
  L.push('')
  L.push(`Adapter CSS read from: ${sources.map((s) => `\`${s}\``).join(', ')}`)
  L.push('')
  return L.join('\n')
}

function main() {
  const full = process.argv.includes('--full')
  const asJson = process.argv.includes('--json')
  const mdFlag = process.argv.indexOf('--markdown')
  const asMarkdown = mdFlag !== -1

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

  const entries = classifyDrift(drift, forgeEmits)

  if (asJson) {
    console.log(JSON.stringify({ drift: entries, unwired, matched, sources }, null, 2))
    return
  }

  if (asMarkdown) {
    const target =
      process.argv[mdFlag + 1] && !process.argv[mdFlag + 1].startsWith('--')
        ? process.argv[mdFlag + 1]
        : 'docs/ADAPTER_GAP_REPORT.md'
    writeFileSync(
      resolve(repoRoot, target),
      renderMarkdown(entries, unwired, matched, adapterReads, sources)
    )
    const renamed = entries.filter((e) => e.exact).length
    const restructured = entries.filter((e) => !e.exact && e.candidates.length).length
    console.log(`wrote ${target}`)
    console.log(
      `  drift ${entries.length}: ${renamed} mechanical rename, ${restructured} restructured, ` +
        `${entries.length - renamed - restructured} no counterpart`
    )
    console.log(`  unwired ${unwired.length}`)
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
