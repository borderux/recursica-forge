// Runs BEFORE vitest.browser.setup.ts and before any test module is imported, so that
// src/components/registry/activeAdapter.ts — which reads the choice once, at module load —
// resolves to the local adapter for every suite in the `local-adapter` browser project.
//
// The key is written as a literal on purpose: importing MANTINE_ADAPTER_STORAGE_KEY from
// activeAdapter.ts would load that module (and lock in its default) before this line runs.
window.localStorage.setItem('recursica:mantine-adapter', 'local')
