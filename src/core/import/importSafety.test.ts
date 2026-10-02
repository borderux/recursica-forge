import { describe, it, expect } from "vitest";
import tokensJson from "../../../recursica_tokens.json";
import brandJson from "../../../recursica_brand.json";
import uikitJson from "../../../recursica_ui-kit.json";
import { assertSafeImport, findUnsafeContent } from "./importSafety";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

describe("importSafety", () => {
  it("accepts the bundled files", () => {
    expect(findUnsafeContent(clone(tokensJson))).toEqual([]);
    expect(findUnsafeContent(clone(brandJson))).toEqual([]);
    expect(findUnsafeContent(clone(uikitJson))).toEqual([]);
  });

  it("rejects a name that would end a CSS rule", () => {
    const json = { brand: { palettes: { "x:1}*{background:url(https://evil.example)}a{--y": {} } } };
    expect(() => assertSafeImport(json, "Brand file")).toThrow(/invalid name/);
  });

  it("rejects names with dots or braces", () => {
    expect(findUnsafeContent({ "a.b": {} })).toHaveLength(1);
    expect(findUnsafeContent({ "{a}": {} })).toHaveLength(1);
  });

  it("rejects values that load remote content or end a declaration", () => {
    for (const bad of ["url(https://evil.example/p)", "red; background: blue", "</style>", "a\\62", "@import 'x'"]) {
      expect(findUnsafeContent({ c: { $value: bad } })).toHaveLength(1);
    }
    expect(findUnsafeContent({ c: { $value: ["Inter", "url(x)"] } })).toHaveLength(1);
    expect(findUnsafeContent({ c: { $value: { color: "url(x)" } } })).toHaveLength(1);
  });

  it("allows references and stray braces only as references", () => {
    expect(findUnsafeContent({ c: { $value: "{tokens.colors.gray.100}" } })).toEqual([]);
    expect(findUnsafeContent({ c: { $value: "{a} } b{" } })).toHaveLength(1);
  });

  it("does not check names inside $extensions", () => {
    expect(findUnsafeContent({ c: { $value: "x", $extensions: { "com.google.fonts": { url: "https://fonts.googleapis.com/css2" } } } })).toEqual([]);
  });

  it("removes __proto__ keys without changing the prototype", () => {
    const json = JSON.parse('{"a": {"__proto__": {"$value": "polluted"}, "b": {"$value": "1"}}}');
    expect(findUnsafeContent(json)).toEqual([]);
    expect(Object.prototype.hasOwnProperty.call(json.a, "__proto__")).toBe(false);
    expect("$value" in json.a).toBe(false);
    expect(({} as any).$value).toBeUndefined();
  });
});
