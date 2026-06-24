const fs = require('fs');
const file = 'src/core/export/ExportSelectionModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import { Checkbox } from '../../components/adapters/Checkbox'",
  "import { Checkbox } from '../../components/adapters/Checkbox'\nimport { SegmentedControl } from '../../components/adapters/SegmentedControl'\nimport { Dropdown } from '../../components/adapters/Dropdown'\nimport type { DropdownItem } from '../../components/adapters/Dropdown'"
);

// Add devTestFilesMap and toSentenceCase
const helpers = `
const devTestFilesMap = import.meta.env.DEV ? import.meta.glob('../../components/test-exports/*.json') : {};

function toSentenceCase(filename: string) {
  const base = filename.replace(/\\.json$/, '');
  const spaced = base.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function ExportSelectionModal`;
content = content.replace('export function ExportSelectionModal', helpers);

// Add state and mode logic
const stateLogic = `  const [mode, setMode] = useState<"files" | "test-files">("files")
  const [selectedTestFile, setSelectedTestFile] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)

  // Initialize selected test file
  if (import.meta.env.DEV && selectedTestFile === "") {
    const keys = Object.keys(devTestFilesMap).sort()
    if (keys.length > 0 && selectedTestFile === "") {
      setSelectedTestFile(keys[0])
    }
  }

  const handleTestFileDownload = async () => {
    if (!selectedTestFile) return
    setIsDownloading(true)
    try {
      const module = await (devTestFilesMap[selectedTestFile] as () => Promise<any>)()
      const json = module.default || module
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedTestFile.split('/').pop() || 'test.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onCancel()
    } catch (err) {
      console.error("Failed to download test file", err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Check if all JSON files`;
content = content.replace('  // Check if all JSON files', stateLogic);

// Replace modal footer and content
const modalReturn = `
  const isTestMode = mode === 'test-files'
  const isExportToGithubEnabled = onExportToGithub && !isTestMode
  const primaryAction = isExportToGithubEnabled ? handleExportToGithub : (isTestMode ? handleTestFileDownload : handleExport)
  const primaryLabel = isExportToGithubEnabled ? 'Export to GitHub' : 'Download'
  const primaryDisabled = isTestMode ? (!selectedTestFile || isDownloading) : !isAnyFileSelected
  
  const showSecondary = isExportToGithubEnabled
  const secondaryAction = isExportToGithubEnabled ? handleExport : undefined
  const secondaryLabel = isExportToGithubEnabled ? 'Download' : undefined
  const secondaryDisabled = isExportToGithubEnabled ? !isAnyFileSelected : undefined

  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title="Export"
      showFooter={true}
      primaryActionLabel={primaryLabel}
      onPrimaryAction={primaryAction}
      primaryActionDisabled={primaryDisabled}
      showSecondaryButton={showSecondary}
      secondaryActionLabel={secondaryLabel}
      onSecondaryAction={secondaryAction}
      secondaryActionDisabled={secondaryDisabled}
      scrollable={true}
      layer="layer-1"
      size="md"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {import.meta.env.DEV && (
            <SegmentedControl
              items={[
                { value: 'files', label: 'Files' },
                { value: 'test-files', label: 'Test' }
              ]}
              value={mode}
              onChange={(val) => setMode(val as any)}
              fullWidth
              layer="layer-1"
            />
          )}

          {mode === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* JSON Files Group */}`;

content = content.replace(/  return \([\s\S]*\{\/\* JSON Files Group \*\//m, modalReturn);

// Remove the old footer
content = content.replace(/          <div style=\{\{[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\}/m, `          </div>
        </div>
      }`);

fs.writeFileSync(file, content);
console.log('updated ExportSelectionModal');
