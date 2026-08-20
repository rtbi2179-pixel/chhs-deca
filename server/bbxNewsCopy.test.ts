import { describe, expect, it } from "vitest";
import { hideBbxMagnitude } from "../client/src/lib/bbxNewsCopy";

describe("Blue's News magnitude-safe copy", () => {
  it("removes the legacy sampled-magnitude clause while preserving the market learning context", () => {
    expect(hideBbxMagnitude("The structured simulated event points to higher near-term expectations, with a sampled magnitude of 20.52%.")).toBe("The structured simulated event points to higher near-term expectations.");
    expect(hideBbxMagnitude("The structured simulated event points to lower near-term expectations, with a sampled magnitude of 5%.")).toBe("The structured simulated event points to lower near-term expectations.");
  });

  it("leaves ordinary article wording unchanged", () => {
    expect(hideBbxMagnitude("A large contract can improve expected future revenue.")).toBe("A large contract can improve expected future revenue.");
  });
});
