import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  importTokensJson,
  importBrandJson,
  importUIKitJson,
  importJsonFiles,
  detectJsonFileType,
  detectDirtyData,
} from "./jsonImport";
import * as validateSchemasModule from "../utils/validateJsonSchemas";
import * as varsStoreModule from "../store/varsStore";

import { validateImportedReferences, ImportValidationError } from "./importHydration";
import { validateReferences } from "../utils/validateJsonSchemas";

// Mock validateJsonSchemas
vi.mock("../utils/validateJsonSchemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/validateJsonSchemas")>();
  return {
    ...actual,
    validateBrandJson: vi.fn(),
    validateTokensJson: vi.fn(),
    validateUIKitJson: vi.fn(),
  };
});

// Mock varsStore
const mockStore = {
  setTokens: vi.fn(),
  setTheme: vi.fn(),
  importTheme: vi.fn(),
  setUiKit: vi.fn(),
  bulkImport: vi.fn(),
  getState: vi.fn(() => ({
    tokens: {},
    theme: {},
    uikit: {},
  })),
  writeState: vi.fn(),
};

vi.mock("../store/varsStore", () => ({
  getVarsStore: vi.fn(() => mockStore),
}));

describe("detectJsonFileType", () => {
  it("should detect recursica_tokens.json", () => {
    expect(detectJsonFileType({ tokens: {} })).toBe("tokens");
  });

  it("should detect recursica_brand.json", () => {
    expect(detectJsonFileType({ brand: {} })).toBe("brand");
    expect(detectJsonFileType({ themes: {} })).toBe("brand");
  });

  it("should detect recursica_ui-kit.json", () => {
    expect(detectJsonFileType({ "ui-kit": {} })).toBe("uikit");
    expect(detectJsonFileType({ uiKit: {} })).toBe("uikit");
  });

  it("should return null for unknown types", () => {
    expect(detectJsonFileType({})).toBeNull();
    expect(detectJsonFileType({ unknown: {} })).toBeNull();
  });
});

describe("detectDirtyData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.getState.mockReturnValue({
      tokens: {},
      theme: {},
      uikit: {},
    });
  });

  it("should return false when data matches original", () => {
    // Import the actual JSON files to get their structure
    const tokensJson = require("../../../recursica_tokens.json");
    const brandJson = require("../../../recursica_brand.json");
    const uikitJson = require("../../../recursica_ui-kit.json");

    // Normalize to match what detectDirtyData expects
    const originalTokens = tokensJson;
    const originalBrand = (brandJson as any)?.brand
      ? brandJson
      : { brand: brandJson };
    const originalUiKit = (uikitJson as any)?.["ui-kit"]
      ? uikitJson
      : { "ui-kit": uikitJson };

    // Mock getState to return same structure as original
    mockStore.getState.mockReturnValue({
      tokens: originalTokens,
      theme: originalBrand,
      uikit: originalUiKit,
    });

    const result = detectDirtyData();
    expect(result).toBe(false);
  });

  it("should return true when tokens differ", () => {
    mockStore.getState.mockReturnValue({
      tokens: { tokens: { color: { gray: { "500": { $value: "#ff0000" } } } } },
      theme: { brand: {} },
      uikit: { "ui-kit": {} },
    });

    const result = detectDirtyData();
    expect(result).toBe(true);
  });

  it("should return true when theme differs", () => {
    mockStore.getState.mockReturnValue({
      tokens: { tokens: {} },
      theme: { brand: { themes: { light: { palettes: {} } } } },
      uikit: { "ui-kit": {} },
    });

    const result = detectDirtyData();
    expect(result).toBe(true);
  });

  it("should return false on error (assume clean)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockStore.getState.mockImplementation(() => {
      throw new Error("Test error");
    });

    const result = detectDirtyData();
    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });
});

describe("importTokensJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and import tokens", () => {
    const tokens = {
      tokens: { color: { gray: { "500": { $value: "#808080" } } } },
    };

    importTokensJson(tokens);

    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalledWith(
      tokens,
    );
    expect(mockStore.setTokens).toHaveBeenCalledWith(tokens);
  });

  it("should normalize tokens structure", () => {
    const tokens = { color: { gray: { "500": { $value: "#808080" } } } };

    importTokensJson(tokens);

    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalledWith({
      tokens,
    });
    expect(mockStore.setTokens).toHaveBeenCalledWith({ tokens });
  });

  it("should throw on validation failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const tokens = { tokens: { invalid: "data" } };
    vi.mocked(validateSchemasModule.validateTokensJson).mockImplementation(
      () => {
        throw new Error("Validation failed");
      },
    );

    expect(() => importTokensJson(tokens)).toThrow(
      "Failed to import recursica_tokens.json",
    );
    consoleSpy.mockRestore();
  });
});

describe("importBrandJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and import brand", () => {
    const brand = { brand: { themes: { light: {} } } };

    importBrandJson(brand);

    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalledWith(brand);
    expect(mockStore.importTheme).toHaveBeenCalledWith(brand);
  });

  it("should normalize brand structure", () => {
    const brand = { themes: { light: {} } };

    importBrandJson(brand);

    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalledWith({
      brand,
    });
    expect(mockStore.importTheme).toHaveBeenCalledWith({ brand });
  });

  it("should throw on validation failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const brand = { brand: { invalid: "data" } };
    vi.mocked(validateSchemasModule.validateBrandJson).mockImplementation(
      () => {
        throw new Error("Validation failed");
      },
    );

    expect(() => importBrandJson(brand)).toThrow(
      "Failed to import recursica_brand.json",
    );
    consoleSpy.mockRestore();
  });
});

describe("importUIKitJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and import uikit", () => {
    const uikit = { "ui-kit": { globals: {}, components: {} } };

    importUIKitJson(uikit);

    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalledWith(uikit);
    expect(mockStore.setUiKit).toHaveBeenCalledWith(uikit);
  });

  it("should normalize uikit structure", () => {
    const uikit = { globals: {}, components: {} };

    importUIKitJson(uikit);

    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalledWith({
      "ui-kit": uikit,
    });
    expect(mockStore.setUiKit).toHaveBeenCalledWith({ "ui-kit": uikit });
  });

  it("should throw on validation failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const uikit = { "ui-kit": { invalid: "data" } };
    vi.mocked(validateSchemasModule.validateUIKitJson).mockImplementation(
      () => {
        throw new Error("Validation failed");
      },
    );

    expect(() => importUIKitJson(uikit)).toThrow(
      "Failed to import recursica_ui-kit.json",
    );
    consoleSpy.mockRestore();
  });
});

describe("importJsonFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset validation mocks to pass (not throw) for these tests
    vi.mocked(validateSchemasModule.validateTokensJson).mockReturnValue(
      undefined,
    );
    vi.mocked(validateSchemasModule.validateBrandJson).mockReturnValue(
      undefined,
    );
    vi.mocked(validateSchemasModule.validateUIKitJson).mockReturnValue(
      undefined,
    );
    mockStore.getState.mockReturnValue({
      tokens: {},
      theme: {},
      uikit: {},
    });
    // Mock document.documentElement.style
    if (typeof document !== "undefined") {
      document.documentElement.style.cssText = "";
    }
  });

  it("should import all files when provided", () => {
    const files = {
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { "ui-kit": {} },
    };

    importJsonFiles(files);

    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalled();
    expect(validateSchemasModule.validateBrandJson).toHaveBeenCalled();
    expect(validateSchemasModule.validateUIKitJson).toHaveBeenCalled();
    expect(mockStore.bulkImport).toHaveBeenCalledWith({
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { "ui-kit": {} },
    });
  });

  it("should import only tokens when provided", () => {
    const files = {
      tokens: { tokens: {} },
    };

    importJsonFiles(files);

    expect(validateSchemasModule.validateTokensJson).toHaveBeenCalled();
    expect(validateSchemasModule.validateBrandJson).not.toHaveBeenCalled();
    expect(validateSchemasModule.validateUIKitJson).not.toHaveBeenCalled();
  });

  it("should import files in correct order", () => {
    const files = {
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { "ui-kit": {} },
    };

    importJsonFiles(files);

    // Multi-file import uses bulkImport which handles ordering atomically
    expect(mockStore.bulkImport).toHaveBeenCalledWith({
      tokens: { tokens: {} },
      brand: { brand: {} },
      uikit: { "ui-kit": {} },
    });
  });
});

describe("validateImportedReferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw ImportValidationError for missing palettes", () => {
    const mockState = {
      tokens: { tokens: { colors: {} } },
      theme: { brand: { themes: { light: { palettes: {} } } } },
      uikit: {
        "ui-kit": {
          components: {
            button: {
              variants: {
                styles: {
                  solid: {
                    properties: {
                      colors: {
                        "layer-0": {
                          background: {
                            $type: "color",
                            $value: "{brand.themes.light.palettes.palette-3.500.color.tone}"
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
    mockStore.getState.mockReturnValue(mockState);

    expect(() => {
      validateImportedReferences(mockState.tokens, mockState.theme, mockState.uikit);
    }).toThrowError(ImportValidationError);
  });

  it("should throw ImportValidationError for missing tokens", () => {
    const mockState = {
      tokens: { tokens: { colors: {} } }, // Empty tokens, no scale-05
      theme: { 
        brand: { 
          themes: { 
            light: { 
              palettes: {
                "core-colors": { interactive: { tone: { $type: "color", $value: "{tokens.colors.scale-05.500}" } } }
              }
            } 
          } 
        } 
      },
      uikit: { "ui-kit": {} }
    };
    mockStore.getState.mockReturnValue(mockState);

    expect(() => {
      validateImportedReferences(mockState.tokens, mockState.theme, mockState.uikit);
    }).toThrowError(ImportValidationError);
  });

  it("should not throw if references are valid", () => {
    const mockState = {
      tokens: { tokens: { colors: { "scale-05": { "500": { $type: "color", $value: "#fff" } } } } },
      theme: { 
        brand: { 
          themes: { 
            light: { 
              palettes: {
                "core-colors": { interactive: { tone: { $type: "color", $value: "{tokens.colors.scale-05.500}" } } }
              }
            } 
          } 
        } 
      },
      uikit: {
        "ui-kit": {
          components: {
            button: {
              variants: {
                styles: {
                  solid: {
                    properties: {
                      colors: {
                        "layer-0": {
                          background: {
                            $type: "color",
                            $value: "{brand.themes.light.palettes.core-colors.interactive.tone}"
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

    expect(() => {
      validateImportedReferences(mockState.tokens, mockState.theme, mockState.uikit);
    }).not.toThrow();
  });
});
