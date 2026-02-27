import { vi, test, expect } from 'vitest';
import { updateUIKitValue } from './src/core/css/updateUIKitValue';

// Mock getVarsStore 
const mockState = {
    uikit: {
        "ui-kit": {
            "components": {
                "chip": {
                    "variants": {
                        "styles": {
                            "unselected": {
                                "properties": {
                                    "colors": {
                                        "layer-0": {
                                            "background": {
                                                "$type": "color",
                                                "$value": "{brand.layers.layer-0.properties.surface}"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

let passedUIKit: any = null;
const mockStore = {
    getState: () => mockState,
    setUiKitSilent: (uikit: any) => {
        passedUIKit = uikit;
    }
};

vi.mock('./src/core/store/varsStore', () => ({
    getVarsStore: () => mockStore
}));

test('updateUIKitValue', () => {
    const res = updateUIKitValue('--recursica-ui-kit-components-chip-variants-styles-unselected-properties-colors-layer-0-background', 'var(--recursica-tokens-colors-scale-06-400)');
    console.log("Result:", res);
    console.log("Passed uikit branch:", JSON.stringify(passedUIKit?.['ui-kit']?.components?.chip?.variants?.styles?.unselected?.properties?.colors?.['layer-0']?.background, null, 2));
    expect(res).toBe(true);
});
