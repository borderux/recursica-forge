/**
 * JSON Migration Utility for Imported Files
 * 
 * Upgrades older JSON schemas to the current DTCG structure.
 * This runs before schema validation to ensure old exports can still be imported.
 */

export interface MigrationRule {
  description: string
  // Regex to match string values like references (e.g. "{tokens.opacity.mist}")
  stringReplacement?: {
    pattern: RegExp
    replacement: string | ((substring: string, ...args: any[]) => string)
  }
}

export const MIGRATION_RULES: MigrationRule[] = [
  {
    description: 'Migrate tokens.opacity to tokens.opacities',
    stringReplacement: {
      pattern: /\{tokens\.opacity\./g,
      replacement: '{tokens.opacities.',
    },
  },
  {
    description: 'Migrate tokens.size to tokens.sizes',
    stringReplacement: {
      pattern: /\{tokens\.size\./g,
      replacement: '{tokens.sizes.',
    },
  },
  {
    description: 'Migrate tokens.color to tokens.colors',
    stringReplacement: {
      pattern: /\{tokens\.color\./g,
      replacement: '{tokens.colors.',
    },
  },
  {
    description: 'Migrate underscore separated colors to dot separated (scale-01_100 -> scale-01.100)',
    stringReplacement: {
      pattern: /\{tokens\.colors\.(scale-\d{2})_(\d{2,4})\}/g,
      replacement: '{tokens.colors.$1.$2}',
    },
  },
  {
    description: 'Migrate underscore separated brand colors to dot separated',
    stringReplacement: {
      pattern: /\{brand\.palettes\.(core-colors|neutral|accent|success|warning|alert|info)_(.+?)\}/g,
      replacement: '{brand.palettes.$1.$2}',
    },
  },
  // Catch flat css variables and convert them back to DTCG refs
  {
    description: 'Convert raw CSS variable injections back to DTCG refs',
    stringReplacement: {
      pattern: /^var\(--recursica_tokens_opacity_(.+?)\)$/g,
      replacement: '{tokens.opacities.$1}',
    },
  },
  {
    description: 'Convert raw CSS variable injections back to DTCG refs (sizes)',
    stringReplacement: {
      pattern: /^var\(--recursica_tokens_sizes_(.+?)\)$/g,
      replacement: '{tokens.sizes.$1}',
    },
  }
]

/**
 * Deep clones and migrates a JSON object based on defined rules.
 */
export function migrateImportedJson(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    let result = data
    for (const rule of MIGRATION_RULES) {
      if (rule.stringReplacement) {
        if (typeof rule.stringReplacement.replacement === 'string') {
          result = result.replace(rule.stringReplacement.pattern, rule.stringReplacement.replacement)
        } else {
          result = result.replace(rule.stringReplacement.pattern, rule.stringReplacement.replacement as any)
        }
      }
    }
    return result
  }

  if (Array.isArray(data)) {
    return data.map(item => migrateImportedJson(item))
  }

  if (typeof data === 'object') {
    const migrated: any = {}
    for (const [key, value] of Object.entries(data)) {
      migrated[key] = migrateImportedJson(value)
    }
    return migrated
  }

  return data
}
