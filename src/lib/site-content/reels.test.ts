import { describe, expect, it } from "vitest";
import indexHtml from "../../site/index.html?raw";

// The owner asked for the Home page to drop the Reels gallery and the
// appointment/contact block that used to sit right after the hero.
describe("home page sections", () => {
  it("has no Reels gallery", () => {
    expect(indexHtml).not.toContain("data-reels");
    expect(indexHtml).not.toContain("h-reels");
    expect(indexHtml).not.toContain("js/reels.js");
  });

  it("has no appointment section after the hero", () => {
    expect(indexHtml).not.toContain('id="appointment"');
    expect(indexHtml).not.toContain("h-reach");
    expect(indexHtml).not.toContain("x-reach");
    const hero = indexHtml.indexOf('class="x-hero"');
    const next = indexHtml.indexOf("<section", hero + 1);
    expect(indexHtml.slice(next, next + 60)).toContain("x-about");
  });
});
