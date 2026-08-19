export const AUTH_ENTRY_ROUTES = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/school-code",
  "/2fa",
]);
export const SIGNED_OUT_WELCOME_SESSION_KEY = "blueblazer:signed-out-welcome-seen";

export function isAuthEntryRoute(location: string) {
  return AUTH_ENTRY_ROUTES.has(location.split("?")[0] ?? location);
}

export function shouldShowSignedOutWelcome({ location, isAuthenticated, isLoading, hasSeenThisSession = false }: { location: string; isAuthenticated: boolean; isLoading: boolean; hasSeenThisSession?: boolean }) {
  return !hasSeenThisSession && !isLoading && !isAuthenticated && !isAuthEntryRoute(location);
}
