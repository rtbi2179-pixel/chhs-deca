import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const eventsPage = () => readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
const retiredPracticeProvider = ["deca", "demy"].join("");

describe("Events resource links", () => {
  it("does not render the retired third-party practice provider as an event resource or footer link", () => {
    const source = eventsPage().toLowerCase();
    expect(source).not.toContain(retiredPracticeProvider);
    expect(source).not.toContain("https://" + retiredPracticeProvider + ".app");
  });

  it("preserves official DECA resources and the event-resource rendering path", () => {
    const source = eventsPage();
    expect(source).toContain("https://www.deca.org");
    expect(source).toContain("event.resources.map");
  });
});
