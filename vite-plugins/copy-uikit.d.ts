/**
 * Vite plugin to copy UIKit.json to dist/vars/ during build
 *
 * Enables "Reload UIKit from file" to fetch fresh UIKit in production.
 */
import type { Plugin } from 'vite';
export declare function copyUIKit(): Plugin;
