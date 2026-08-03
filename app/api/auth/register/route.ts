import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import type { AuthUser, RegisterPayload } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;

  try {
    const user = await apiFetch<AuthUser>("/auth/register", {
      method: "POST",
      body,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: "Registration failed" }, { status: 502 });
  }
}
