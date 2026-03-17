/**
 * Vite plugin to copy recursica_ui-kit.json to dist/ during build
 *
 * Enables "Reload UIKit from file" to fetch fresh UIKit in production.
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
export function copyUIKit() {
    return {
        name: 'copy-uikit',
        writeBundle() {
            const srcPath = join(process.cwd(), 'recursica_ui-kit.json');
            const distDir = join(process.cwd(), 'dist');
            const distPath = join(distDir, 'recursica_ui-kit.json');
            try {
                if (!existsSync(srcPath))
                    return;
                mkdirSync(distDir, { recursive: true });
                copyFileSync(srcPath, distPath);
                console.log('✓ Copied recursica_ui-kit.json to dist/ for reload-from-file');
            }
            catch (error) {
                console.error('Failed to copy recursica_ui-kit.json:', error);
            }
        },
    };
}
