import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (...parts: string[]) => readFileSync(path.join(root, ...parts), "utf8");

describe("phone-sized Blue Blazer experience", () => {
  it("keeps the mobile navigation drawer and controls touch-friendly", () => {
    const sidebar = source("client", "src", "components", "SidebarNavigation.tsx");
    expect(sidebar).toContain("safe-area-inset-bottom");
    expect(sidebar).toContain("min-h-11 min-w-11");
  });

  it("uses a full-width mobile chat panel and safe-area chat trigger", () => {
    const chat = source("client", "src", "components", "DirectMessagesPanel.tsx");
    expect(chat).toContain("bottom-[calc(1rem+env(safe-area-inset-bottom))]");
    expect(chat).toContain("h-[100dvh] w-full");
  });

  it("keeps dense practice and market controls usable on narrow screens", () => {
    const practice = source("client", "src", "pages", "PracticeQuestions.tsx");
    const marketNav = source("client", "src", "components", "BbxMarketNavigation.tsx");
    const styles = source("client", "src", "index.css");
    expect(practice).toContain("grid w-full grid-cols-2 gap-2");
    expect(marketNav).toContain("bbx-market-tabs");
    expect(marketNav).toContain("min-h-11 shrink-0");
    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain("min-width: 38rem");
    expect(styles).toContain(".blueblazer-mobile-drawer a");
    expect(styles).toContain("[data-atmosphere=\"practice\"] select");
  });
});
