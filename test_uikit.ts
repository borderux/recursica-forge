import { updateUIKitValue } from './src/core/css/updateUIKitValue';
import { getVarsStore } from './src/core/store/varsStore';

console.log("Mocking store");
const originalLog = console.warn;
console.warn = (...args) => console.log("WARN:", ...args);

// Mock store
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

let setUiKitSilentCalled = false;
let passedUIKit = null;
const mockStore = {
  getState: () => mockState,
  setUiKitSilent: (uikit) => {
    setUiKitSilentCalled = true;
    passedUIKit = uikit;
  }
};

// We intercept require for varsStore
const mockRequire = require('module').prototype.require;
require('module').prototype.require = function(path) {
  if (path.includes('varsStore')) {
    return { getVarsStore: () => mockStore };
  }
  return mockRequire.apply(this, arguments);
};

const res = updateUIKitValue('--recursica-ui-kit-components-chip-variants-styles-unselected-properties-colors-layer-0-background', 'var(--recursica-tokens-colors-scale-06-400)');
console.log("Result:", res);
console.log("setUiKitSilentCalled:", setUiKitSilentCalled);
if (setUiKitSilentCalled) {
  console.log("New value:", JSON.stringify(passedUIKit['ui-kit'].components.chip.variants.styles.unselected.properties.colors['layer-0'].background, null, 2));
}

