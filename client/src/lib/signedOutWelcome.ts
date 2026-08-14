export const AUTH_ENTRY_ROUTES = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/school-code",
  "/2fa",
]);

export function isAuthEntryRoute(location: string) {
  return AUTH_ENTRY_ROUTES.has(location.split("?")[0] ?? location);
}

export function shouldShowSignedOutWelcome({ location, isAuthenticated, isLoading }: { location: string; isAuthenticated: boolean; isLoading: boolean }) {
  return !isLoading && !isAuthenticated && !isAuthEntryRoute(location);
}
