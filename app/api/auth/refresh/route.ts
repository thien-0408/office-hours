import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/lib/auth/session";

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const data = await apiFetch<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });

    await setSessionCookies(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await clearSessionCookies();
    const status = err instanceof ApiError ? err.status : 502;
    return NextResponse.json({ message: "Session expired" }, { status });
  }
}
