export const STALE_DYNAMIC_IMPORT_RECOVERY_KEY = "blueblazer:stale-dynamic-import-recovered";

type SessionStore = Pick<Storage, "getItem" | "setItem">;

export function isStaleDynamicImportError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error ?? "");
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|vite:preloaderror/i.test(message);
}

export function recoverStaleDynamicImport({ storage, reload }: { storage: SessionStore; reload: () => void }): boolean {
  if (storage.getItem(STALE_DYNAMIC_IMPORT_RECOVERY_KEY) === "true") return false;

  storage.setItem(STALE_DYNAMIC_IMPORT_RECOVERY_KEY, "true");
  reload();
  return true;
}

export function recoverStaleDynamicImportInBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return recoverStaleDynamicImport({
    storage: window.sessionStorage,
    reload: () => window.location.reload(),
  });
}
