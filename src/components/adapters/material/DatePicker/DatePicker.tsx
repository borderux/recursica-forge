/**
 * Material UI DatePicker Implementation
 * 
 * Material UI-specific DatePicker component that uses CSS variables for theming.
 * Uses the same custom calendar popover as the Mantine implementation.
 */

// Re-export a single shared implementation since the DatePicker is fully custom
// (not using any library-specific date picker components). This used to point at
// Forge's local Mantine implementation; that has been replaced by the real
// published adapter, so it now re-exports that instead.
export { DatePicker as default } from '@recursica/mantine-adapter'
