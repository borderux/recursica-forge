import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), vanillaExtractPlugin()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
        },
    },
});
