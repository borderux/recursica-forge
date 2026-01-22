/**
 * Bug Report Utility
 * 
 * Captures screenshot and console logs, then opens GitHub issue creation page
 * with pre-filled data.
 */

import html2canvas from 'html2canvas'

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
 * Capture screenshot using html2canvas
 * Captures the entire page
 */
async function captureScreenshot(): Promise<string | null> {
  try {
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      logging: false,
      scale: 1,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    })
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Failed to capture screenshot:', error)
    return null
  }
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
    const time = new Date(log.timestamp).toISOString()
    const level = log.level.toUpperCase()
    lines.push(`**${level}** [${time}]`)
    lines.push('```')
    lines.push(log.message)
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
export async function createBugReport() {
  // Start intercepting console if not already
  interceptConsole()

  // Capture screenshot
  const screenshot = await captureScreenshot()

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
  const bodyLines = [
    '## Bug Report',
    '',
    '### Environment',
    '```json',
    JSON.stringify(envInfo, null, 2),
    '```',
    '',
    '### Description',
    '<!-- Please describe the bug you encountered -->',
    '',
    '### Steps to Reproduce',
    '1. ',
    '2. ',
    '3. ',
    '',
    formatConsoleLogs(),
    '',
  ]

  // Add screenshot if available
  if (screenshot) {
    bodyLines.push('### Screenshot', '')
    bodyLines.push('', '**✅ Screenshot captured automatically!**', '')
    bodyLines.push('', 'A screenshot has been captured and is available in the browser console.', '')
    bodyLines.push('', '**To attach the screenshot to this issue:**', '')
    bodyLines.push('1. Check your browser console for the screenshot data URL', '')
    bodyLines.push('2. Copy the data URL and paste it into https://base64.guru/converter/decode/image', '')
    bodyLines.push('3. Download the image and drag it into this GitHub issue', '')
    bodyLines.push('', '**Alternative:** Take a manual screenshot using:', '')
    bodyLines.push('- Browser DevTools (F12 → Screenshot)', '')
    bodyLines.push('- OS screenshot tool (Cmd+Shift+4 / Win+Shift+S)', '')
    bodyLines.push('- Browser extension', '')
    
    // Also log the screenshot to console for easy access
    console.log('%c📸 Screenshot captured for bug report', 'color: #2563eb; font-weight: bold; font-size: 14px;')
    console.log('Copy this data URL and convert it to an image:', screenshot.substring(0, 100) + '...')
    console.log('Full screenshot data:', screenshot)
  } else {
    bodyLines.push('### Screenshot', '')
    bodyLines.push('<!-- Screenshot capture failed - please attach manually if possible -->', '')
    bodyLines.push('', '**To capture a screenshot manually:**', '')
    bodyLines.push('1. Use your browser\'s developer tools (F12) and take a screenshot', '')
    bodyLines.push('2. Or use a browser extension like "Awesome Screenshot"', '')
    bodyLines.push('3. Or use your OS screenshot tool (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)', '')
    bodyLines.push('4. Then drag and drop the image into this GitHub issue', '')
  }

  const body = bodyLines.join('\n')
  const title = `Bug Report - ${new Date().toLocaleDateString()}`

  // Open GitHub issue creation page
  const issueUrl = createGitHubIssueUrl(title, body)
  window.open(issueUrl, '_blank')
}
