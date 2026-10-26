import type { RefreshResponse } from "@/lib/auth/types";

const ACCESS_TOKEN_KEY = "oh_access_token";
const REFRESH_TOKEN_KEY = "oh_refresh_token";

/** Fired on `window` when the stored session is cleared because it can no longer be refreshed. */
export const SESSION_EXPIRED_EVENT = "oh:session-expired";

// localStorage is browser-only and may throw (private mode, blocked storage), so
// every access is guarded and treated as "no session" on failure.
function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: Pick<RefreshResponse, "accessToken" | "refreshToken">) {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // Storage unavailable: the session lasts only until the next page load.
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing stored to clear.
  }
}
