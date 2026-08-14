import { describe, expect, it } from "vitest";
import { isAuthEntryRoute, shouldShowSignedOutWelcome } from "../client/src/lib/signedOutWelcome";

describe("signed-out Blue Blazer welcome gate", () => {
  it("keeps the required login and account-recovery routes available to unauthenticated visitors", () => {
    expect(isAuthEntryRoute("/login")).toBe(true);
    expect(isAuthEntryRoute("/reset-password?token=example")).toBe(true);
    expect(isAuthEntryRoute("/school-code")).toBe(true);
  });

  it("shows the welcome gate for all other signed-out routes and never blocks authenticated or loading states", () => {
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: false, isLoading: false })).toBe(true);
    expect(shouldShowSignedOutWelcome({ location: "/", isAuthenticated: false, isLoading: false })).toBe(true);
    expect(shouldShowSignedOutWelcome({ location: "/login", isAuthenticated: false, isLoading: false })).toBe(false);
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: true, isLoading: false })).toBe(false);
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: false, isLoading: true })).toBe(false);
  });
});
