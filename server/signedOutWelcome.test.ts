import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isAuthEntryRoute, SIGNED_OUT_WELCOME_SESSION_KEY, shouldShowSignedOutWelcome } from "../client/src/lib/signedOutWelcome";

describe("signed-out Blue Blazer welcome gate", () => {
  it("keeps the required login and account-recovery routes available to unauthenticated visitors", () => {
    expect(isAuthEntryRoute("/login")).toBe(true);
    expect(isAuthEntryRoute("/reset-password?token=example")).toBe(true);
    expect(isAuthEntryRoute("/school-code")).toBe(true);
  });

  it("shows the welcome page at the start of every fresh browser session while leaving account-entry and loading states alone", () => {
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: false, isLoading: false })).toBe(true);
    expect(shouldShowSignedOutWelcome({ location: "/", isAuthenticated: false, isLoading: false })).toBe(true);
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: false, isLoading: false, hasSeenThisSession: true })).toBe(false);
    expect(shouldShowSignedOutWelcome({ location: "/login", isAuthenticated: false, isLoading: false })).toBe(false);
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: true, isLoading: false })).toBe(true);
    expect(shouldShowSignedOutWelcome({ location: "/practice", isAuthenticated: false, isLoading: true })).toBe(false);
  });

  it("records the welcome gate once using the initial route instead of re-evaluating on internal navigation", () => {
    const app = readFileSync(join(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(app).toContain("const [sessionStartLocation] = useState(location)");
    expect(app).toContain("window.sessionStorage.getItem(SIGNED_OUT_WELCOME_SESSION_KEY)");
    expect(app).toContain("window.sessionStorage.setItem(SIGNED_OUT_WELCOME_SESSION_KEY, \"true\")");
    expect(app).toContain("location: sessionStartLocation");
    expect(app).toContain("const showWelcomeGate = welcomeGate.shouldShow");
    expect(app).toContain("isAuthenticated={Boolean(user)}");
    expect(app).toContain("onContinue={dismissWelcomeGate}");
    expect(SIGNED_OUT_WELCOME_SESSION_KEY).toBe("blueblazer:signed-out-welcome-seen");
  });

  it("provides signed-in members an entry action while keeping signed-out visitors on secure sign-in", () => {
    const welcome = readFileSync(join(process.cwd(), "client/src/components/SignedOutWelcome.tsx"), "utf8");

    expect(welcome).toContain("isAuthenticated = false");
    expect(welcome).toContain("onContinue?.()");
    expect(welcome).toContain("if (!isAuthenticated) setLocation(\"/login\")");
    expect(welcome).toContain("Enter Blue Blazer");
    expect(welcome).toContain("Sign in to Blue Blazer");
  });
});
