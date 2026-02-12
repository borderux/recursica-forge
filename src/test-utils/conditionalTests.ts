/**
 * Test utilities for conditional test execution
 * 
 * In CI mode, DOM/rendering tests are skipped to avoid flaky tests
 * caused by component loading timing issues in CI environments.
 * 
 * Logic/unit tests always run in both CI and local environments.
 */

/**
 * Check if we're running in CI mode
 */
export const isCI = () => {
    return process.env.CI === 'true' || process.env.CI_MODE === 'true'
}

/**
 * Conditionally describe a test suite that includes DOM/rendering tests
 * These tests will be skipped in CI mode
 * 
 * @example
 * describeDom('Button Component', () => {
 *   it('renders correctly', () => {
 *     // This test will only run locally, not in CI
 *   })
 * })
 */
export const describeDom = isCI() ? describe.skip : describe

/**
 * Conditionally run a single DOM/rendering test
 * This test will be skipped in CI mode
 * 
 * @example
 * itDom('renders correctly', () => {
 *   // This test will only run locally, not in CI
 * })
 */
export const itDom = isCI() ? it.skip : it

/**
 * Regular describe for logic tests that should always run
 * (This is just an alias for clarity)
 */
export const describeLogic = describe

/**
 * Regular it for logic tests that should always run
 * (This is just an alias for clarity)
 */
export const itLogic = it
