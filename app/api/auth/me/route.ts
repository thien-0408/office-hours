import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import {
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
} from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function GET() {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const user = await apiFetch<AuthUser>("/users/me", { accessToken });
    return NextResponse.json({ user });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
  }

  // Access token expired — try one refresh, then retry the profile fetch.
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSessionCookies();
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const refreshed = await apiFetch<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    await setSessionCookies(refreshed);
    accessToken = refreshed.accessToken;

    const user = await apiFetch<AuthUser>("/users/me", { accessToken });
    return NextResponse.json({ user });
  } catch {
    await clearSessionCookies();
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
