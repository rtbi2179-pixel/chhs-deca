import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin Mode visual treatment", () => {
  it("keeps the active-state perimeter visible without the former high-intensity lighting", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/contexts/AdminModeContext.tsx"), "utf8");

    expect(source).toContain('rgba(59,130,246,0.035)');
    expect(source).toContain('inset 0 0 42px rgba(59,130,246,0.18)');
    expect(source).toContain('1px solid rgba(96,165,250,0.32)');
    expect(source).not.toContain('inset 0 0 80px rgba(59,130,246,0.5)');
  });
});
