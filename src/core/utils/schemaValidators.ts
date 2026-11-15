/**
 * Ajv validators for schemas/*.schema.json.
 *
 * This file is what Node scripts (scripts/validate-export.ts) run. In Vite builds and tests,
 * vite-plugins/schema-validators.ts replaces it with code precompiled from the same schemas, so
 * the browser never compiles a schema with `new Function`, which the Content-Security-Policy blocks.
 */
import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import brandSchema from '../../../schemas/brand.schema.json'
import tokensSchema from '../../../schemas/tokens.schema.json'
import uikitSchema from '../../../schemas/uikit.schema.json'

/** Returns true when valid, otherwise sets `errors`. */
export type SchemaValidator = ((data: unknown) => boolean) & { errors?: ErrorObject[] | null }

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export const validateBrand: SchemaValidator = ajv.compile(brandSchema)
export const validateTokens: SchemaValidator = ajv.compile(tokensSchema)
export const validateUikit: SchemaValidator = ajv.compile(uikitSchema)
