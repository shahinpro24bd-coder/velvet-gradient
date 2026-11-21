import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PAGES = ["index", "about", "service", "appoinment", "contact"];

describe("slim icon kit", () => {
  const css = readFileSync(resolve("public/icons.css"), "utf8");

  it("has a glyph for every icon the pages show", () => {
    for (const page of PAGES) {
      const html = readFileSync(resolve("src/site", `${page}.html`), "utf8");
      const names = new Set(html.match(/\bfa-[a-z0-9-]+/g) ?? []);
      for (const name of names) {
        if (["fa-solid", "fa-regular", "fa-brands"].includes(name)) continue;
        expect(css, `${page}.html uses ${name}`).toMatch(new RegExp(`\\.${name}::?before`));
      }
    }
  });

  it("every page loads the slim kit, not the full one", () => {
    for (const page of PAGES) {
      const html = readFileSync(resolve("src/site", `${page}.html`), "utf8");
      expect(html).toContain('href="/icons.css"');
      expect(html).not.toContain("icons-local.css");
    }
    for (const font of ["fa-solid-900", "fa-brands-400"]) {
      expect(existsSync(resolve("public/fonts", `${font}.sub.woff2`))).toBe(true);
    }
  });
});
