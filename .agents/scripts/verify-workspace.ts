/**
 * Workspace Integrity Linter / Verifier Script
 * Used by agents to verify changes made to JSON files, toolbar configurations, CSS variables, and adapters.
 *
 * Usage:
 *   npx tsx .agents/scripts/verify-workspace.ts
 *
 * Exit code: 0 if all validations pass, 1 otherwise.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import {
  validateBrandJson,
  validateTokensJson,
  validateUIKitJson,
  validateReferences,
} from '../../src/core/utils/validateJsonSchemas'
import type { JsonLike } from '../../src/core/resolvers/tokens'

const FILENAME_BRAND = 'recursica_brand.json'
const FILENAME_TOKENS = 'recursica_tokens.json'
const FILENAME_UIKIT = 'recursica_ui-kit.json'

function loadJson(dir: string, filename: string): JsonLike {
  const filePath = path.resolve(dir, filename)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as JsonLike
}

function findFiles(dir: string, ext: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      findFiles(filePath, ext, fileList)
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath)
    }
  }
  return fileList
}

function main(): number {
  const workspaceRoot = path.resolve(process.cwd())
  console.log('====================================================')
  console.log('🕵️‍♂️  Recursica Workspace Verification Linter running...')
  console.log('====================================================\n')

  let hasError = false

  // 1. JSON Schema and Reference Validations
  console.log('📦 Phase 1: Validating Design Token Schemas & DTCG Compliance...')
  try {
    const brandJson = loadJson(workspaceRoot, FILENAME_BRAND)
    const tokensJson = loadJson(workspaceRoot, FILENAME_TOKENS)
    const uikitJson = loadJson(workspaceRoot, FILENAME_UIKIT)

    console.log('  - Schema: recursica_brand.json ...')
    validateBrandJson(brandJson)
    console.log('  - Schema: recursica_tokens.json ...')
    validateTokensJson(tokensJson)
    console.log('  - Schema: recursica_ui-kit.json ...')
    validateUIKitJson(uikitJson)

    console.log('  - References (DTCG Compliance & Integrity) ...')
    validateReferences(brandJson, tokensJson, uikitJson)
    console.log('  ✅ Design Token validation successful!\n')
  } catch (e) {
    console.error('  ❌ Design Token validation failed:')
    console.error(e instanceof Error ? e.message : e)
    console.log()
    hasError = true
  }

  // 2. Toolbar Configurations JSON Syntax
  console.log('🛠️  Phase 2: Validating Component Toolbar JSON files...')
  try {
    const toolbarFiles = findFiles(workspaceRoot, '.toolbar.json')
    if (toolbarFiles.length === 0) {
      console.log('  - No *.toolbar.json files found.')
    } else {
      console.log(`  - Found ${toolbarFiles.length} toolbar configuration file(s).`)
      for (const tFile of toolbarFiles) {
        const relativePath = path.relative(workspaceRoot, tFile)
        try {
          const raw = fs.readFileSync(tFile, 'utf-8')
          JSON.parse(raw)
          console.log(`    ✅ ${relativePath} is valid JSON.`)
        } catch (je) {
          console.error(`    ❌ ${relativePath} contains invalid JSON:`, je instanceof Error ? je.message : je)
          hasError = true
        }
      }
    }
    console.log('  ✅ Toolbar configurations validation completed!\n')
  } catch (e) {
    console.error('  ❌ Toolbar configurations validation failed:')
    console.error(e instanceof Error ? e.message : e)
    console.log()
    hasError = true
  }

  // 3. Adapter Compilation Check
  console.log('⚡ Phase 3: Running TypeScript compiler check on React Adapters...')
  try {
    // Run TypeScript compiler to ensure the files type check correctly.
    // We only check type compiler and do not emit outputs.
    console.log('  - Running `tsc --noEmit`...')
    execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: workspaceRoot })
    console.log('  ✅ TypeScript compilation successful!\n')
  } catch (e) {
    console.error('  ❌ TypeScript compilation failed. Please check compiler output above.\n')
    hasError = true
  }

  if (hasError) {
    console.log('====================================================')
    console.log('❌ Workspace verification FAILED. Correct issues before proceeding.')
    console.log('====================================================')
    return 1
  }

  console.log('====================================================')
  console.log('🎉 SUCCESS: Workspace verification passed successfully!')
  console.log('====================================================')
  return 0
}

process.exit(main())
