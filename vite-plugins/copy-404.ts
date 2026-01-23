/**
 * Vite plugin to copy index.html to 404.html during build
 * 
 * This ensures 404.html stays in sync with index.html for GitHub Pages SPA routing.
 */

import type { Plugin } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export function copy404Html(): Plugin {
  return {
    name: 'copy-404-html',
    writeBundle() {
      // After build, copy index.html to 404.html in the dist directory
      const distPath = join(process.cwd(), 'dist')
      const indexPath = join(distPath, 'index.html')
      const notFoundPath = join(distPath, '404.html')
      
      try {
        const indexContent = readFileSync(indexPath, 'utf-8')
        writeFileSync(notFoundPath, indexContent, 'utf-8')
        console.log('✓ Copied index.html to 404.html for GitHub Pages SPA routing')
      } catch (error) {
        console.error('Failed to copy index.html to 404.html:', error)
      }
    },
  }
}
