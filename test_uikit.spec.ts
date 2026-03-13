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
    const res = updateUIKitValue('--recursica_ui-kit_components_chip_variants_styles_unselected_properties_colors_layer-0_background', 'var(--recursica_tokens_colors_scale-06_400)');
    console.log("Result:", res);
    console.log("Passed uikit branch:", JSON.stringify(passedUIKit?.['ui-kit']?.components?.chip?.variants?.styles?.unselected?.properties?.colors?.['layer-0']?.background, null, 2));
    expect(res).toBe(true);
});
