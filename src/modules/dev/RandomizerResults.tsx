import { useState, useMemo } from 'react'
import { Box, Title, Text, Group, Paper, Accordion, Badge, Table, Code, SegmentedControl } from '@mantine/core'

interface Diff {
  path: string;
  before: any;
  after: any;
  changed?: boolean;
}

// Helper to determine if a diff is effectively unchanged
const isDiffUnchanged = (diff: Diff) => {
    return diff.changed === false || JSON.stringify(diff.before) === JSON.stringify(diff.after);
};

// Helper to count changed items in a group
const getChangedCount = (diffs: Diff[]) => {
    return diffs.filter(d => !isDiffUnchanged(d)).length;
};

// Formatting helper to highlight differences from the first point of divergence
const renderHighlightedValue = (val: any, other: any) => {
    const s = val === null ? 'null' : String(val);
    const o = other === null ? 'null' : String(other);

    // If identical, just return plain
    if (s === o) {
        return <Text span size="xs" inherit>{s === '' ? '""' : s}</Text>;
    }

    // Reference token highlighting: bold from the first difference to the end
    if (s.startsWith('{') && s.endsWith('}') && o.startsWith('{') && o.endsWith('}')) {
        const pathS = s.slice(1, -1);
        const pathO = o.slice(1, -1);
        const partsS = pathS.split('.');
        const partsO = pathO.split('.');

        let firstDiffIdx = -1;
        for (let i = 0; i < Math.max(partsS.length, partsO.length); i++) {
            if (partsS[i] !== partsO[i]) {
                firstDiffIdx = i;
                break;
            }
        }

        if (firstDiffIdx !== -1) {
            const prefix = partsS.slice(0, firstDiffIdx).join('.');
            const diff = partsS.slice(firstDiffIdx).join('.');
            return (
                <Text span size="xs" inherit>
                    {'{'}{prefix}{prefix ? '.' : ''}<Text span fw={700} inherit>{diff}</Text>{'}'}
                </Text>
            );
        }
    }

    // For non-references, bold the whole thing if changed
    return <Text span size="xs" fw={700} inherit>{s === '' ? '""' : s}</Text>;
};

export function RandomizerResults() {
  const [filterMode, setFilterMode] = useState<string>('all');
  
  const allDiffs: Diff[] = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('randomizer_diffs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const filteredDiffs = useMemo(() => {
    if (filterMode === 'all') return allDiffs;
    if (filterMode === 'light') return allDiffs.filter(d => !d.path.includes('.themes.dark.'));
    if (filterMode === 'dark') return allDiffs.filter(d => !d.path.includes('.themes.light.'));
    return allDiffs;
  }, [allDiffs, filterMode]);

  const tokenDiffs = filteredDiffs.filter(d => d.path.startsWith('tokens.'));
  const themeDiffs = filteredDiffs.filter(d => d.path.startsWith('theme.'));
  const uikitDiffs = filteredDiffs.filter(d => d.path.startsWith('uikit.'));

  // Group tokens by category
  const tokenGroupsMap: Record<string, Diff[]> = {};
  tokenDiffs.forEach(d => {
      const cleanPath = d.path.replace('tokens.', '').replace(/\.\$value$/, '');
      const parts = cleanPath.split('.');
      let groupName = parts[0]; 
      if (groupName === 'font' && parts.length > 1) {
          groupName = `font-${parts[1]}`;
      }
      if (!tokenGroupsMap[groupName]) tokenGroupsMap[groupName] = [];
      tokenGroupsMap[groupName].push(d);
  });

  // Group uikit diffs by component
  const componentsMap: Record<string, Diff[]> = {};
  uikitDiffs.forEach(d => {
      const parts = d.path.split('.');
      if (parts.length > 2 && parts[0] === 'uikit' && parts[1] === 'components') {
          const compName = parts[2];
          if (!componentsMap[compName]) componentsMap[compName] = [];
          componentsMap[compName].push(d);
      }
  });

  // Group theme diffs dynamically by section
  const themeGroupsMap: Record<string, Diff[]> = {
    'Core Properties': [],
    'Type': [],
    'Palettes': [],
    'Elevations': [],
    'Layers': [],
    'Dimensions': [],
    'Other': []
  };

  themeDiffs.forEach(d => {
      const p = d.path;
      if (p.includes('.dimensions.')) {
          themeGroupsMap['Dimensions'].push(d);
      } else if (p.includes('.typography.')) {
          themeGroupsMap['Type'].push(d);
      } else if (p.includes('.palettes.core') || p.includes('.core-colors.') || p.includes('.elements.interactive.') || p.includes('.text-emphasis.') || p.includes('.states.')) {
          themeGroupsMap['Core Properties'].push(d);
      } else if (p.includes('.palettes.')) {
          themeGroupsMap['Palettes'].push(d);
      } else if (p.includes('.elevations.')) {
          themeGroupsMap['Elevations'].push(d);
      } else if (p.includes('.layers.')) {
          if (p.includes('layer-0') && (p.includes('.elements.') || p.includes('.properties.surface') || p.includes('.properties.border-color'))) {
              themeGroupsMap['Core Properties'].push(d);
          } else {
              themeGroupsMap['Layers'].push(d);
          }
      } else {
          themeGroupsMap['Other'].push(d);
      }
  });
  
  // Sort diffs alphabetally
  [tokenGroupsMap, componentsMap, themeGroupsMap].forEach(map => {
      Object.keys(map).forEach(key => map[key].sort((a, b) => a.path.localeCompare(b.path)));
  });

  const formatPath = (path: string) => {
    let clean = path.replace(/\.\$value$/, '');
    if (clean.startsWith('theme.brand.themes.')) {
        const parts = clean.split('.');
        // parts[3] is light/dark
        if (filterMode === 'all') {
            return parts.slice(3).join('.'); // light.palettes...
        } else {
            return parts.slice(4).join('.'); // palettes...
        }
    }
    if (clean.startsWith('tokens.')) return clean.replace('tokens.', '');
    if (clean.startsWith('uikit.components.')) return clean.replace('uikit.components.', '');
    return clean;
  };

  const renderDiffLine = (diff: Diff) => {
      const isUnchanged = isDiffUnchanged(diff);
      const beforeFormatted = renderHighlightedValue(diff.before, diff.after);
      const afterFormatted = renderHighlightedValue(diff.after, diff.before);
      
      return (
        <Table.Tr key={diff.path}>
            <Table.Td>
                <Text size="sm">{formatPath(diff.path)}</Text>
            </Table.Td>
            <Table.Td>
                {beforeFormatted}
            </Table.Td>
            <Table.Td>
                {!isUnchanged ? (
                   afterFormatted
                ) : (
                  <Badge color="yellow" variant="light">Unchanged</Badge>
                )}
            </Table.Td>
        </Table.Tr>
      );
  };

  const totalChanged = filteredDiffs.filter(d => !isDiffUnchanged(d)).length;

  return (
    <Box p="xl" w="100%">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Randomizer Results</Title>
        <SegmentedControl
          value={filterMode}
          onChange={setFilterMode}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Group>
      
      {filteredDiffs.length === 0 ? (
        <Text c="dimmed">No changes detected or session expired.</Text>
      ) : (
        <Paper shadow="sm" p="md" withBorder>
          <Text fw={700} mb="md">Total Changed Properties: {totalChanged} / {filteredDiffs.length}</Text>
          <Accordion variant="separated">
            {Object.keys(tokenGroupsMap).map(groupName => (
                <Accordion.Item value={`tokens-${groupName}`} key={`tokens-${groupName}`}>
                    <Accordion.Control>
                        <Group>
                            <Text>Tokens: {groupName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                            <Badge color={getChangedCount(tokenGroupsMap[groupName]) === tokenGroupsMap[groupName].length ? "green" : "orange"}>
                                {getChangedCount(tokenGroupsMap[groupName])} / {tokenGroupsMap[groupName].length} randomized
                            </Badge>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Table striped highlightOnHover withTableBorder withColumnBorders>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: '40%' }}>Key</Table.Th>
                              <Table.Th style={{ width: '30%' }}>Before</Table.Th>
                              <Table.Th style={{ width: '30%' }}>After</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {tokenGroupsMap[groupName].map(d => {
                                return renderDiffLine(d);
                            })}
                          </Table.Tbody>
                        </Table>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}

            {Object.keys(themeGroupsMap).filter(k => themeGroupsMap[k].length > 0).map(groupName => (
                <Accordion.Item value={`theme-${groupName}`} key={`theme-${groupName}`}>
                    <Accordion.Control>
                        <Group>
                            <Text>Theme: {groupName}</Text>
                            <Badge color={getChangedCount(themeGroupsMap[groupName]) === themeGroupsMap[groupName].length ? "green" : "orange"}>
                                {getChangedCount(themeGroupsMap[groupName])} / {themeGroupsMap[groupName].length} randomized
                            </Badge>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Table striped highlightOnHover withTableBorder withColumnBorders>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: '40%' }}>Key</Table.Th>
                              <Table.Th style={{ width: '30%' }}>Before</Table.Th>
                              <Table.Th style={{ width: '30%' }}>After</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {themeGroupsMap[groupName].map(d => {
                                return renderDiffLine(d);
                            })}
                          </Table.Tbody>
                        </Table>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}

            {Object.keys(componentsMap).map(compName => (
              <Accordion.Item value={compName} key={compName}>
                <Accordion.Control>
                  <Group>
                    <Text>Component: {compName.charAt(0).toUpperCase() + compName.slice(1)}</Text>
                    <Badge color={getChangedCount(componentsMap[compName]) === componentsMap[compName].length ? "green" : "orange"}>
                        {getChangedCount(componentsMap[compName])} / {componentsMap[compName].length} randomized
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: '40%' }}>Key</Table.Th>
                        <Table.Th style={{ width: '30%' }}>Before</Table.Th>
                        <Table.Th style={{ width: '30%' }}>After</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                    {componentsMap[compName].map(d => {
                          return renderDiffLine(d);
                      })}
                    </Table.Tbody>
                  </Table>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}
    </Box>
  )
}
