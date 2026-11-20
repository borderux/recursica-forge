/**
 * Toolbar → real adapter integration.
 *
 * Proves that a toolbar edit restyles the REAL adapter (@recursica/adapter-mantine-v8): the
 * toolbar writes a Forge variable (updateCssVar), Forge's scoped CSS engine aliases it onto the
 * stable `--recursica_ui-kit_components_*` name, and the adapter's stylesheet rule that reads
 * that name changes the rendered element's computed style.
 *
 * renderWithForge supplies both halves the way the app does (VarsProvider + scoped CSS engine
 * for the values, the adapter stylesheet for the rules). Each case asserts on the computed
 * style of the element the adapter actually styles — never on a Forge-private custom property.
 *
 * The older *.toolbar suites for Panel/Accordion/AssistiveElement assert the LOCAL adapter's
 * internals and run in the `local-adapter` project (vitest.browser.config.ts).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { renderWithForge } from '../../../test-utils/renderWithForge'
import { preloadComponent } from '../../registry'
import { Panel } from '../Panel'
import { Accordion } from '../Accordion'
import { AssistiveElement } from '../AssistiveElement'
import { updateCssVar } from '../../../core/css/updateCssVar'
import { buildComponentCssVarPath, getComponentLevelCssVar } from '../../utils/cssVarNames'

type Case = {
  name: string
  /** The Forge variable the toolbar writes. */
  forgeVar: () => string
  value: string
  /** Element the adapter styles, found from the rendered output. */
  target: () => HTMLElement
  /** Computed-style property to read, and the value it must resolve to. */
  property: string
  expected: string
}

async function setToolbarVar(name: string, value: string) {
  await act(async () => {
    updateCssVar(name, value)
    window.dispatchEvent(new CustomEvent('cssVarsUpdated', { detail: { cssVars: [name] } }))
  })
}

async function expectRestyles(c: Case) {
  const el = c.target()
  expect(el, `${c.name}: target element`).toBeTruthy()
  // Guard against a vacuous pass: the value must not already be the test value.
  expect(getComputedStyle(el).getPropertyValue(c.property)).not.toBe(c.expected)
  await setToolbarVar(c.forgeVar(), c.value)
  await waitFor(() => {
    expect(getComputedStyle(el).getPropertyValue(c.property)).toBe(c.expected)
  }, { timeout: 5000 })
}

const byClass = (fragment: string, from: Element = document.body) => {
  const el = from.querySelector(`[class*="${fragment}"]`) as HTMLElement | null
  if (!el) throw new Error(`no element with class containing "${fragment}"`)
  return el
}

describe('Toolbar → real adapter', () => {
  beforeAll(async () => {
    await Promise.all(['Panel', 'Accordion', 'AssistiveElement'].map((n) => preloadComponent('mantine', n as any)))
  })

  describe('Panel', () => {
    const render = async () => {
      renderWithForge(
        <Panel title="Panel title" isOpen layer="layer-0">
          <p>Panel body</p>
        </Panel>
      )
      await screen.findByText('Panel title', {}, { timeout: 30000 })
    }
    const content = () => screen.getByText('Panel title').closest('[class*="Panel-module__content"]') as HTMLElement
    const header = () => byClass('Panel-module__header', content())

    const cases: Case[] = [
      { name: 'background color', forgeVar: () => getComponentLevelCssVar('Panel', 'colors.layer-0.background-color'), value: '#ff0000', target: content, property: 'background-color', expected: 'rgb(255, 0, 0)' },
      { name: 'border radius', forgeVar: () => getComponentLevelCssVar('Panel', 'border-radius'), value: '13px', target: content, property: 'border-top-left-radius', expected: '13px' },
      { name: 'header/footer horizontal padding', forgeVar: () => getComponentLevelCssVar('Panel', 'header-footer-horizontal-padding'), value: '37px', target: header, property: 'padding-left', expected: '37px' },
      { name: 'header/footer vertical padding', forgeVar: () => getComponentLevelCssVar('Panel', 'header-footer-vertical-padding'), value: '19px', target: header, property: 'padding-top', expected: '19px' },
      { name: 'header-close gap', forgeVar: () => getComponentLevelCssVar('Panel', 'header-close-gap'), value: '23px', target: header, property: 'column-gap', expected: '23px' },
    ]
    for (const c of cases) {
      it(`restyles ${c.name}`, async () => {
        await render()
        await expectRestyles(c)
      }, 60000)
    }
  })

  describe('Accordion', () => {
    const render = async () => {
      renderWithForge(
        <Accordion items={[{ id: 'a', title: 'Item A', content: 'Content A', open: true }]} layer="layer-0" />
      )
      await screen.findByText('Item A', {}, { timeout: 30000 })
    }
    const root = () => screen.getByText('Item A').closest('[class*="Accordion-module__root"]') as HTMLElement
    const control = () => screen.getByText('Item A').closest('button') as HTMLElement
    const contentEl = () => screen.getByText('Content A').closest('[class*="Accordion-module__content"]') as HTMLElement

    const cases: Case[] = [
      { name: 'container background color', forgeVar: () => buildComponentCssVarPath('Accordion', 'properties', 'colors', 'layer-0', 'background-color'), value: '#ff0000', target: root, property: 'background-color', expected: 'rgb(255, 0, 0)' },
      { name: 'container border radius', forgeVar: () => getComponentLevelCssVar('Accordion', 'border-radius'), value: '11px', target: root, property: 'border-top-left-radius', expected: '11px' },
      { name: 'open header background color', forgeVar: () => buildComponentCssVarPath('AccordionHeader', 'variants', 'appearance', 'open', 'properties', 'colors', 'layer-0', 'background-color'), value: '#00ff00', target: control, property: 'background-color', expected: 'rgb(0, 255, 0)' },
      { name: 'content text color', forgeVar: () => buildComponentCssVarPath('AccordionContent', 'properties', 'colors', 'layer-0', 'text-color'), value: '#0000ff', target: contentEl, property: 'color', expected: 'rgb(0, 0, 255)' },
    ]
    for (const c of cases) {
      it(`restyles ${c.name}`, async () => {
        await render()
        await expectRestyles(c)
      }, 60000)
    }
  })

  describe('AssistiveElement', () => {
    const render = async (variant: 'help' | 'error') => {
      renderWithForge(
        <AssistiveElement variant={variant} text={`${variant} message`} icon={<span>!</span>} layer="layer-0" />
      )
      await screen.findByText(`${variant} message`, {}, { timeout: 30000 })
    }
    const text = (variant: string) => () => screen.getByText(`${variant} message`) as HTMLElement
    const rootOf = (variant: string) => () => screen.getByText(`${variant} message`).closest('[class*="AssistiveElement-module__root"]') as HTMLElement
    const iconWrapper = (variant: string) => () => byClass('AssistiveElement-module__iconWrapper', rootOf(variant)())

    const cases: Array<Case & { variant: 'help' | 'error' }> = [
      { variant: 'help', name: 'help text color', forgeVar: () => buildComponentCssVarPath('AssistiveElement', 'variants', 'types', 'help', 'properties', 'colors', 'layer-0', 'text-color'), value: '#0000ff', target: text('help'), property: 'color', expected: 'rgb(0, 0, 255)' },
      { variant: 'error', name: 'error text color', forgeVar: () => buildComponentCssVarPath('AssistiveElement', 'variants', 'types', 'error', 'properties', 'colors', 'layer-0', 'text-color'), value: '#ff0000', target: text('error'), property: 'color', expected: 'rgb(255, 0, 0)' },
      { variant: 'help', name: 'icon size', forgeVar: () => getComponentLevelCssVar('AssistiveElement', 'icon-size'), value: '29px', target: iconWrapper('help'), property: 'width', expected: '29px' },
      { variant: 'help', name: 'icon-text gap', forgeVar: () => getComponentLevelCssVar('AssistiveElement', 'icon-text-gap'), value: '17px', target: rootOf('help'), property: 'column-gap', expected: '17px' },
    ]
    for (const c of cases) {
      it(`restyles ${c.name}`, async () => {
        await render(c.variant)
        await expectRestyles(c)
      }, 60000)
    }
  })
})
