/**
 * ESLint Configuration (Flat Config Format)
 *
 * This configuration uses ESLint 9's flat config format, which provides:
 * - Better performance and explicit configuration
 * - Native ESM support (matching our project's "type": "module")
 * - Clear separation of concerns across different file types
 *
 * The config is organized into sections:
 * 1. Global ignores - Files/directories to skip linting
 * 2. Base JavaScript rules - Recommended JS linting rules
 * 3. TypeScript rules - TypeScript-specific linting for .ts/.tsx files
 * 4. React rules - React and React Hooks linting for .jsx/.tsx files
 * 5. Prettier integration - Disables ESLint rules that conflict with Prettier
 */

import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default [
  // Global ignores: Files and directories that should be excluded from linting
  {
    ignores: [
      '**/dist/**', // Production build output
      '**/node_modules/**', // Dependencies
      '**/.vite/**', // Vite cache
      '**/*.config.js', // Config files (may have different formatting needs)
      '**/*.config.mjs', // Config files
      '**/vite.config.d.ts', // Type definitions for config
      '**/vite-plugins/**/*.js', // Generated plugin files
      '**/vite-plugins/**/*.d.ts', // Generated type definitions
      '**/scripts/**', // Build/utility scripts
      '**/public/**', // Static assets
      '**/schemas/**', // JSON schema files
    ],
  },

  // Base JavaScript rules: Recommended ESLint rules for all JavaScript files
  js.configs.recommended,

  // TypeScript configuration: Rules and parser for TypeScript files (.ts, .tsx)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser, // TypeScript parser for ESLint
      parserOptions: {
        ecmaVersion: 'latest', // Use latest ECMAScript features
        sourceType: 'module', // ESM modules (matches package.json "type": "module")
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing for .tsx files
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint, // TypeScript-specific linting rules
    },
    rules: {
      // Apply recommended TypeScript rules
      ...tseslint.configs.recommended.rules,

      // Allow unused variables/parameters prefixed with underscore (common pattern for intentionally unused)
      '@typescript-eslint/no-unused-vars': [
        'warn', // Warn instead of error for better developer experience
        {
          argsIgnorePattern: '^_', // Ignore args like `_event`, `_props`
          varsIgnorePattern: '^_', // Ignore vars like `_unused`
        },
      ],

      // Disable base no-unused-vars in favor of TypeScript version
      // This prevents duplicate warnings from both rules
      'no-unused-vars': 'off',
    },
  },

  // React configuration: Rules for React components (.jsx, .tsx)
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react, // React-specific linting rules
      'react-hooks': reactHooks, // React Hooks linting rules
      'react-refresh': reactRefresh, // Vite React Fast Refresh support
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version from package.json
      },
    },
    rules: {
      // Apply recommended React rules
      ...react.configs.recommended.rules,

      // Apply JSX runtime rules (for React 17+ with automatic JSX transform)
      // This disables the need for `import React from 'react'` in every file
      ...react.configs['jsx-runtime'].rules,

      // Apply recommended React Hooks rules (e.g., exhaustive-deps)
      ...reactHooks.configs.recommended.rules,

      // Warn when files export non-component values alongside components
      // This helps catch accidental exports that break Fast Refresh
      // allowConstantExport: true allows exporting constants alongside components
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Prettier integration: Must be last to override any conflicting formatting rules
  // This disables ESLint rules that conflict with Prettier's formatting
  // (e.g., quotes, semicolons, indentation, etc.)
  prettier,
]
