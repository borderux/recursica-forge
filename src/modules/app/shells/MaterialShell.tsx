import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const [mat, setMat] = useState<any>(null)
  const [styles, setStyles] = useState<any>(null)

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

  const { AppBar, Toolbar, Typography, Button, Select, MenuItem, Container, CssBaseline } = mat
  const { ThemeProvider, createTheme } = styles
  const theme = createTheme()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>recursica-forge</Link>
          </Typography>
          <Button color="inherit" href="/">Home</Button>
          <Button color="inherit" href="/theme">Theme</Button>
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


