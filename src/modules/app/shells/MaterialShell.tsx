import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'
import { extractCssVarsFromObject, applyCssVars, downloadCurrentCssVars } from '../../theme/varsUtil'

export default function MaterialShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
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

  const { AppBar, Toolbar, Typography, Button, Select, MenuItem, Container, CssBaseline, Dialog, DialogTitle, DialogContent, DialogActions, Stack } = mat
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
          <Button color="inherit" href="/type">Type</Button>
          <Button color="inherit" onClick={() => setIsDialogOpen(true)}>Import/Export</Button>
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
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Import/Export</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e: any) => {
                onUpload(e.currentTarget.files?.[0])
                e.currentTarget.value = ''
              }}
            />
            <Button onClick={() => downloadCurrentCssVars()}>Download</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {children}
      </Container>
    </ThemeProvider>
  )
}


