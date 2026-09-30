import { lazy } from "react";

/**
 * Wraps dynamic imports with automatic retry logic and single-attempt hard reload
 * to seamlessly recover from failed chunk fetches (e.g. new deployments, dev server restarts, network glitches).
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} componentImport
 * @param {string} [name] - Optional component name for tracking reload attempts
 */
export const lazyWithRetry = (componentImport, name = "module") =>
  lazy(async () => {
    const storageKey = `retry_reload_${name}`;
    const hasForceReloaded = sessionStorage.getItem(storageKey) === "true";

    try {
      const module = await componentImport();
      // Reset the reload flag on successful load
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      // If we haven't tried reloading the page once, do it now to pull fresh assets/chunks
      if (!hasForceReloaded && typeof window !== "undefined") {
        sessionStorage.setItem(storageKey, "true");
        window.location.reload();
        // Return a pending promise while the page reloads
        return new Promise(() => {});
      }

      // If we've already reloaded once and it still fails, reset the flag and throw so ErrorBoundary can handle it
      sessionStorage.removeItem(storageKey);
      throw error;
    }
  });

export default lazyWithRetry;
