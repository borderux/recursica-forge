/**
 * Vite plugin to copy UIKit.json to dist/vars/ during build
 *
 * Enables "Reload UIKit from file" to fetch fresh UIKit in production.
 */

import type { Plugin } from 'vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export function copyUIKit(): Plugin {
  return {
    name: 'copy-uikit',
    writeBundle() {
      const srcPath = join(process.cwd(), 'src', 'vars', 'UIKit.json')
      const distDir = join(process.cwd(), 'dist', 'vars')
      const distPath = join(distDir, 'UIKit.json')

      try {
        if (!existsSync(srcPath)) return
        mkdirSync(distDir, { recursive: true })
        copyFileSync(srcPath, distPath)
        console.log('✓ Copied UIKit.json to dist/vars/ for reload-from-file')
      } catch (error) {
        console.error('Failed to copy UIKit.json:', error)
      }
    },
  }
}
