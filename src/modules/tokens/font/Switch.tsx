import React from 'react'
import { useThemeMode } from '../../theme/ThemeModeContext'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled = false }: SwitchProps) {
  const { mode } = useThemeMode()
  const interactiveColor = `--recursica-brand-${mode}-palettes-core-interactive`
  const layer0Base = `--recursica-brand-${mode}-layer-layer-0-property`
  const layer1Base = `--recursica-brand-${mode}-layer-layer-1-property`
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: 'var(--recursica-brand-dimensions-spacer-xl)',
        height: 'var(--recursica-brand-dimensions-spacer-md)',
        borderRadius: 'var(--recursica-brand-dimensions-spacer-md)',
        border: 'none',
        background: checked ? `var(${interactiveColor})` : `var(${layer1Base}-border-color)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        padding: 0,
        outline: 'none',
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: checked ? 'calc(100% - var(--recursica-brand-dimensions-spacer-md) - var(--recursica-brand-dimensions-spacer-xs))' : 'var(--recursica-brand-dimensions-spacer-xs)',
          transform: 'translateY(-50%)',
          width: 'calc(var(--recursica-brand-dimensions-spacer-md) - var(--recursica-brand-dimensions-spacer-xs) * 2)',
          height: 'calc(var(--recursica-brand-dimensions-spacer-md) - var(--recursica-brand-dimensions-spacer-xs) * 2)',
          borderRadius: '50%',
          background: `var(${layer0Base}-surface)`,
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      />
    </button>
  )
}

