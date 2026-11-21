import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getContentSnapshot } from "./server";
import { collectSiteContent } from "./transform";

const home = readFileSync(resolve("src/site/index.html"), "utf8");

describe("homepage translations", () => {
  it("carries Arabic for every worded string on the homepage", async () => {
    const snapshot = await getContentSnapshot();
    const { texts } = collectSiteContent(home);
    const worded = texts.filter((t) => /[a-z]{3}/i.test(t.value) && !/^(info@|@dr\.lama_gassan)/.test(t.value));
    expect(worded.length).toBeGreaterThan(150);
    for (const t of worded) {
      expect(snapshot.langs.ar[t.key], t.value).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("keeps Before / After labels off the comparison photo", () => {
    const start = home.indexOf("<div class=\"before-after-slider\"");
    const end = home.indexOf("</div>\n                    <span class=\"x-ba__vertical\"", start);
    const slider = home.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(slider).not.toMatch(/>\s*(Before|After)\s*</);
    expect(home).toContain('data-ba-set="100"');
    expect(home).toContain('data-ba-set="0"');
  });
});
