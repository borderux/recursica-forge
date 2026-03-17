/**
 * Vite plugin to copy recursica_ui-kit.json to dist/ during build
 *
 * Enables "Reload UIKit from file" to fetch fresh UIKit in production.
 */
import type { Plugin } from 'vite';
export declare function copyUIKit(): Plugin;
