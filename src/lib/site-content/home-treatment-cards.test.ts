import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getContentSnapshot } from "./server";
import { textKey } from "./keys";

const home = readFileSync(resolve("src/site/index.html"), "utf8");
const gridStart = home.indexOf('<div class="s-grid s-grid--home" data-tgrid>');
const gridEnd = home.indexOf('<div class="x-treat__foot"', gridStart);
const gridHtml = home.slice(gridStart, gridEnd);
const cards = gridHtml.match(/<article class="s-card"[^>]*>[\s\S]*?<\/article>/g) ?? [];

function cardTexts(card: string): string[] {
  return [...card.matchAll(/>([^<>]+)</g)]
    .map((m) => m[1]!.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
    .filter((t) => t && !/^\d+$/.test(t));
}

describe("homepage treatment cards", () => {
  it("uses the square atelier cards instead of the old arched tiles", () => {
    expect(gridStart).toBeGreaterThan(-1);
    expect(gridEnd).toBeGreaterThan(gridStart);
    expect(cards).toHaveLength(12);
    expect(home).not.toContain('class="x-tgrid"');
    expect(home).not.toContain("x-tcard__link");
  });

  it("keeps the filter counts in sync with the card categories", () => {
    const cosmetic = cards.filter((c) => c.includes('data-cat="cosmetic"')).length;
    const restorative = cards.filter((c) => c.includes('data-cat="restorative"')).length;
    expect([cosmetic, restorative]).toEqual([8, 4]);
    expect(home).toContain('<span>All</span><b>12</b>');
    expect(home).toContain('<span>Cosmetic</span><b>8</b>');
    expect(home).toContain('<span>Restorative</span><b>4</b>');
  });

  it("carries Arabic for every string the cards show", async () => {
    const snapshot = await getContentSnapshot();
    const seen = new Set<string>();
    for (const card of cards) {
      for (const text of cardTexts(card)) {
        const key = textKey(text);
        expect(snapshot.langs.en[key], text).toBeTruthy();
        if (!seen.has(key)) {
          seen.add(key);
          expect(snapshot.langs.ar[key], text).toMatch(/[\u0600-\u06FF]/);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(30);
  });
});
