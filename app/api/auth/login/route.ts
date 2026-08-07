import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import { setSessionCookies } from "@/lib/auth/session";
import { encodeMockToken, findMockAccount } from "@/lib/auth/mock-accounts";
import type { LoginPayload, LoginResponse } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;

  try {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body,
    });

    await setSessionCookies({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });

    // Tokens stay server-side in httpOnly cookies; only the user profile goes to the client.
    return NextResponse.json({ user: data.user });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    // API_BASE_URL isn't reachable — the backend doesn't exist yet. Fall back to
    // the seeded accounts in lib/auth/mock-accounts.ts so the app is testable
    // per-role. Remove this branch once /auth/login is actually live.
    const mock = findMockAccount(body.email, body.password);
    if (!mock) {
      return NextResponse.json({ message: "Login failed" }, { status: 502 });
    }

    await setSessionCookies({
      accessToken: encodeMockToken(mock.user),
      refreshToken: encodeMockToken(mock.user),
      expiresIn: 60 * 60 * 24,
    });

    return NextResponse.json({ user: mock.user });
  }
}
