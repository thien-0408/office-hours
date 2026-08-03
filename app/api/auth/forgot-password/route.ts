import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-server";
import type { ForgotPasswordPayload } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ForgotPasswordPayload;

  // Always report success, even on backend failure — the response must never reveal
  // whether the email exists (account enumeration), so there's nothing useful to
  // surface to the client either way.
  await apiFetch<void>("/auth/forgot-password", { method: "POST", body }).catch(() => {});

  return NextResponse.json({ ok: true });
}
