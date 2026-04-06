import { useEffect, useState } from 'react';
import { Title, Container, Paper, Text, Group, Box, Badge, Code, Accordion, Table } from '@mantine/core';

interface Diff {
  path: string;
  before: any;
  after: any;
  changed?: boolean;
}

function formatDiffValue(val: any): string {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
}

function renderFormattedDiff(beforeVal: any, afterVal: any) {
    const beforeStr = formatDiffValue(beforeVal);
    const afterStr = formatDiffValue(afterVal);
    
    if (beforeStr === afterStr) {
        return { 
           beforeFormatted: beforeStr, 
           afterFormatted: afterStr 
        };
    }
    
    // Only apply segment-by-segment comparison for token references
    if (beforeStr.startsWith('{') && beforeStr.endsWith('}') && afterStr.startsWith('{') && afterStr.endsWith('}')) {
        const beforeInner = beforeStr.slice(1, -1);
        const afterInner = afterStr.slice(1, -1);
        
        const beforeParts = beforeInner.split('.');
        const afterParts = afterInner.split('.');
        
        const beforeElems: any[] = [];
        const afterElems: any[] = [];
        
        const len = Math.max(beforeParts.length, afterParts.length);
        for (let i = 0; i < len; i++) {
            const b = beforeParts[i];
            const a = afterParts[i];
            
            if (b === a) {
                if (b !== undefined) beforeElems.push(b);
                if (a !== undefined) afterElems.push(a);
            } else {
                if (b !== undefined) beforeElems.push(<strong key={i}>{b}</strong>);
                if (a !== undefined) afterElems.push(<strong key={i}>{a}</strong>);
            }
        }
        
        // Re-join with dots, wrapped in braces
        const intersperseDots = (arr: any[]) => {
            if (arr.length === 0) return [];
            const result: any[] = [arr[0]];
            for (let i = 1; i < arr.length; i++) {
                result.push('.', arr[i]);
            }
            return result;
        };
        
        return {
           beforeFormatted: <>{'{'}{intersperseDots(beforeElems)}{'}'}</>,
           afterFormatted: <>{'{'}{intersperseDots(afterElems)}{'}'}</>
        };
    }
    
    // For non-token references (colors, numbers), fallback to bolding the differing string directly
    return {
       beforeFormatted: beforeStr,
       afterFormatted: <strong>{afterStr}</strong>
    };
}

export function RandomizerResults() {
  const [diffs, setDiffs] = useState<Diff[]>([]);
  const [ratios, setRatios] = useState<Record<string, { total: number, changed: number }>>({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('randomizer_diffs');
      if (stored) {
        setDiffs(JSON.parse(stored));
      }
      const storedRatios = sessionStorage.getItem('randomizer_ratios');
      if (storedRatios) {
        setRatios(JSON.parse(storedRatios));
      }
    } catch (e) {
      console.error('Failed to parse randomizer diffs', e);
    }
  }, []);

  // Group diffs by top level category: theme vs uikit
  const themeDiffs = diffs.filter(d => d.path.startsWith('theme.'));
  const uikitDiffs = diffs.filter(d => d.path.startsWith('uikit.'));

  // Group uikit diffs by component
  const componentsMap: Record<string, Diff[]> = {};
  uikitDiffs.forEach(d => {
      // Path format: uikit.components.button.properties...
      const parts = d.path.split('.');
      if (parts.length > 2 && parts[0] === 'uikit' && parts[1] === 'components') {
          const compName = parts[2];
          if (!componentsMap[compName]) componentsMap[compName] = [];
          componentsMap[compName].push(d);
      }
  });
  
  // Sort diffs alphabetally by path key
  Object.keys(componentsMap).forEach(key => {
      componentsMap[key].sort((a, b) => a.path.localeCompare(b.path));
  });
  themeDiffs.sort((a, b) => a.path.localeCompare(b.path));

  const formatPath = (path: string) => {
    let clean = path;
    if (clean.endsWith('.$value')) clean = clean.slice(0, -7);
    const parts = clean.split('.');
    return parts.slice(3).join('.') || clean; // removes uikit.components.button
  };

  const renderDiffLine = (diff: Diff) => {
      // If diff.changed explicitly set to false, or before stringifies exactly to after
      const isUnchanged = diff.changed === false || JSON.stringify(diff.before) === JSON.stringify(diff.after);
      
      const { beforeFormatted, afterFormatted } = renderFormattedDiff(diff.before, diff.after);
      
      return (
      <Table.Tr key={diff.path}>
          <Table.Td>
              <Text size="sm" fw={600}>{formatPath(diff.path)}</Text>
          </Table.Td>
          <Table.Td>
              <Code>{beforeFormatted}</Code>
          </Table.Td>
          <Table.Td>
              {!isUnchanged ? (
                <Code>{afterFormatted}</Code>
              ) : (
                <Badge color="yellow" variant="light">Unchanged</Badge>
              )}
          </Table.Td>
      </Table.Tr>
      );
  };

  return (
    <Container fluid py="xl">
      <Title order={2} mb="lg">Randomizer Results</Title>
      
      {diffs.length === 0 ? (
        <Text c="dimmed">No changes detected or session expired.</Text>
      ) : (
        <Paper shadow="sm" p="md" withBorder>
          <Text fw={700} mb="md">Total Changed Properties: {diffs.length}</Text>
          <Accordion variant="separated">
            {themeDiffs.length > 0 && (
                <Accordion.Item value="theme">
                    <Accordion.Control>Theme ({themeDiffs.length} changes)</Accordion.Control>
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
                            {themeDiffs.map(d => (
                                <Table.Tr key={d.path}>
                                    <Table.Td>
                                        <Text size="sm" fw={600}>{d.path.replace('theme.', '').replace(/\.\$value$/, '')}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Code>{renderFormattedDiff(d.before, d.after).beforeFormatted}</Code>
                                    </Table.Td>
                                    <Table.Td>
                                        <Code>{renderFormattedDiff(d.before, d.after).afterFormatted}</Code>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                    </Accordion.Panel>
                </Accordion.Item>
            )}

            {Object.keys(componentsMap).map(compName => (
                <Accordion.Item value={compName} key={compName}>
                    <Accordion.Control>
                        <Group>
                            <Text>{compName.charAt(0).toUpperCase() + compName.slice(1)}</Text>
                            <Badge color={ratios[compName] && ratios[compName].changed === ratios[compName].total ? "green" : "orange"}>
                                {ratios[compName] ? `${ratios[compName].changed} / ${ratios[compName].total}` : componentsMap[compName].filter(d => d.changed !== false).length} randomized
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
                            {componentsMap[compName].map(renderDiffLine)}
                          </Table.Tbody>
                        </Table>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}
    </Container>
  );
}
