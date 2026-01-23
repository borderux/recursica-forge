/**
 * Vite plugin to copy index.html to 404.html during build
 *
 * This ensures 404.html stays in sync with index.html for GitHub Pages SPA routing.
 */
import type { Plugin } from 'vite';
export declare function copy404Html(): Plugin;
