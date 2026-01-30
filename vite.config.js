import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { watchToolbarIcons } from './vite-plugins/watch-toolbar-icons';
import { copy404Html } from './vite-plugins/copy-404';
// https://vitejs.dev/config/
export default defineConfig({
    base: '/', // Custom domain, so base is root
    plugins: [react(), vanillaExtractPlugin(), watchToolbarIcons(), copy404Html()],
    optimizeDeps: {
        // Exclude phosphor-react from pre-bundling to avoid timeout issues
        // Individual icon imports will still work fine
        exclude: ['phosphor-react'],
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        testTimeout: 10000, // Increase timeout for CI environments
        teardownTimeout: 5000, // Timeout for cleanup
        hookTimeout: 10000, // Timeout for hooks (beforeEach, afterEach, etc.)
        coverage: {
            provider: 'v8',
        },
        // Use forks pool for better isolation and to prevent hanging
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: false,
            },
        },
        // Force exit after tests to prevent hanging from event listeners
        forceRerunTriggers: ['**/vitest.setup.ts'],
    },
});
