import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { watchToolbarIcons } from './vite-plugins/watch-toolbar-icons';
import { copy404Html } from './vite-plugins/copy-404';
import { copyUIKit } from './vite-plugins/copy-uikit';
// https://vitejs.dev/config/
export default defineConfig({
    base: '/', // Custom domain, so base is root
    plugins: [react(), vanillaExtractPlugin(), watchToolbarIcons(), copy404Html(), copyUIKit()],
    optimizeDeps: {
        // Exclude phosphor-react from pre-bundling to avoid timeout issues
        // Individual icon imports will still work fine
        exclude: ['phosphor-react'],
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        testTimeout: 30000, // Allow time for act() and async UI updates (toolbar/integration tests)
        coverage: {
            provider: 'v8',
        },
    },
    build: {
        target: 'es2020',
        sourcemap: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React core
                    if (id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react/jsx-runtime')) {
                        return 'react-vendor';
                    }
                    // MUI + Emotion must be in the SAME chunk to avoid Safari
                    // initialization-order crash (Emotion styled helper must be
                    // defined before MUI references it)
                    if (id.includes('node_modules/@mui/') ||
                        id.includes('node_modules/@emotion/')) {
                        return 'mui-vendor';
                    }
                    // Mantine
                    if (id.includes('node_modules/@mantine/core')) {
                        return 'mantine-core';
                    }
                    if (id.includes('node_modules/@mantine/hooks')) {
                        return 'mantine-hooks';
                    }
                    // Carbon
                    if (id.includes('node_modules/@carbon/')) {
                        return 'carbon-core';
                    }
                    // Icon libraries
                    if (id.includes('node_modules/@phosphor-icons/')) {
                        return 'icons';
                    }
                    // Routing
                    if (id.includes('node_modules/react-router-dom/') ||
                        id.includes('node_modules/react-router/')) {
                        return 'router';
                    }
                    // Floating UI
                    if (id.includes('node_modules/@floating-ui/')) {
                        return 'floating-ui';
                    }
                },
            },
        },
    },
});
