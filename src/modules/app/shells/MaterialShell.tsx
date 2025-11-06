/**
 * MaterialShell
 *
 * App frame using Material UI; lazy-loads MUI packages on mount and
 * provides navigation, reset defaults, and download controls.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'
import { clearOverrides } from '../../theme/tokenOverrides'
import tokensJson from '../../../vars/Tokens.json'
import { useVars } from '../../vars/VarsContext'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const { resetAll } = useVars()
  const [mat, setMat] = useState<any>(null)
  const [styles, setStyles] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const onUpload = async (file?: File | null) => {
    if (!file) return
    const text = await file.text()
    const json = JSON.parse(text)
    const vars = extractCssVarsFromObject(json)
    if (Object.keys(vars).length) applyCssVars(vars)
  }

  useEffect(() => {
    let mounted = true
    Promise.all([import('@mui/material'), import('@mui/material/styles')]).then(([m, s]) => {
      if (mounted) {
        setMat(m)
        setStyles(s)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!mat || !styles) return <div style={{ padding: 16 }}>Loading Material UI…</div>

  const { AppBar, Toolbar, Typography, Button, Select, MenuItem, Container, CssBaseline, Tabs, Tab, IconButton } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Recursica Theme Forge</Link>
          </Typography>
          <Tabs value={kit} textColor="inherit" indicatorColor="secondary" sx={{ mx: 'auto' }}>
            <Tab value="tokens" label="Tokens" component={Link as any} to="/tokens" />
            <Tab value="palettes" label="Palettes" component={Link as any} to="/palettes" />
            <Tab value="type" label="Type" component={Link as any} to="/type" />
            <Tab value="layers" label="Layers" component={Link as any} to="/layers" />
            <Tab value="uikit" label="UI Kit" component={Link as any} to="/uikit" />
          </Tabs>
          <IconButton color="inherit" size="small" onClick={() => { clearOverrides(tokensJson as any); resetAll() }} title="Reset to defaults">↺</IconButton>
          <IconButton color="inherit" size="small" onClick={() => {/* open modal not implemented for MUI shell */}} title="Import / Export">⤓</IconButton>
          <Select
            size="small"
            value={kit}
            onChange={(e: any) => onKitChange((e.target.value as UiKit) ?? 'mantine')}
            sx={{ color: 'white', ml: 1, minWidth: 150, '& .MuiSelect-select': { color: 'white' } }}
          >
            <MenuItem value="mantine">Mantine</MenuItem>
            <MenuItem value="material">Material UI</MenuItem>
            <MenuItem value="carbon">Carbon</MenuItem>
          </Select>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {children}
      </Container>
    </ThemeProvider>
  )
}


