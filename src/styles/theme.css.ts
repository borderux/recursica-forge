import { createGlobalTheme, createThemeContract, globalStyle } from '@vanilla-extract/css'

export const vars = createThemeContract({
  color: {
    background: null,
    foreground: null,
    accent: null,
  },
  space: {
    sm: null,
    md: null,
    lg: null,
  },
})

export const theme = createGlobalTheme(':root', vars, {
  color: {
    background: '#ffffff',
    foreground: '#111827',
    accent: '#3b82f6',
  },
  space: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
})

globalStyle('body', {
  background: vars.color.background,
  color: vars.color.foreground,
})
