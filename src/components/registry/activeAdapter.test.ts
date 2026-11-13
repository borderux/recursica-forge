import { describe, it, expect, beforeEach, vi } from 'vitest'

const KEY = 'recursica:mantine-adapter'

async function load() {
  vi.resetModules()
  return import('./activeAdapter')
}

describe('activeAdapter', () => {
  beforeEach(() => {
    window.localStorage.removeItem(KEY)
    window.history.replaceState({}, '', '/')
  })

  it('defaults to the local adapter', async () => {
    const m = await load()
    expect(m.getMantineAdapter()).toBe('local')
    expect(m.isLocalAdapter).toBe(true)
  })

  it('reads a stored choice', async () => {
    window.localStorage.setItem(KEY, 'mantine')
    const m = await load()
    expect(m.getMantineAdapter()).toBe('mantine')
    expect(m.isLocalAdapter).toBe(false)
  })

  it('lets ?adapter= win and remembers it', async () => {
    window.localStorage.setItem(KEY, 'local')
    window.history.replaceState({}, '', '/?adapter=mantine')
    const m = await load()
    expect(m.getMantineAdapter()).toBe('mantine')
    expect(window.localStorage.getItem(KEY)).toBe('mantine')
  })

  it('ignores unknown values', async () => {
    window.localStorage.setItem(KEY, 'bogus')
    const m = await load()
    expect(m.getMantineAdapter()).toBe('local')
  })
})
