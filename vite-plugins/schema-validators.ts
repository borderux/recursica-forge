/**
 * Vite plugin that replaces src/core/utils/schemaValidators.ts with validator code precompiled
 * from schemas/*.schema.json.
 *
 * Ajv normally compiles schemas in the browser with `new Function`, which a Content-Security-Policy
 * without 'unsafe-eval' blocks. Generating the code here keeps the policy strict, and because it
 * runs on every build and test run the validators always match the schema files. Node scripts
 * that import the module directly still get the runtime-compiled version.
 */

import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { join } from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import standaloneCode from 'ajv/dist/standalone'

const MODULE_SUFFIX = '/src/core/utils/schemaValidators.ts'
const SCHEMAS = { validateBrand: 'brand', validateTokens: 'tokens', validateUikit: 'uikit' } as const

export function schemaValidators(): Plugin {
  return {
    name: 'schema-validators',
    enforce: 'pre',
    load(id) {
      if (!id.split('?')[0].replace(/\\/g, '/').endsWith(MODULE_SUFFIX)) return null
      // Same options as the runtime Ajv instance in schemaValidators.ts.
      const ajv = new Ajv({ allErrors: true, strict: false, code: { source: true, esm: true } })
      addFormats(ajv)
      for (const name of Object.values(SCHEMAS)) {
        const file = join(process.cwd(), 'schemas', `${name}.schema.json`)
        this.addWatchFile(file)
        ajv.addSchema(JSON.parse(readFileSync(file, 'utf-8')), name)
      }
      // Ajv's ESM output still pulls format checkers in with require(); swap that for an import.
      const code = standaloneCode(ajv, SCHEMAS).replace(
        /require\("ajv-formats\/dist\/formats"\)\.fullFormats/g,
        '__ajvFullFormats',
      )
      if (/\brequire\(/.test(code)) {
        throw new Error('schema-validators: generated code has an unhandled require()')
      }
      return `import { fullFormats as __ajvFullFormats } from 'ajv-formats/dist/formats.js'\n${code}`
    },
  }
}
