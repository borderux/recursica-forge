/**
 * Table Preview Component
 * 
 * High-fidelity, interactive component preview for Table.
 * Features search/filtering, column sorting, 30+ rows of goblin-themed data, and a summary footer.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { Table } from '../../components/adapters/Table'
import { TableCell } from '../../components/adapters/TableCell'
import { TableHeader } from '../../components/adapters/TableHeader'
import { TableFooter } from '../../components/adapters/TableFooter'
import { TextField } from '../../components/adapters/TextField'
import { Badge } from '../../components/adapters/Badge'
import { Avatar } from '../../components/adapters/Avatar'
import { CheckboxItem } from '../../components/adapters/CheckboxItem'
import { iconNameToReactComponent } from './iconUtils'
import { useThemeMode } from '../theme/ThemeModeContext'
import { getComponentLevelCssVar, buildComponentCssVarPath } from '../../components/utils/cssVarNames'

interface TablePreviewProps {
  selectedVariants: Record<string, string>
  selectedLayer: string
  componentElevation?: string
  singleRowMode?: boolean
  hideSearch?: boolean
}

interface GoblinRow {
  id: string
  mission: string
  category: string
  status: 'Not Started' | 'In Progress' | 'Stable' | 'Deprecated'
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  loot: number // in GP (gold pieces)
  assignee: {
    initials: string
    name: string
    color: string
  }
  dueDate: string
}

// 30+ rows of goblin-themed data
const INITIAL_DATA: GoblinRow[] = [
  { id: '1', mission: 'Steal obsidian dagger from Dwarf Forge', category: 'Infiltration', status: 'In Progress', priority: 'Critical', loot: 1200, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '06/25/2026 1:00 PM' },
  { id: '2', mission: 'Awaken the sleeping cavern wyrm', category: 'Combat', status: 'Not Started', priority: 'Critical', loot: 3500, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '06/26/2026 3:00 PM' },
  { id: '3', mission: 'Map the bioluminescent paths in Thornroot Maze', category: 'Scouting', status: 'Stable', priority: 'High', loot: 800, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '06/28/2026 10:00 AM' },
  { id: '4', mission: 'Bribe the lazy dwarf sentry with mud-ale', category: 'Diplomacy', status: 'Stable', priority: 'Medium', loot: 450, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '06/24/2026 5:00 PM' },
  { id: '5', mission: 'Loot the Emerald Vault of Ereth', category: 'Infiltration', status: 'In Progress', priority: 'Critical', loot: 5000, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '06/27/2026 2:00 PM' },
  { id: '6', mission: 'Gather fire-blossom petals from lava tubes', category: 'Alchemy', status: 'Not Started', priority: 'Low', loot: 250, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '06/29/2026 9:00 AM' },
  { id: '7', mission: 'Forge obsidian boots for the goblin king', category: 'Forge', status: 'Stable', priority: 'High', loot: 1500, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '06/30/2026 12:00 PM' },
  { id: '8', mission: 'Recruit shadow-bats for cave patrol', category: 'Scouting', status: 'Deprecated', priority: 'Low', loot: 150, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '07/01/2026 4:00 PM' },
  { id: '9', mission: 'Infiltrate gnome balloon depot', category: 'Infiltration', status: 'In Progress', priority: 'High', loot: 2200, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '07/02/2026 11:30 AM' },
  { id: '10', mission: 'Decipher ancient dwarf runestone', category: 'Alchemy', status: 'Stable', priority: 'Medium', loot: 950, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '07/03/2026 3:00 PM' },
  { id: '11', mission: 'Steal shiny golden gears from clocktower', category: 'Infiltration', status: 'Not Started', priority: 'High', loot: 1800, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '07/04/2026 10:00 AM' },
  { id: '12', mission: 'Sabotage dwarf steam pipes', category: 'Combat', status: 'In Progress', priority: 'Critical', loot: 2800, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '07/05/2026 6:00 PM' },
  { id: '13', mission: 'Brew high-explosive soot potions', category: 'Alchemy', status: 'Stable', priority: 'High', loot: 1100, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '07/06/2026 8:00 AM' },
  { id: '14', mission: 'Map secondary tunnels under North Keep', category: 'Scouting', status: 'Stable', priority: 'Low', loot: 300, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '07/07/2026 1:00 PM' },
  { id: '15', mission: 'Negotiate trade route with troll tribe', category: 'Diplomacy', status: 'Not Started', priority: 'Medium', loot: 850, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '07/08/2026 11:00 AM' },
  { id: '16', mission: 'Recover lost map from old river boot', category: 'Scouting', status: 'Stable', priority: 'Low', loot: 200, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '06/24/2026 9:00 AM' },
  { id: '17', mission: 'Steal royal crown jewels from sleeping king', category: 'Infiltration', status: 'Not Started', priority: 'Critical', loot: 6000, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '07/10/2026 2:00 AM' },
  { id: '18', mission: 'Mine runic crystal vein in deep cavern', category: 'Forge', status: 'In Progress', priority: 'High', loot: 2000, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '07/11/2026 4:00 PM' },
  { id: '19', mission: 'Ambush treasure wagon at South Gorge', category: 'Combat', status: 'Not Started', priority: 'Critical', loot: 4000, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '07/12/2026 8:00 PM' },
  { id: '20', mission: 'Bribe goblin guards to look other way', category: 'Diplomacy', status: 'Stable', priority: 'Low', loot: 100, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '06/24/2026 10:00 PM' },
  { id: '21', mission: 'Purloin rare glowing moss cultures', category: 'Alchemy', status: 'Deprecated', priority: 'Medium', loot: 600, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '07/14/2026 12:00 PM' },
  { id: '22', mission: 'Scout dwarf fortress wall weakness', category: 'Scouting', status: 'In Progress', priority: 'High', loot: 1300, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '07/15/2026 3:00 PM' },
  { id: '23', mission: 'Forge prototype rocket-propelled spear', category: 'Forge', status: 'Not Started', priority: 'High', loot: 1700, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '07/16/2026 10:00 AM' },
  { id: '24', mission: 'Infiltrate dwarf banquet to swap wine', category: 'Infiltration', status: 'Stable', priority: 'Medium', loot: 900, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '07/17/2026 7:00 PM' },
  { id: '25', mission: 'Befriend cave bat matriarch', category: 'Diplomacy', status: 'In Progress', priority: 'Low', loot: 350, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '07/18/2026 1:00 PM' },
  { id: '26', mission: 'Steal blueprint for dwarf clockwork tank', category: 'Infiltration', status: 'Not Started', priority: 'Critical', loot: 4500, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '07/19/2026 11:00 AM' },
  { id: '27', mission: 'Re-align cavern defense mirrors', category: 'Scouting', status: 'Stable', priority: 'Medium', loot: 750, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '07/20/2026 2:00 PM' },
  { id: '28', mission: 'Extract toxic cave spider venom', category: 'Alchemy', status: 'In Progress', priority: 'High', loot: 1400, assignee: { initials: 'FS', name: 'Fizz Sparkweaver', color: '#74b9ff' }, dueDate: '07/21/2026 9:00 AM' },
  { id: '29', mission: 'Defend lower gate from dwarf tunnelers', category: 'Combat', status: 'Not Started', priority: 'Critical', loot: 3800, assignee: { initials: 'SM', name: 'Snarl Moonbiter', color: '#55efc4' }, dueDate: '07/22/2026 6:00 AM' },
  { id: '30', mission: 'Calibrate focus lenses of main forge', category: 'Forge', status: 'Stable', priority: 'Medium', loot: 1000, assignee: { initials: 'GB', name: 'Gribble Bootloot', color: '#ffeaa7' }, dueDate: '07/23/2026 5:00 PM' },
  { id: '31', mission: 'Steal golden key from sleeping dwarf general', category: 'Infiltration', status: 'In Progress', priority: 'Critical', loot: 3200, assignee: { initials: 'ZO', name: 'Zog Onyx', color: '#e056fd' }, dueDate: '07/24/2026 3:00 AM' },
  { id: '32', mission: 'Scout abandoned deep mine level 4', category: 'Scouting', status: 'Deprecated', priority: 'Low', loot: 180, assignee: { initials: 'GA', name: 'Grom Anklesplitter', color: '#ff7675' }, dueDate: '07/25/2026 12:00 PM' }
]

type SortField = 'mission' | 'category' | 'status' | 'priority' | 'loot' | 'dueDate'

export default function TablePreview({
  selectedLayer,
  singleRowMode = false,
  hideSearch = false,
}: TablePreviewProps) {
  const { mode } = useThemeMode()
  const [filterText, setFilterText] = useState('')
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortAsc, setSortAsc] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set())

  // Listen for CSS variable updates to force re-render
  useEffect(() => {
    const handler = () => setUpdateKey((k) => k + 1)
    window.addEventListener('cssVarsUpdated', handler as any)

    const observer = new MutationObserver(() => {
      setUpdateKey((k) => k + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('cssVarsUpdated', handler as any)
      observer.disconnect()
    }
  }, [])

  // Header and cell typography styles derived from CSS variables
  const headerTextStyle: React.CSSProperties = useMemo(() => ({
    color: mode === 'dark' ? '#f5f6fa' : '#2f3640',
    textAlign: 'left',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  }), [mode, updateKey])

  const cellTextStyle: React.CSSProperties = useMemo(() => ({
    color: mode === 'dark' ? '#dcdde1' : '#3f3f3f',
    padding: '12px 16px',
    verticalAlign: 'middle',
  }), [mode, updateKey])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Filter and sort operations
  const processedData = useMemo(() => {
    if (singleRowMode) {
      return [INITIAL_DATA[0]]
    }

    let result = [...INITIAL_DATA]

    if (filterText) {
      const lower = filterText.toLowerCase()
      result = result.filter(
        row =>
          row.mission.toLowerCase().includes(lower) ||
          row.category.toLowerCase().includes(lower) ||
          row.status.toLowerCase().includes(lower) ||
          row.priority.toLowerCase().includes(lower) ||
          row.loot.toString().includes(lower) ||
          row.assignee.name.toLowerCase().includes(lower)
      )
    }

    const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 }

    result.sort((a, b) => {
      let valA: any = a[sortField]
      let valB: any = b[sortField]

      if (sortField === 'priority') {
        valA = priorityWeight[a.priority]
        valB = priorityWeight[b.priority]
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

    return result
  }, [filterText, sortField, sortAsc, singleRowMode])

  // Get sort chevron icons
  const ChevronUp = iconNameToReactComponent('chevron-up')
  const ChevronDown = iconNameToReactComponent('chevron-down')
  const MagnifyingGlass = iconNameToReactComponent('magnifying-glass')

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortAsc ? (
      ChevronUp ? <ChevronUp style={{ marginLeft: 6, display: 'inline', width: 14, height: 14 }} /> : ' ▲'
    ) : (
      ChevronDown ? <ChevronDown style={{ marginLeft: 6, display: 'inline', width: 14, height: 14 }} /> : ' ▼'
    )
  }

  // Get status color tokens
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stable':
        return { dot: '#4cd137', bg: 'rgba(76, 209, 55, 0.1)', text: mode === 'dark' ? '#4cd137' : '#2f8e1b' }
      case 'In Progress':
        return { dot: '#00a8ff', bg: 'rgba(0, 168, 255, 0.1)', text: mode === 'dark' ? '#00a8ff' : '#0070ab' }
      case 'Not Started':
        return { dot: '#9c88ff', bg: 'rgba(156, 136, 255, 0.1)', text: mode === 'dark' ? '#a290ff' : '#6653c7' }
      case 'Deprecated':
      default:
        return { dot: '#e84118', bg: 'rgba(232, 65, 24, 0.1)', text: mode === 'dark' ? '#e84118' : '#ab290b' }
    }
  }

  // Get priority style
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return { color: '#e84118', weight: 'bold', indicatorColor: '#e84118' }
      case 'High':
        return { color: '#e67e22', weight: '600', indicatorColor: '#e67e22' }
      case 'Medium':
        return { color: '#f1c40f', weight: '500', indicatorColor: '#f1c40f' }
      case 'Low':
      default:
        return { color: '#7f8c8d', weight: '400', indicatorColor: '#bdc3c7' }
    }
  }

  // Get assignee avatar source based on name
  const getAssigneeAvatarSrc = (name: string) => {
    if (name.includes('Zog')) return '/goblin-avatar-smith.png'
    if (name.includes('Grom')) return '/goblin-avatar-scout.png'
    if (name.includes('Fizz')) return '/goblin-avatar-shaman.png'
    if (name.includes('Snarl')) return '/goblin-avatar-elder.png'
    if (name.includes('Gribble')) return '/goblin-avatar-smith.png'
    return undefined
  }

  const toggleAllRows = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(processedData.map(r => r.id)))
    } else {
      setSelectedRowIds(new Set())
    }
  }

  const toggleRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedRowIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedRowIds(newSet)
  }

  const allSelected = processedData.length > 0 && selectedRowIds.size === processedData.length
  const someSelected = selectedRowIds.size > 0 && selectedRowIds.size < processedData.length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: singleRowMode ? 'auto' : '100%',
      alignSelf: 'stretch',
      gap: 16,
    }}>


      {/* Table Wrapper (Full Height or Auto depending on singleRowMode) */}
      <div style={{
        flex: singleRowMode ? 'none' : 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <Table
          layer={selectedLayer as any}
          mantine={{
            striped: true,
            highlightOnHover: true,
            withTableBorder: true,
            withColumnBorders: true,
            verticalSpacing: 'sm',
            horizontalSpacing: 'md',
            stickyHeader: true,
          }}
          style={{ width: '100%', height: singleRowMode ? 'auto' : '100%' }}
        >
          <thead>
            <tr style={{
              background: mode === 'dark' ? '#1e272e' : '#f5f6fa',
            }}>
              <TableHeader style={{ ...headerTextStyle, width: 48 }} layer={selectedLayer as any}>
                <CheckboxItem
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAllRows}
                  layer={selectedLayer as any}
                  label=""
                />
              </TableHeader>
              <TableHeader
                style={headerTextStyle}
                layer={selectedLayer as any}
                sorted={sortField === 'mission' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('mission')}
              >
                Task Title
              </TableHeader>
              <TableHeader
                style={headerTextStyle}
                layer={selectedLayer as any}
                sorted={sortField === 'category' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('category')}
              >
                Task Type
              </TableHeader>
              {/* Show disabled headers in single-row mode to preview disabled header styles */}
              <TableHeader
                style={headerTextStyle}
                layer={selectedLayer as any}
                disabled={singleRowMode}
                sorted={sortField === 'status' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('status')}
              >
                Status
              </TableHeader>
              <TableHeader
                style={headerTextStyle}
                layer={selectedLayer as any}
                disabled={singleRowMode}
                sorted={sortField === 'priority' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('priority')}
              >
                Priority
              </TableHeader>
              <TableHeader
                style={{ ...headerTextStyle, textAlign: 'right' }}
                layer={selectedLayer as any}
                sorted={sortField === 'loot' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('loot')}
              >
                Loot
              </TableHeader>
              <TableHeader
                style={headerTextStyle}
                layer={selectedLayer as any}
                disabled={singleRowMode}
                sorted={sortField === 'dueDate' ? (sortAsc ? 'asc' : 'desc') : null}
                onClick={() => handleSort('dueDate')}
              >
                Due Date
              </TableHeader>
              <TableHeader style={headerTextStyle} layer={selectedLayer as any}>
                Responsible Party
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {processedData.length > 0 ? (
              processedData.map((row) => {
                const statusStyles = getStatusColor(row.status)
                const priorityStyles = getPriorityStyle(row.priority)

                return (
                  <tr key={row.id} data-selected={selectedRowIds.has(row.id) ? "true" : undefined} style={{
                    borderBottom: `1px solid var(--recursica_brand_layers_${selectedLayer}_properties_border-color, rgba(120, 120, 120, 0.1))`
                  }}>
                    <TableCell style={{ width: 48 }} layer={selectedLayer as any}>
                      <CheckboxItem
                        checked={selectedRowIds.has(row.id)}
                        onChange={(c) => toggleRow(row.id, c)}
                        layer={selectedLayer as any}
                        label=""
                      />
                    </TableCell>
                    <TableCell
                      layer={selectedLayer as any}
                    >
                      {row.mission}
                    </TableCell>
                    <TableCell layer={selectedLayer as any}>
                      {row.category}
                    </TableCell>
                    {/* Status Pill Indicator - Disabled state representation for Table cell single-row view */}
                    <TableCell
                      disabled={singleRowMode}
                      layer={selectedLayer as any}
                    >
                      <Badge
                        variant={
                          row.status === 'Stable'
                            ? 'success'
                            : row.status === 'In Progress'
                            ? 'warn'
                            : row.status === 'Deprecated'
                            ? 'alert'
                            : 'primary-color'
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        layer={selectedLayer as any}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    {/* Priority Colored text with icons - Disabled state representation */}
                    <TableCell
                      disabled={singleRowMode}
                      layer={selectedLayer as any}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {row.priority === 'Critical' && '⚡ '}
                        {row.priority === 'High' && '🔥 '}
                        {row.priority}
                      </span>
                    </TableCell>
                    {/* Loot Value GP */}
                    <TableCell variant="currency" layer={selectedLayer as any}>
                      <span>
                        {row.loot.toLocaleString()} GP
                      </span>
                    </TableCell>
                    {/* Due Date - Disabled state representation */}
                    <TableCell
                      disabled={singleRowMode}
                      layer={selectedLayer as any}
                    >
                      {row.dueDate}
                    </TableCell>
                    {/* Responsible Party Avatar */}
                    <TableCell layer={selectedLayer as any}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Avatar
                          fallback={row.assignee.initials}
                          colorVariant="image"
                          src={getAssigneeAvatarSrc(row.assignee.name)}
                          layer={selectedLayer as any}
                          sizeVariant="small"
                        />
                        <span>{row.assignee.name}</span>
                      </div>
                    </TableCell>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} style={{
                  ...cellTextStyle,
                  textAlign: 'center',
                  padding: '40px 0',
                  color: mode === 'dark' ? '#8f9cae' : '#7f8c8d'
                }}>
                  No missions match your search query.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <TableFooter style={{ width: 48 }} layer={selectedLayer as any} />
              <TableFooter layer={selectedLayer as any}>
                <span style={{ fontWeight: 'bold' }}>Total Loot:</span>
              </TableFooter>
              <TableFooter layer={selectedLayer as any} />
              <TableFooter layer={selectedLayer as any} />
              <TableFooter layer={selectedLayer as any} />
              <TableFooter variant="currency" style={{ textAlign: 'right' }} layer={selectedLayer as any}>
                <span style={{ fontWeight: 'bold' }}>
                  {useMemo(() => processedData.reduce((sum, r) => sum + r.loot, 0).toLocaleString(), [processedData])} GP
                </span>
              </TableFooter>
              <TableFooter layer={selectedLayer as any} />
              <TableFooter layer={selectedLayer as any} />
            </tr>
          </tfoot>
        </Table>
      </div>
    </div>
  )
}
