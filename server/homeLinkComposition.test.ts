import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Home-page link composition", () => {
  it("uses Wouter Link as the anchor element in the authenticated sidebar shell", () => {
    const sidebar = readProjectFile("client/src/components/SidebarNavigation.tsx");

    expect(sidebar).toContain("<Link");
    expect(sidebar).not.toMatch(/<a\b/);
  });
});
