/**
 * Universal environment variable resolver
 * Supports Next.js, Vite, Webpack Mix, and CRA (Create React App)
 *
 * - CRA: uses STATIC_INLINE_MAP (build-time inlined REACT_APP_* variables)
 * - Next.js / Webpack Mix: uses process.env
 * - Vite: uses import.meta.env
 */

type AnyDict = Record<string, any>;

const parseMaybeBoolean = (v?: string) => {
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
};

/**
 * STATIC_INLINE_MAP
 * CRA replaces process.env.REACT_APP_* at build time.
 * We list all keys here to ensure CRA will inline them.
 */
const STATIC_INLINE_MAP: AnyDict = {
  RUDDERSTACK_KEY: process.env.REACT_APP_RUDDERSTACK_KEY,
  RUDDERSTACK_URL: process.env.REACT_APP_RUDDERSTACK_URL,
  RUDDERSTACK_GAME_ID: process.env.REACT_APP_RUDDERSTACK_GAME_ID,
  RUDDERSTACK_PROJECT_ID: process.env.REACT_APP_RUDDERSTACK_PROJECT_ID,
  RUDDERSTACK_LOG: process.env.REACT_APP_RUDDERSTACK_LOG,
  RUDDERSTACK_TRACKED_PAGES: process.env.REACT_APP_RUDDERSTACK_TRACKED_PAGES,
  // Nếu cần thêm keys khác cho CRA, liệt kê tại đây:
  RUDDERSTACK_ENV: process.env.REACT_APP_RUDDERSTACK_ENV,
  RUDDERSTACK_DEBUG: process.env.REACT_APP_RUDDERSTACK_DEBUG,
};

/**
 * Hàm đọc env đa môi trường
 */
export function getEnvVar(name: string): string | boolean | undefined {
  // 1. CRA: static inline
  if (STATIC_INLINE_MAP[name] !== undefined && STATIC_INLINE_MAP[name] !== "") {
    return parseMaybeBoolean(STATIC_INLINE_MAP[name]);
  }

  // 2. Vite
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env) {
      // Safely access the env values in Vite (avoids TS errors)
      const viteEnv: AnyDict = (import.meta as AnyDict).env || {};
      const viteVal = viteEnv[`VITE_${name}`] ?? viteEnv[name];
      if (viteVal !== undefined) return parseMaybeBoolean(viteVal);
    }
  } catch {
    // Ignore errors in Vite
  }

  // 3. Next.js / Webpack Mix / Node
  if (typeof process !== "undefined" && process.env) {
    const val =
      process.env[`NEXT_PUBLIC_${name}`] ??
      process.env[`VITE_${name}`] ??
      process.env[name];
    if (val !== undefined) return parseMaybeBoolean(val);
  }

  // 4. CRA fallback từ window injector (nếu người dùng có tự setup)
  if (typeof window !== "undefined") {
    const w = (window as AnyDict).__RUDDERSTACK_CONFIG__;
    if (w?.[name] !== undefined) return parseMaybeBoolean(w[name]);
  }

  return undefined;
}

/**
 * Helper: parse comma-separated list
 */
export function getEnvList(name: string): string[] {
  const raw = getEnvVar(name);
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
