import { describe, expect, it } from "vitest";
import { isDesignatedOwner, resolveDesignatedOwnerSchoolScope } from "./ownerSchoolScope";

describe("designated owner school scope", () => {
  it("provides Sahan and Ricardo a default chapter scope when legacy accounts have no school code", () => {
    const sahan = { openId: "sahan-owner", name: "Sahan Mallampati", schoolCode: null, selectedSchoolCode: null };
    const ricardo = { openId: "ricardo-owner", name: "Ricardo Burciaga", schoolCode: null, selectedSchoolCode: null };

    expect(isDesignatedOwner(sahan as any)).toBe(true);
    expect(resolveDesignatedOwnerSchoolScope(sahan as any)).toMatchObject({ schoolCode: "1234567", selectedSchoolCode: "1234567" });
    expect(resolveDesignatedOwnerSchoolScope(ricardo as any)).toMatchObject({ schoolCode: "1234567", selectedSchoolCode: "1234567" });
  });

  it("does not grant a school scope to ordinary members and preserves an existing selected scope", () => {
    const member = { openId: "member", name: "Chapter Member", schoolCode: null, selectedSchoolCode: null };
    const scopedRicardo = { openId: "ricardo-owner", name: "RicardoB", schoolCode: "1234567", selectedSchoolCode: "TEST001" };

    expect(resolveDesignatedOwnerSchoolScope(member as any)).toEqual(member);
    expect(resolveDesignatedOwnerSchoolScope(scopedRicardo as any)).toEqual(scopedRicardo);
  });
});
