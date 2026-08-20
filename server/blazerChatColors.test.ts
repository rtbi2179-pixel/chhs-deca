import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blazer chat and yellow color treatment", () => {
  it("keeps Direct Messages blue regardless of the current page action color", () => {
    const chat = readFileSync(join(process.cwd(), "client/src/components/DirectMessagesPanel.tsx"), "utf8");
    const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

    expect(chat).toContain('data-blueblazer-chat="true"');
    expect(css).toContain('[data-blueblazer-chat="true"] { --blazer-page-action: var(--blazer-blue)');
    expect(css).toContain('[data-blueblazer-chat="true"] button[class*="bg-blue-"]');
  });

  it("uses transparent color mixes for Blazer yellow actions instead of opaque yellow fills", () => {
    const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

    expect(css).toContain('color-mix(in srgb, var(--blazer-yellow) 72%, transparent)');
    expect(css).toContain('color-mix(in srgb, var(--blazer-yellow) 68%, transparent)');
    expect(css).not.toContain('button[class*="bg-yellow-"] { background-color: var(--blazer-yellow)');
  });
});
