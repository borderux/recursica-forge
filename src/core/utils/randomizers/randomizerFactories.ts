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

export function shiftNumber(current: number, min: number, max: number, maxSteps: number = 2): number {
    const stepSize = Math.max(1, (max - min) / 10);
    const shiftAmount = (Math.floor(Math.random() * (maxSteps * 2 + 1)) - maxSteps) * stepSize;
    let newValue = current + shiftAmount;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    return newValue;
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

  return {
    paletteNames: Array.from(new Set(paletteNames)),
    paletteLevels: ['000', '050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000'],
    tones: ['tone', 'on-tone'],
    coreColors: ['interactive', 'warning', 'success', 'alert', 'black', 'white'],
    coreColorLevels: ['default', 'hover'],
    sizeTokens: ['none', '0-5x', '1x', '1-5x', '2x', '3x', '4x', '5x', '6x'],
    fontSizes: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
    fontWeights: ['thin', 'extra-light', 'light', 'regular', 'medium', 'semi-bold', 'bold', 'extra-bold', 'black'],
    letterSpacings: ['tightest', 'tighter', 'tight', 'default', 'wide', 'wider', 'widest'],
    lineHeights: ['shortest', 'shorter', 'short', 'default', 'tall', 'taller', 'tallest'],
    typefaces: typefaces.length > 0 ? typefaces : ['primary'],
    textStyles: ['normal', 'italic'],
    textCases: ['original', 'uppercase', 'titlecase'],
    textDecorations: ['none', 'underline', 'strikethrough'],
    borderRadii: ['none', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', 'pill', 'circle'],
    dimensionGeneral: ['none', 'xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl', '3xl'],
    iconSizes: ['xs', 'sm', 'default', 'lg', 'xl'],
    elevations: ['elevation-0', 'elevation-1', 'elevation-2', 'elevation-3', 'elevation-4'],
    opacities: ['invisible', 'mist', 'ghost', 'faint', 'veiled', 'smoky', 'solid']
  };
}

export function randomizeTokenReference(tokenRef: string): string {
    if (!tokenRef.startsWith('{') || !tokenRef.endsWith('}')) return tokenRef;
    
    const CONSTANTS = getConstants();
    const content = tokenRef.slice(1, -1);
    
    // Size tokens: {tokens.size.2x}
    const sizeMatch = content.match(/^tokens\.size\.([a-z0-9-]+)$/);
    if (sizeMatch) {
       return `{tokens.size.${shiftValue(sizeMatch[1], CONSTANTS.sizeTokens)}}`;
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

    // Font weights: {tokens.font.weights.regular}
    const fontWeightMatch = content.match(/^tokens\.font\.weights\.([a-z0-9-]+)$/);
    if (fontWeightMatch) {
        return `{tokens.font.weights.${shiftValue(fontWeightMatch[1], CONSTANTS.fontWeights)}}`;
    }

    // Font styles: {tokens.font.styles.italic}
    const fontStyleMatch = content.match(/^tokens\.font\.styles\.([a-z0-9-]+)$/);
    if (fontStyleMatch) {
        return `{tokens.font.styles.${shiftValue(fontStyleMatch[1], CONSTANTS.textStyles)}}`;
    }
    
    // Typefaces: {tokens.font.typefaces.primary}
    const typefaceMatch = content.match(/^tokens\.font\.typefaces\.([a-z0-9-]+)$/);
    if (typefaceMatch) {
        return `{tokens.font.typefaces.${shiftValue(typefaceMatch[1], CONSTANTS.typefaces)}}`;
    }
    
    // Text cases: {tokens.font.cases.original}
    const casesMatch = content.match(/^tokens\.font\.cases\.([a-z0-9-]+)$/);
    if (casesMatch) {
        return `{tokens.font.cases.${shiftValue(casesMatch[1], CONSTANTS.textCases)}}`;
    }

    // Text decoration: {tokens.font.decorations.none}
    const decorationsMatch = content.match(/^tokens\.font\.decorations\.([a-z0-9-]+)$/);
    if (decorationsMatch) {
        return `{tokens.font.decorations.${shiftValue(decorationsMatch[1], CONSTANTS.textDecorations)}}`;
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

    // Text heights: {tokens.font.line-heights.tall}
    const heightMatch = content.match(/^tokens\.font\.line-heights?\.([a-z0-9-]+)$/);
    if (heightMatch) {
        return `{tokens.font.line-heights.${shiftValue(heightMatch[1], ['none', 'tight', 'default', 'tall', 'relax'])}}`;
    }

    // Text spacings: {tokens.font.letter-spacings.wide}
    const spacingsMatch = content.match(/^tokens\.font\.letter-spacings?\.([a-z0-9-]+)$/);
    if (spacingsMatch) {
        return `{tokens.font.letter-spacings.${shiftValue(spacingsMatch[1], ['tight', 'default', 'wide', 'widest'])}}`;
    }
    
    // Brand Color Palette: {brand.themes.light.palettes.neutral.100.color.tone}
    const paletteMatch = content.match(/^brand\.(?:themes\.(?:light|dark)\.)?palettes\.([a-z0-9-]+)\.([0-9]+)\.color\.(tone|on-tone)$/);
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
        const [, type] = coreColorMatch;
        const newType = shiftValue(type, CONSTANTS.coreColors);
        if (newType === 'interactive') {
            return `{brand.palettes.core-colors.interactive.default.tone}`;
        }
        return `{brand.palettes.core-colors.${newType}.tone}`;
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
        return `{brand.states.${shiftValue(stateMatch[1], ['hover', 'pressed', 'focused', 'disabled'])}}`;
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
