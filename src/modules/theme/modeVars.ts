/**
 * Helper functions for mode-aware CSS variable names
 */
import { useThemeMode } from './ThemeModeContext'
import type { ThemeMode } from './ThemeModeContext'

/**
 * Gets a mode-aware CSS variable name
 * @param baseName - Base variable name without mode prefix (e.g., 'palettes-core-black')
 * @param mode - Current theme mode ('light' or 'dark')
 * @returns Full CSS variable name with mode prefix
 */
export function getModeVar(baseName: string, mode: ThemeMode): string {
  return `--recursica-brand-${mode}-${baseName}`
}

/**
 * Gets a mode-aware CSS variable reference
 * @param baseName - Base variable name without mode prefix
 * @param mode - Current theme mode
 * @returns CSS variable reference string (e.g., 'var(--recursica-brand-light-palettes-core-black)')
 */
export function getModeVarRef(baseName: string, mode: ThemeMode): string {
  return `var(${getModeVar(baseName, mode)})`
}

/**
 * Hook to get mode-aware CSS variable reference
 * @param baseName - Base variable name without mode prefix
 * @returns CSS variable reference string for current mode
 */
export function useModeVar(baseName: string): string {
  const { mode } = useThemeMode()
  return getModeVarRef(baseName, mode)
}

