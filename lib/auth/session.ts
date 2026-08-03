import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "oh_access_token";
export const REFRESH_TOKEN_COOKIE = "oh_refresh_token";

const isProd = process.env.NODE_ENV === "production";

export async function setSessionCookies(params: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}) {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE, params.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: params.expiresIn,
  });

  // Scoped to /api/auth so it's only ever sent to the refresh/logout routes.
  store.set(REFRESH_TOKEN_COOKIE, params.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete({ name: REFRESH_TOKEN_COOKIE, path: "/api/auth" });
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}
