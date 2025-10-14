import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UiKit } from '../../uikit/UiKitContext'

export default function CarbonShell({ children, kit, onKitChange }: { children: ReactNode; kit: UiKit; onKitChange: (k: UiKit) => void }) {
  const [carbon, setCarbon] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      import('@carbon/react'),
      import('@carbon/styles/css/styles.css'),
    ]).then(([c]) => {
      if (mounted) setCarbon(c)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!carbon) return <div style={{ padding: 16 }}>Loading Carbon…</div>

  const { Header, HeaderName, HeaderGlobalBar, Select, SelectItem, Theme, Grid, Column } = carbon

  return (
    <Theme theme="g10">
      <Header aria-label="recursica-forge">
        <HeaderName prefix="">
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>recursica-forge</Link>
        </HeaderName>
        <HeaderGlobalBar>
          <a href="/" style={{ color: 'inherit', textDecoration: 'none', marginRight: 8 }}>Home</a>
          <a href="/theme" style={{ color: 'inherit', textDecoration: 'none', marginRight: 8 }}>Theme</a>
          <div style={{ minWidth: 180 }}>
            <Select id="kit-select" labelText=" " hideLabel value={kit} onChange={(e: any) => onKitChange((e.target.value as UiKit) ?? 'mantine')}>
              <SelectItem text="Mantine" value="mantine" />
              <SelectItem text="Material UI" value="material" />
              <SelectItem text="Carbon" value="carbon" />
            </Select>
          </div>
        </HeaderGlobalBar>
      </Header>
      <Grid condensed style={{ padding: 16 }}>
        <Column lg={16} md={8} sm={4}>
          {children}
        </Column>
      </Grid>
    </Theme>
  )
}


