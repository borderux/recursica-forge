/**
 * Randomize Variables Utility
 * 
 * Development-only utility to randomly modify all user-modifiable variables
 * for thorough testing of exports and validation.
 */

import { getVarsStore } from '../store/varsStore'
import type { JsonLike } from '../resolvers/tokens'
import type { RandomizeOptions } from './RandomizeOptionsModal'
import { randomizeTokens } from './randomizers/tokenRandomizer'
import { randomizeTheme } from './randomizers/themeRandomizer'
import { removeCssVar } from '../css/updateCssVar'

export function randomizeAllVariables(options?: RandomizeOptions): void {
  const opts: RandomizeOptions = options || {
    tokens: { 
      colors: true, 
      sizes: true, 
      opacities: true, 
      fontSizes: true, 
      letterSpacing: true, 
      lineHeights: true 
    },
    theme: { coreProperties: true, corePropertyElements: true, overlay: true, type: true, palettes: true, elevations: true, dimensions: true, layers: true },
  }

  if (process.env.NODE_ENV !== 'development') {
    console.warn('randomizeAllVariables can only be called in development mode')
    return
  }

  const store = getVarsStore()
  const state = store.getState()
  
  // Clear any previous randomizer diff to avoid stale data per user request
  try {
     sessionStorage.removeItem('randomizer_diffs');
  } catch (e) {}

  const initialTokens = JSON.parse(JSON.stringify(state.tokens)) as JsonLike
  const initialTheme = getVarsStore().getLatestThemeCopy() as JsonLike

  const shouldRandomizeTokens = Object.values(opts.tokens).some(v => v === true)
  const shouldRandomizeTheme = Object.values(opts.theme).some(v => v === true)

  const diffs: { path: string, before: any, after: any, changed?: boolean }[] = [];

  // Update Tokens
  if (shouldRandomizeTokens) {
     const modifiedTokens: any = randomizeTokens(initialTokens, opts, diffs);
     store.setTokens(modifiedTokens);
     if (opts.tokens.sizes || opts.tokens.fontSizes || opts.tokens.letterSpacing || opts.tokens.lineHeights) {
         window.dispatchEvent(new CustomEvent('disableAutoScale'));
     }
  }

  // Update Theme
  if (shouldRandomizeTheme) {
      const modifiedTheme = randomizeTheme(initialTheme, opts, diffs);
      // If the user requested Elevations to be randomized, purge any localized manual Elevation
      // overrides that pre-existed in the App state logic to ensure the new structurally 
      // randomized values actually map cleanly into the DOM variables via recomputeAndApplyAll().
      if (opts.theme.elevations) {
         // Extract the new values from modifiedTheme to prepopulate the UI dropdowns
         const newPaletteSelections: Record<'light' | 'dark', Record<string, { paletteKey: string; level: string }>> = { light: {}, dark: {} };
         const newColorTokens: Record<string, string> = {};
         
         if (modifiedTheme?.brand?.themes) {
            for (const mode of ['light', 'dark'] as const) {
               const els = modifiedTheme.brand.themes[mode]?.elevations || {};
               for (let i = 1; i <= 4; i++) {
                  const key = `elevation-${i}`;
                  const colorRef = els[key]?.$value?.color?.$value;
                  if (typeof colorRef === 'string') {
                     const match = colorRef.match(/palettes\.([a-z0-9-]+)\.(\d+)\.color\.tone/);
                     if (match) {
                         newPaletteSelections[mode][key] = { paletteKey: match[1], level: match[2] };
                     } else {
                         const match2 = colorRef.match(/tokens\.colors\.(scale-\d{2})\.(\d+)/);
                         if (match2) {
                             newColorTokens[key] = `colors/${match2[1]}/${match2[2]}`;
                         }
                     }
                  }
               }
            }
         }

         store.updateElevation(prev => ({
             ...prev,
             controls: { light: {}, dark: {} },
             directions: { light: {}, dark: {} },
             paletteSelections: newPaletteSelections,
             colorTokens: newColorTokens,
             alphaTokens: { light: {}, dark: {} }
         }));
         
         if (typeof document !== 'undefined') {
             for (let lvl = 1; lvl <= 4; lvl++) {
                 // Clear generic themed variables
                 for (const mode of ['light', 'dark']) {
                    removeCssVar(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_shadow-color`);
                    const propNames = ['blur', 'spread', 'x-axis', 'y-axis'] as const;
                    propNames.forEach((prop) => {
                      removeCssVar(`--recursica_brand_themes_${mode}_elevations_elevation-${lvl}_${prop}`);
                    });
                 }
                 // Clear scoped overlay parameters
                 removeCssVar(`--recursica_brand_elevations_elevation-${lvl}_shadow-color`);
                 const propNames = ['blur', 'spread', 'x-axis', 'y-axis'] as const;
                 propNames.forEach((prop) => {
                   removeCssVar(`--recursica_brand_elevations_elevation-${lvl}_${prop}`);
                 });
             }
         }
      }

      // If the user requested Layers to be randomized, purge localized overlay manual settings
      if (opts.theme.layers) {
         if (typeof document !== 'undefined') {
             for (let lvl = 0; lvl <= 3; lvl++) {
                 // Clear generic themed layer properties and text elements
                 const allLayerProperties = ['surface', 'border-color', 'padding', 'border-radius', 'border-size', 'elevation'];
                 const allTextProperties = ['color', 'high-emphasis', 'low-emphasis'];

                 for (const mode of ['light', 'dark']) {
                    allLayerProperties.forEach(prop => removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_properties_${prop}`));
                    allTextProperties.forEach(prop => removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_elements_text-${prop}`));
                    // Interactive tones
                    removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_elements_interactive_tone`);
                    removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_elements_interactive_tone-hover`);
                    removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_elements_interactive_on-tone`);
                    removeCssVar(`--recursica_brand_themes_${mode}_layers_layer-${lvl}_elements_interactive_on-tone-hover`);
                 }
                 // Clear scoped properties
                 allLayerProperties.forEach(prop => removeCssVar(`--recursica_brand_layer_${lvl}_properties_${prop}`));
                 allTextProperties.forEach(prop => removeCssVar(`--recursica_brand_layer_${lvl}_elements_text-${prop}`));
                 removeCssVar(`--recursica_brand_layer_${lvl}_elements_interactive_tone`);
                 removeCssVar(`--recursica_brand_layer_${lvl}_elements_interactive_tone-hover`);
                 removeCssVar(`--recursica_brand_layer_${lvl}_elements_interactive_on-tone`);
                 removeCssVar(`--recursica_brand_layer_${lvl}_elements_interactive_on-tone-hover`);
             }
         }
      }

      store.setTheme(modifiedTheme);
  }

  // Save the run to sessionStorage
  try {
     sessionStorage.setItem('randomizer_diffs', JSON.stringify(diffs));
  } catch (e) {
     console.error("Failed to save diffs to sessionStorage", e);
  }

  // Force global style recomputation cascade for any caching listeners (e.g. SizeTokens, Toolbar configs)
  if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('cssVarsUpdated'));
  }

  // Open the results tab
  if (typeof window !== 'undefined') {
     window.open('/dev/random', '_blank');
  }
}
