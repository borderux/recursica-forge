import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { watchToolbarIcons } from './vite-plugins/watch-toolbar-icons';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), vanillaExtractPlugin(), watchToolbarIcons()],
    optimizeDeps: {
        // Exclude phosphor-react from pre-bundling to avoid timeout issues
        // Individual icon imports will still work fine
        exclude: ['phosphor-react'],
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
        },
    },
});
