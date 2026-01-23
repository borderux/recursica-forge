/**
 * Bug Report Utility
 * 
 * Captures console logs and opens GitHub issue creation page with pre-filled data.
 */

interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  timestamp: number
  args: any[]
}

// Store console logs
const consoleLogs: ConsoleLog[] = []
let consoleIntercepted = false

// Start intercepting console logs immediately when module loads
if (typeof window !== 'undefined') {
  interceptConsole()
}

/**
 * Intercept console methods to capture logs
 */
function interceptConsole() {
  if (consoleIntercepted) return
  consoleIntercepted = true

  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const originalInfo = console.info
  const originalDebug = console.debug

  const captureLog = (level: ConsoleLog['level'], originalFn: typeof console.log) => {
    return (...args: any[]) => {
      consoleLogs.push({
        level,
        message: args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2)
            } catch {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' '),
        timestamp: Date.now(),
        args,
      })
      originalFn.apply(console, args)
    }
  }

  console.log = captureLog('log', originalLog)
  console.warn = captureLog('warn', originalWarn)
  console.error = captureLog('error', originalError)
  console.info = captureLog('info', originalInfo)
  console.debug = captureLog('debug', originalDebug)
}

/**
 * Format console logs as markdown
 */
function formatConsoleLogs(): string {
  if (consoleLogs.length === 0) {
    return 'No console logs captured.'
  }

  const recentLogs = consoleLogs.slice(-50) // Last 50 logs
  const lines = ['### Console Logs', '']
  
  for (const log of recentLogs) {
    const level = log.level.toUpperCase()
    lines.push(`**${level}**`)
    lines.push('```')
    // Split message by newlines so each line appears on its own line
    const messageLines = log.message.split('\n')
    for (const line of messageLines) {
      lines.push(line)
    }
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Create GitHub issue URL with pre-filled data
 */
function createGitHubIssueUrl(title: string, body: string): string {
  const baseUrl = 'https://github.com/borderux/recursica-forge/issues/new'
  const params = new URLSearchParams({
    title: title.substring(0, 200), // GitHub title limit
    body: body.substring(0, 60000), // GitHub body limit (approximate)
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Main function to create bug report
 */
export function createBugReport() {
  // Start intercepting console if not already
  interceptConsole()

  // Get environment info
  const envInfo = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    timestamp: new Date().toISOString(),
  }

  // Format issue body
  const body = [
    '## Bug Report',
    '',
    '### Description',
    '<!-- Please describe the bug you encountered -->',
    '',
    '### Steps to Reproduce',
    '1. ',
    '2. ',
    '3. ',
    '',
    '### Screenshots',
    '<!-- Please drag and drop screenshots here to help illustrate the bug -->',
    '',
    '### Environment',
    '```json',
    JSON.stringify(envInfo, null, 2),
    '```',
    '',
    formatConsoleLogs(),
  ].join('\n')

  const title = `Bug Report - ${new Date().toLocaleDateString()}`

  // Open GitHub issue creation page
  const issueUrl = createGitHubIssueUrl(title, body)
  window.open(issueUrl, '_blank')
}
