import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api-server";
import type { ResetPasswordPayload } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPasswordPayload;

  try {
    await apiFetch<void>("/auth/reset-password", {
      method: "POST",
      body,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: "Password reset failed" }, { status: 502 });
  }
}
