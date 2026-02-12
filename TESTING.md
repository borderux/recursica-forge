# Testing Strategy

This project uses a dual testing strategy to ensure reliable CI builds while maintaining comprehensive test coverage locally.

## Overview

- **DOM/Rendering Tests**: Run only in local development (skipped in CI)
- **Logic/Unit Tests**: Run in both CI and local environments

## Why This Approach?

DOM and rendering tests can be flaky in CI environments due to:
- Component loading timing issues
- Asynchronous UI library initialization
- Environment-specific rendering differences
- Resource constraints in CI runners

By separating DOM tests from logic tests, we ensure:
- ✅ Fast, reliable CI builds
- ✅ Comprehensive local testing
- ✅ Clear separation of concerns

## Usage

### Writing Tests

Use the conditional test utilities from `src/test-utils/conditionalTests.ts`:

```typescript
import { describeDom, itDom, describeLogic, itLogic } from '../../../test-utils/conditionalTests'

// DOM tests - only run locally
describeDom('Button Component Rendering', () => {
  itDom('renders with children', async () => {
    const { container } = render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})

// Logic tests - run in both CI and local
describeLogic('Button Component Logic', () => {
  itLogic('generates correct CSS variable paths', () => {
    const varPath = buildButtonCssVar('background')
    expect(varPath).toBe('--recursica-ui-kit-components-button-properties-background')
  })
})
```

### Running Tests

```bash
# Local development - runs ALL tests (DOM + logic)
npm test

# CI environment - skips DOM tests, runs only logic tests
npm run test:ci

# Watch mode for local development
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Utilities

### `describeDom(name, fn)`
Creates a test suite that only runs locally. Automatically skipped in CI.

### `itDom(name, fn)`
Creates a single test that only runs locally. Automatically skipped in CI.

### `describeLogic(name, fn)` 
Alias for `describe` - runs in both CI and local. Use for clarity.

### `itLogic(name, fn)`
Alias for `it` - runs in both CI and local. Use for clarity.

### `isCI()`
Returns `true` if running in CI environment.

## CI Configuration

The CI environment is detected via the `CI` environment variable:
- Set to `true` in GitHub Actions automatically
- Set manually via `npm run test:ci`

## Migration Guide

To migrate existing tests:

1. **Identify test type**:
   - Does it render components? → DOM test
   - Does it test logic/utilities? → Logic test

2. **Update imports**:
   ```typescript
   import { describeDom, itDom } from '../../../test-utils/conditionalTests'
   ```

3. **Replace test declarations**:
   ```typescript
   // Before
   describe('Component Tests', () => { ... })
   
   // After (for DOM tests)
   describeDom('Component Tests', () => { ... })
   
   // After (for logic tests)
   describe('Component Tests', () => { ... }) // or describeLogic for clarity
   ```

4. **Remove manual `.skip` calls**:
   ```typescript
   // Before
   describe.skip('Flaky Tests', () => { ... })
   
   // After
   describeDom('Flaky Tests', () => { ... })
   ```

## Best Practices

1. **Separate concerns**: Keep DOM tests and logic tests in separate `describe` blocks
2. **Use descriptive names**: Make it clear what type of test it is
3. **Test logic thoroughly**: Logic tests should cover all edge cases
4. **Keep DOM tests simple**: Focus on critical rendering paths
5. **Document flaky tests**: If a test is flaky, document why and consider refactoring

## Examples

See these files for examples:
- `src/components/adapters/__tests__/Button.test.tsx` - DOM tests using `describeDom`
- `src/components/adapters/__tests__/Button.cssVars.test.tsx` - Mix of DOM and logic tests
- `src/core/compliance/__tests__/AAComplianceWatcher.test.tsx` - Pure logic tests

## Troubleshooting

### Tests pass locally but fail in CI
- Check if they're DOM tests that should use `describeDom`/`itDom`
- Verify the test doesn't rely on specific timing or environment setup

### Tests are skipped locally
- Ensure `CI` environment variable is not set
- Check that you're using `describeDom`/`itDom` correctly

### All tests are skipped in CI
- This is expected for DOM-only test files
- Ensure you have some logic tests that run in CI
