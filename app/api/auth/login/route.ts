import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import { setSessionCookies } from "@/lib/auth/session";
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
    return NextResponse.json({ message: "Login failed" }, { status: 502 });
  }
}
