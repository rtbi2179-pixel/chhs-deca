import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Home-page link composition", () => {
  it("uses a single native anchor for each authenticated sidebar destination", () => {
    const sidebar = readProjectFile("client/src/components/SidebarNavigation.tsx");

    expect(sidebar).toContain("handleInternalLinkClick");
    expect(sidebar).toContain("<a");
    expect(sidebar).not.toContain("<Link");
  });
});
