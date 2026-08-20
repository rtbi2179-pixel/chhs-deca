import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("shared footer content", () => {
  it("shows the 2026 copyright and requested creator credit", () => {
    const footer = readFileSync(join(process.cwd(), "client/src/components/Footer.tsx"), "utf8");

    expect(footer).toContain("© 2026 Blue Blazer. All rights reserved.");
    expect(footer).toContain("Created by Sahan Mallampati &amp; Ricardo Burciaga, Class of 2027.");
  });
});
