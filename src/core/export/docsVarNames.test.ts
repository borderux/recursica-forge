/**
 * The docs hand agents and people variable names to copy. For a long time those names were written
 * with hyphens throughout — `--recursica-ui-kit-components-button-...` — and none of them existed,
 * because the exporter joins segments with underscores. Nothing caught it, so it survived for
 * months across a dozen files.
 *
 * This reads every concrete name out of every tracked markdown file and checks it against the
 * stylesheet the exporter actually produces. New documentation is covered automatically.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { recursicaJsonTransform } from './recursicaJsonTransformScoped'
import tokensJson from '../../../recursica_tokens.json'
import brandJson from '../../../recursica_brand.json'
import uikitJson from '../../../recursica_ui-kit.json'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

/**
 * Every tracked markdown file that gives guidance. Excluded:
 *   CHANGELOG / .changeset   release history, not instructions
 *   *audit.md                dated snapshots of one adapter on one day. They still carry the old
 *                            hyphen names, and each one opens with a banner saying so. Correcting
 *                            them would mean re-auditing each adapter, not editing prose, so they
 *                            are marked rather than rewritten.
 */
const DOCS = execSync('git ls-files "*.md"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((p) => !/^CHANGELOG\.md$|^\.changeset\/|audit\.md$/.test(p))

/**
 * Names shown deliberately as counter-examples, so a reader can recognise the mistake. Each entry
 * needs prose around it explaining why it is wrong; keep the list short.
 */
const SHOWN_AS_WRONG = new Set([
  '--recursica-ui-kit-...',
  '--recursica_ui-kit_components_button_properties_elevation',
  // Stand-ins in the export pipeline plan, where the point is the shape of a path, not the token.
  '--recursica_brand_palettes_foo',
  '--recursica_path_to_thing',
])

const css = recursicaJsonTransform({
  tokens: clone(tokensJson), brand: clone(brandJson), uikit: clone(uikitJson),
} as any)[0].contents

/** Every variable the stylesheet declares. */
const declared = new Set(
  [...css.matchAll(/^\s*(--recursica_[\w-]+)\s*:/gm)].map((m) => m[1])
)

/**
 * Concrete names only. Prose is full of shorthand that is not a claim about a real variable:
 *   `{component}` / `${level}`  a pattern to fill in
 *   `--recursica_tokens_...`    a prefix, trailing segments elided
 *   `..._layer_N_...`           N stands for a layer number
 *   `--recursica_brand_states_` a prefix left hanging mid-name
 */
function concreteNames(markdown: string, pattern: RegExp): string[] {
  const found = [...markdown.matchAll(pattern)].map((m) => m[0])
  return [...new Set(found)].filter((n) =>
    !/[{}$]/.test(n) &&          // a fill-in pattern
    !/\.\.\.|…/.test(n) &&       // elided tail
    !/_N_|_N$|-N-|-N$/.test(n) && // N as a layer placeholder
    !/[_-]$/.test(n)             // bare prefix
  )
}

/** A bare prefix of a real name (e.g. inside `expect.stringContaining(...)`) is fine. */
const isPrefixOfDeclared = (n: string) => [...declared].some((d) => d.startsWith(n))

/**
 * Documents that describe the exported stylesheet, so every name in them must be one the export
 * transform actually writes.
 */
const EXPORT_DOCS = DOCS.filter((p) =>
  /SCOPED_CSS_ARCHITECTURE|RECURSICA_JSON_SPEC|EXPORT_PIPELINE/.test(p)
)

/** Documents that tell you how to write component code, which runs against the app's own names. */
const IN_APP_DOCS = DOCS.filter((p) => /COMPONENT_DEVELOPMENT_GUIDE/.test(p))

/**
 * The component guide carries one table comparing the two name sets side by side, fenced in
 * `<!-- namespace-comparison -->` markers. Everything inside is quoted on purpose, so the shape
 * rules skip that region — and only that region. Exempting by name instead would let one row in
 * the table excuse the same wrong name anywhere else in the file.
 */
function withoutComparisonTable(text: string): string {
  return text.replace(/<!-- namespace-comparison[\s\S]*?\/namespace-comparison -->/g, '')
}

describe('variable names in the documentation', () => {
  it('covers every tracked markdown file', () => {
    expect(DOCS.length).toBeGreaterThan(20)
  })

  it.each(EXPORT_DOCS)('%s cites only names the exporter emits', (path) => {
    const missing = concreteNames(readFileSync(path, 'utf8'), /--recursica_[A-Za-z0-9_${}.…-]+/g)
      .filter((n) => !declared.has(n) && !SHOWN_AS_WRONG.has(n) && !isPrefixOfDeclared(n))
    expect(missing).toEqual([])
  })

  /**
   * The in-app names cannot be listed here — the store builds them against the DOM — but the three
   * places the two sets diverge are shape rules, and those are checkable. Each of these caught a
   * real mistake: export-shaped names were written into the component guide, where they resolve to
   * nothing.
   */
  describe.each(IN_APP_DOCS)('%s uses in-app shapes, not exported ones', (path) => {
    const text = withoutComparisonTable(readFileSync(path, 'utf8'))
    /**
     * Shape rules apply to patterns too: `--recursica_brand_elevations_elevation-${level}_x` is
     * the wrong shape whether or not part of it is interpolated, and that exact line sat in the
     * guide unnoticed because it looked like a placeholder. So blank the fill-ins out and keep
     * the name, rather than skipping it.
     */
    const literal = text.replace(/\$\{[^}]*\}/g, 'X').replace(/\{[a-zA-Z?]+\}/g, 'X')
    const names = (re: RegExp) =>
      [...new Set([...literal.matchAll(re)].map((m) => m[0]))]
        .filter((n) => !SHOWN_AS_WRONG.has(n) && !/[_-]$/.test(n))

    it('a ui-kit colour carries its layer', () => {
      const noLayer = names(/--recursica_ui-kit_components_[A-Za-z0-9_-]*_colors_[A-Za-z0-9_-]+/g)
        .filter((n) => !/_colors_(layer-\d|X)_/.test(n))
      expect(noLayer).toEqual([])
    })

    it('typography joins style and property with a hyphen', () => {
      const wrong = names(/--recursica_brand_typography_[A-Za-z0-9_-]+/g)
        .filter((n) => !/^--recursica_brand_typography_[a-z0-9X]+-/.test(n))
      expect(wrong).toEqual([])
    })

    it('elevations keep the mode in the name', () => {
      const wrong = names(/--recursica_brand_[A-Za-z0-9_-]*elevations?[A-Za-z0-9_-]*/g)
        .filter((n) => !/^--recursica_brand_modes_(light|dark|X)_elevations_/.test(n))
      expect(wrong).toEqual([])
    })
  })

  it.each(DOCS)('%s spells names with underscores, not hyphens throughout', (path) => {
    // `--recursica-ui-kit-...` is the shape that was wrong everywhere. A hyphen belongs inside a
    // segment (`background-color`), never straight after the `--recursica` prefix. Local helpers
    // in src/styles/interactive-states.css are the one exception, and they are not design tokens.
    const LOCAL_HELPERS = /^--recursica-(hover-tint|focus-outline|focus-glow)$/
    const offending = concreteNames(readFileSync(path, 'utf8'), /--recursica-[A-Za-z][\w.-]*/g)
      .filter((n) => !SHOWN_AS_WRONG.has(n) && !LOCAL_HELPERS.test(n))
    expect(offending).toEqual([])
  })

  it.each(DOCS)('%s points at files that exist', (path) => {
    // `agents.md` sent agents to `src/utils/cssVarNames.ts` for months; the file is under
    // `src/components/utils/`. A path in backticks is a promise that something is there.
    const text = readFileSync(path, 'utf8')
    const cited = [...text.matchAll(/`((?:src|docs|scripts|\.agents)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|json|md|css))`/g)]
      .map((m) => m[1])
    // A planning document may name a file that is yet to be written; those sit under a
    // "Files Needed" heading and are proposals, not claims about what is there.
    const planned = /\*\*Files Needed\*\*:[\s\S]*?(?:\n\n|$)/g
    const proposals = new Set((text.match(planned) ?? []).flatMap(
      (block) => [...block.matchAll(/`([A-Za-z0-9_./-]+)`/g)].map((m) => m[1])
    ))
    const missing = [...new Set(cited)]
      .filter((p) => !existsSync(p) && !/\{|\}/.test(p) && !proposals.has(p))
    expect(missing).toEqual([])
  })

  it('never recommends the deprecated name builder', () => {
    const recommending: string[] = []
    for (const path of DOCS) {
      for (const line of readFileSync(path, 'utf8').split('\n')) {
        if (!line.includes('getComponentCssVar')) continue
        // Mentioning it to say it is deprecated is the point; recommending it is not.
        if (!/deprecated|also still exists/.test(line)) recommending.push(`${path}: ${line.trim()}`)
      }
    }
    expect(recommending).toEqual([])
  })
})
