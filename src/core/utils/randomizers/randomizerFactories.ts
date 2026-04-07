/**
 * Centralized factories for randomly modifying values with a max shift limit.
 */
import { getVarsStore } from '../../store/varsStore';

export function shiftValue<T>(current: T, options: T[], maxSteps: number = 2): T {
  const currentIndex = options.indexOf(current);
  if (currentIndex === -1) {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  const min = Math.max(0, currentIndex - maxSteps);
  const max = Math.min(options.length - 1, currentIndex + maxSteps);
  
  // Try to pick a different value within range if possible
  const rangeOptions = options.slice(min, max + 1).filter(opt => opt !== current);
  if (rangeOptions.length === 0) {
    return current; // Only option is current
  }
  
  return rangeOptions[Math.floor(Math.random() * rangeOptions.length)];
}

export function shiftNumber(current: number, min: number, max: number, maxSteps: number = 2, step: number = 1): number {
    if (maxSteps <= 0) return current;

    let shiftMultiplier = 0;
    while (shiftMultiplier === 0) {
        shiftMultiplier = Math.floor(Math.random() * (maxSteps * 2 + 1)) - maxSteps;
    }
    
    let newValue = current + (shiftMultiplier * step);
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    if (newValue === current) {
         if (current + step <= max) newValue = current + step;
         else if (current - step >= min) newValue = current - step;
    }
    
    // Ensure decimal precision avoids floating-point binary artifacts
    return Number(newValue.toFixed(3));
}

// ---- TOKEN REFERENCE CONSTANTS ----

export function getConstants() {
  const state = getVarsStore().getState();
  
  // Extract available palettes dynamically
  const lightPalettes = state.theme?.brand?.themes?.light?.palettes || state.theme?.themes?.light?.palettes || state.theme?.palettes || {};
  let paletteNames = Object.keys(lightPalettes).filter(k => k !== 'core-colors');
  if (!paletteNames.includes('neutral')) paletteNames.push('neutral');
  if (!paletteNames.includes('core-colors')) paletteNames.push('core-colors');

  // Extract available typefaces dynamically
  const typefacesRoot = state.tokens?.tokens?.font?.typefaces || state.tokens?.font?.typefaces || { primary: {} };
  const typefaces = Object.keys(typefacesRoot).filter(k => !k.startsWith('$'));

  // Extract available color scales dynamically
  const colorsRoot = state.tokens?.tokens?.colors || state.tokens?.colors || {};
  let colorScales = Object.keys(colorsRoot).filter(k => k.startsWith('scale-'));
  if (colorScales.length === 0) colorScales = ['scale-01', 'scale-02', 'scale-03', 'scale-04', 'scale-05', 'scale-06'];

  return {
    colorScales,
    paletteNames: Array.from(new Set(paletteNames)),
    paletteLevels: ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'],
    tones: ['tone', 'on-tone'],
    coreColors: ['interactive', 'warning', 'success', 'alert', 'black', 'white'],
    coreColorLevels: ['default', 'hover'],
    sizeTokens: ['none', '0-5x', '1x', '1-5x', '2x', '3x', '4x', '5x', '6x'],
    fontSizes: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
    textSizes: ['2xs', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
    letterSpacings: ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest'],
    lineHeights: ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest'],
    typefaces: typefaces.length > 0 ? typefaces : ['primary'],
    borderRadii: ['none', 'sm', 'default', 'lg', 'xl', '2xl'],
    dimensionGeneral: ['none', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', '3xl'],
    iconSizes: ['xs', 'sm', 'default', 'lg', 'xl'],
    elevations: ['elevation-0', 'elevation-1', 'elevation-2', 'elevation-3', 'elevation-4'],
    opacities: ['invisible', 'mist', 'ghost', 'faint', 'veiled', 'smoky', 'solid']
  };
}

export function randomizeTokenReference(tokenRef: string, originPath?: string): string {
    if (!tokenRef.startsWith('{') || !tokenRef.endsWith('}')) return tokenRef;
    
    const CONSTANTS = getConstants();
    const content = tokenRef.slice(1, -1);
    
    // Size tokens: {tokens.size.2x} or {tokens.sizes.2x}
    const sizeMatch = content.match(/^tokens\.sizes?\.([a-z0-9-]+)$/);
    if (sizeMatch) {
       return `{tokens.sizes.${shiftValue(sizeMatch[1], CONSTANTS.sizeTokens)}}`;
    }

    // Font size tokens: {tokens.font.sizes.md}
    const fontSizeMatch = content.match(/^tokens\.font\.sizes\.([a-z0-9-]+)$/);
    if (fontSizeMatch) {
        return `{tokens.font.sizes.${shiftValue(fontSizeMatch[1], CONSTANTS.fontSizes)}}`;
    }
    
    // Opacity tokens: {tokens.opacities.solid} or {tokens.opacity.solid}
    const opacityMatch = content.match(/^tokens\.(opacities|opacity)\.([a-z0-9-]+)$/);
    if (opacityMatch) {
        return `{tokens.${opacityMatch[1]}.${shiftValue(opacityMatch[2], CONSTANTS.opacities)}}`;
    }

    // Typefaces: {tokens.font.typefaces.primary}
    const typefaceMatch = content.match(/^tokens\.font\.typefaces\.([a-z0-9-]+)$/);
    if (typefaceMatch) {
        return `{tokens.font.typefaces.${shiftValue(typefaceMatch[1], CONSTANTS.typefaces)}}`;
    }
    
    // Brand Elevatons: {brand.elevations.elevation-1} or {brand.themes.light.elevations.elevation-1}
    const elevationMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?elevations\.([a-z0-9-]+)$/);
    if (elevationMatch) {
        return `{brand.elevations.${shiftValue(elevationMatch[1], CONSTANTS.elevations)}}`;
    }
    
    // Brand Border Radii: {brand.dimensions.border-radii.default}
    const radiiMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?dimensions\.border-radii\.([a-z0-9-]+)$/);
    if (radiiMatch) {
        return `{brand.dimensions.border-radii.${shiftValue(radiiMatch[1], CONSTANTS.borderRadii)}}`;
    }
    
    // Brand Dimensions Icons: {brand.dimensions.icons.sm}
    const iconDimMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?dimensions\.icons\.([a-z0-9-]+)$/);
    if (iconDimMatch) {
        return `{brand.dimensions.icons.${shiftValue(iconDimMatch[1], CONSTANTS.iconSizes)}}`;
    }

    // Brand Dimension General: {brand.dimensions.general.md}
    const dimMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?dimensions\.general\.([a-z0-9-]+)$/);
    if (dimMatch) {
        return `{brand.dimensions.general.${shiftValue(dimMatch[1], CONSTANTS.dimensionGeneral)}}`;
    }

    // Brand Dimension Gutters: {brand.dimensions.gutters.vertical} -> map to general
    const gutterMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?dimensions\.gutters\.([a-z0-9-]+)$/);
    if (gutterMatch) {
        const randomGeneral = CONSTANTS.dimensionGeneral[Math.floor(Math.random() * CONSTANTS.dimensionGeneral.length)];
        return `{brand.dimensions.general.${randomGeneral}}`;
    }

    // Brand Dimension Text Size: {brand.dimensions.text-size.md}
    const textDimMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?dimensions\.text-size\.([a-z0-9-]+)$/);
    if (textDimMatch) {
        return `{brand.dimensions.text-size.${shiftValue(textDimMatch[1], CONSTANTS.textSizes)}}`;
    }

    // Text heights: {tokens.font.line-heights.tall}
    const heightMatch = content.match(/^tokens\.font\.line-heights?\.([a-z0-9-]+)$/);
    if (heightMatch) {
        return `{tokens.font.line-heights.${shiftValue(heightMatch[1], ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest'])}}`;
    }

    // Text spacings: {tokens.font.letter-spacings.wide}
    const spacingsMatch = content.match(/^tokens\.font\.letter-spacings?\.([a-z0-9-]+)$/);
    if (spacingsMatch) {
        return `{tokens.font.letter-spacings.${shiftValue(spacingsMatch[1], ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest'])}}`;
    }
    
    // Brand Color Palette: {brand.themes.light.palettes.neutral.100.color.tone} or ...neutral.default.color.tone
    const paletteMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?palettes\.([a-z0-9-]+)\.([a-z0-9-]+)\.color\.(tone|on-tone)$/);
    if (paletteMatch) {
        const [, palette, level, tone] = paletteMatch;
        // Shift level slightly
        const newLevel = shiftValue(level, CONSTANTS.paletteLevels);
        // Optionally shift palette? 
        const newPalette = shiftValue(palette, CONSTANTS.paletteNames.filter(p => p !== 'core-colors'));
        return `{brand.palettes.${newPalette}.${newLevel}.color.${tone}}`;
    }
    
    // Core Colors: {brand.themes.light.palettes.core-colors.interactive.default.tone}
    const coreColorMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?palettes\.core-colors\.([a-z-]+)(?:\.([a-z-]+))?(?:\.tone|(?:\.on-tone(?:-hover)?))?$/);
    if (coreColorMatch) {
        if (originPath?.includes('overlay')) {
           const palettes = CONSTANTS.paletteNames.filter(p => p !== 'core-colors');
           const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
           const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
           return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
        }
        const randomScale = CONSTANTS.colorScales[Math.floor(Math.random() * CONSTANTS.colorScales.length)];
        const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
        return `{tokens.colors.${randomScale}.${randomLevel}}`;
    }

    // Color Tokens: {tokens.colors.scale-02.1000}
    const colorTokenMatch = content.match(/^tokens\.colors\.(scale-[0-9]{2})\.([0-9]+)$/);
    if (colorTokenMatch) {
        if (originPath?.includes('overlay')) {
           const palettes = CONSTANTS.paletteNames.filter(p => p !== 'core-colors');
           const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
           const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
           return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
        }
        const [, scale, level] = colorTokenMatch;
        const newScale = shiftValue(scale, CONSTANTS.colorScales);
        const newLevel = shiftValue(level, CONSTANTS.paletteLevels);
        return `{tokens.colors.${newScale}.${newLevel}}`;
    }

    // Text Emphasis: {brand.text-emphasis.low} or {brand.themes.light.text-emphasis.low}
    const emphasisMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?text-emphasis\.([a-z0-9-]+)$/);
    if (emphasisMatch) {
        return `{brand.text-emphasis.${shiftValue(emphasisMatch[1], ['low', 'medium', 'high'])}}`;
    }

    // Layers: {brand.themes.light.layers.layer-1.elements.interactive.tone} or {brand.layers.layer-1.properties.border-color}
    const layerMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?layers\.(layer-[0-3])\.(elements|properties)\.([a-z0-9-]+)(?:\.([a-z0-9-]+(?:\.[a-z0-9-]+)*))?$/);
    if (layerMatch) {
       // Per user requirement, do not assign another layer color. Always swap it out for a random palette color.
       const palettes = CONSTANTS.paletteNames.filter(p => p !== 'core-colors');
       const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
       const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
       return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
    }

    // States: {brand.states.disabled}
    const stateMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?states\.([a-z0-9-]+)$/);
    if (stateMatch) {
        const randomOpacity = CONSTANTS.opacities[Math.floor(Math.random() * CONSTANTS.opacities.length)];
        return `{tokens.opacities.${randomOpacity}}`;
    }
    
    // UI Kit Component Property References: {ui-kit.components.chip.properties.colors.error.icon-color}
    const componentPropMatch = content.match(/^ui-kit\.components\.([a-z0-9-]+)\.properties\.([a-z0-9-.]+)$/);
    if (componentPropMatch) {
       const [, comp, propPath] = componentPropMatch;
       if (propPath.includes('color') || propPath.includes('background') || propPath.includes('icon') || propPath.includes('surface') || propPath.includes('text')) {
           const palettes = CONSTANTS.paletteNames.filter(p => !['core-colors', 'system'].includes(p));
           const randomPalette = palettes[Math.floor(Math.random() * palettes.length)] || 'neutral';
           const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
           return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
       }
    }

    // UI Kit Global Property References: {ui-kit.globals.form.properties.label-field-gap-horizontal}
    // and {ui-kit.globals.form.field.colors.border} or {ui-kit.globals.form.field.size.horizontal-padding}
    const globalPropMatch = content.match(/^ui-kit\.globals\.([a-z0-9-]+)\.(properties|field)\.([a-z0-9-.]+)(?:\.([a-z0-9-.]+))?$/);
    if (globalPropMatch) {
       const [, globalGroup, subgroup, part1, part2] = globalPropMatch;
       const fullPropPath = part2 ? `${part1}.${part2}` : part1;
       
       // Handle colors
       if (part1 === 'colors' || fullPropPath.includes('color') || fullPropPath.includes('background') || fullPropPath.includes('icon') || fullPropPath.includes('surface') || fullPropPath.includes('text')) {
           const palettes = CONSTANTS.paletteNames.filter(p => !['core-colors', 'system'].includes(p));
           const randomPalette = palettes[Math.floor(Math.random() * palettes.length)] || 'neutral';
           const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
           return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
       }
       
       // Handle dimensions/sizes
       if (part1 === 'size' || fullPropPath.includes('gap') || fullPropPath.includes('padding') || fullPropPath.includes('margin') || fullPropPath.includes('spacing') || fullPropPath.includes('radius') || fullPropPath.includes('width') || fullPropPath.includes('height')) {
           const randomGeneral = CONSTANTS.dimensionGeneral[Math.floor(Math.random() * CONSTANTS.dimensionGeneral.length)];
           return `{brand.dimensions.general.${randomGeneral}}`;
       }
    }

    // UI Kit Component Variant References: {ui-kit.components.button.variants.styles.solid} or {ui-kit.components.button.variants.sizes.small}
    const componentVariantMatch = content.match(/^ui-kit\.components\.([a-z0-9-]+)\.variants\.(styles|sizes|appearances)\.([a-z0-9-]+)$/);
    if (componentVariantMatch) {
       const [, comp, category, value] = componentVariantMatch;
       if (category === 'styles') {
           return `{ui-kit.components.${comp}.variants.styles.${shiftValue(value, ['solid', 'text', 'outline', 'transparent', 'subtle'])}}`;
       } else if (category === 'sizes') {
           return `{ui-kit.components.${comp}.variants.sizes.${shiftValue(value, ['default', 'small', 'large', 'icon', 'icon-small', 'icon-large'])}}`;
       } else if (category === 'appearances') {
           return `{ui-kit.components.${comp}.variants.appearances.${shiftValue(value, ['solid', 'text', 'outline', 'transparent', 'subtle'])}}`;
       }
    }

    // Typography references: {brand.typography.h3.fontFamily}
    const typographyMatch = content.match(/^brand\.typography\.([a-z0-9-]+)\.([a-zA-Z]+)$/);
    if (typographyMatch) {
       const [, level, prop] = typographyMatch;
       const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'label', 'caption', 'code', 'small'];
       const newLevel = shiftValue(level, levels);
       return `{brand.typography.${newLevel}.${prop}}`;
    }

    return tokenRef;
}

export function randomizeRawColor(color: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
        // Shift a random color channel by 0-32 (-16 to +16)
        const shiftHex = (hexCode: string) => {
            const intVal = parseInt(hexCode, 16);
            const shifted = Math.max(0, Math.min(255, intVal + (Math.floor(Math.random() * 33) - 16)));
            return shifted.toString(16).padStart(2, '0');
        };
        const r = color.slice(1, 3);
        const g = color.slice(3, 5);
        const b = color.slice(5, 7);
        return `#${shiftHex(r)}${shiftHex(g)}${shiftHex(b)}`;
    }
    return color;
}

export function randomizeStringValue(propName: string, oldVal: string): string {
    const stringOptions: Record<string, string[]> = {
        'display': ['icon', 'text', 'icon+text'],
        'orientation': ['horizontal', 'vertical'],
        'heading-level': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        'position': ['top', 'bottom', 'left', 'right'],
        'alignment': ['start', 'center', 'end'],
        'search-icon-position': ['left', 'right'],
        'avatar-size': ['small', 'default', 'large'],
        'border-style': ['solid', 'dashed', 'dotted'],
        'header-style': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        'tab-content-alignment': ['left', 'center', 'right']
    };

    const opts = stringOptions[propName];
    if (opts) {
        return opts.filter(o => o !== oldVal)[Math.floor(Math.random() * (opts.length - 1))] || opts[0];
    }
    return oldVal;
}

export function randomizeNullValue(type: string, propName: string): any {
    const CONSTANTS = getConstants();
    
    if (type === 'color') {
        const palettes = CONSTANTS.paletteNames.filter(p => !['core-colors', 'system'].includes(p));
        const randomPalette = palettes[Math.floor(Math.random() * palettes.length)] || 'neutral';
        const randomLevel = CONSTANTS.paletteLevels[Math.floor(Math.random() * CONSTANTS.paletteLevels.length)];
        return `{brand.palettes.${randomPalette}.${randomLevel}.color.tone}`;
    }
    
    if (type === 'dimension') {
        const randomGeneral = CONSTANTS.dimensionGeneral[Math.floor(Math.random() * CONSTANTS.dimensionGeneral.length)];
        return `{brand.dimensions.general.${randomGeneral}}`;
    }
    
    if (type === 'number') {
        return Math.floor(Math.random() * 20); // Arbitrary small number
    }
    
    if (type === 'string') {
        return randomizeStringValue(propName, '');
    }
    
    return null;
}

export function randomizeNumberValue(val: number, assumedMin: number = 0, assumedMax?: number): number {
    const isFloat = !Number.isInteger(val);
    
    // Infer a reasonable max if none provided based on typical CSS property scales
    let min = assumedMin;
    let max = assumedMax;
    
    if (max === undefined) {
        if (val <= 10) max = 20; // e.g. border-width
        else if (val <= 50) max = 100; // e.g. padding, margin, border-radius
        else max = Math.max(1000, val * 2); // e.g. width, height
    }
    
    // Clamp to min/max initially just in case
    const current = Math.max(min, Math.min(max, val));
    
    const diffHigh = max - current;
    const diffLow = current - min;
    
    // Pick direction: true for up, false for down
    const goUp = Math.random() > 0.5;
    
    let shiftAmount = 0;
    if (goUp) {
        // Up to 20% of the diff between current and max
        shiftAmount = Math.random() * (diffHigh * 0.2); 
    } else {
        // Up to 20% of the diff between current and min
        shiftAmount = -(Math.random() * (diffLow * 0.2));
    }
    
    let newVal = current + shiftAmount;
    
    if (!isFloat) {
        newVal = Math.round(newVal);
        // Ensure at least a +/- 1 change if it resulted in the identical number
        if (newVal === current) {
            if (goUp && current < max) newVal += 1;
            else if (!goUp && current > min) newVal -= 1;
            else if (current === max) newVal -= 1;
            else if (current === min) newVal += 1;
        }
    } else {
        newVal = Number(newVal.toFixed(3));
    }
    
    return Math.max(min, Math.min(max, newVal));
}
