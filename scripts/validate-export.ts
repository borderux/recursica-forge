/**
 * Validates recursica JSON exports in a directory: schema validation and DTCG reference validation.
 *
 * Usage:
 *   npx tsx scripts/validate-export.ts [directory]
 *
 * Default directory is ./export. Expects recursica_brand.json, recursica_tokens.json,
 * recursica_ui-kit.json in that directory.
 *
 * Exit code: 0 if all validations pass, 1 otherwise.
 */

import fs from 'fs'
import path from 'path'
import {
  validateBrandJson,
  validateTokensJson,
  validateUIKitJson,
  validateReferences,
} from '../src/core/utils/validateJsonSchemas'
import type { JsonLike } from '../src/core/resolvers/tokens'

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

function main(): number {
  const dirArg = process.argv[2]
  const dir = dirArg ? path.resolve(process.cwd(), dirArg) : path.resolve(process.cwd(), 'export')

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`Error: Not a directory: ${dir}`)
    return 1
  }

  console.log(`Validating JSON exports in: ${dir}\n`)

  let brandJson: JsonLike
  let tokensJson: JsonLike
  let uikitJson: JsonLike

  try {
    brandJson = loadJson(dir, FILENAME_BRAND)
    tokensJson = loadJson(dir, FILENAME_TOKENS)
    uikitJson = loadJson(dir, FILENAME_UIKIT)
  } catch (e) {
    console.error('Failed to load export files:', e instanceof Error ? e.message : e)
    return 1
  }

  try {
    console.log('  Schema: recursica_brand.json ...')
    validateBrandJson(brandJson)
    console.log('  Schema: recursica_tokens.json ...')
    validateTokensJson(tokensJson)
    console.log('  Schema: recursica_ui-kit.json ...')
    validateUIKitJson(uikitJson)
    console.log('  References (DTCG) ...')
    validateReferences(brandJson, tokensJson, uikitJson)
  } catch (e) {
    console.error('\nValidation failed:', e instanceof Error ? e.message : e)
    return 1
  }

  console.log('\nAll validations passed.')
  return 0
}

process.exit(main())
