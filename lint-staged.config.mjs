export default {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,css,html,yml,yaml}': [
    'prettier --write',
  ],
  '*.{ts,tsx}': [
    () => 'tsc --noEmit',
  ],
}
