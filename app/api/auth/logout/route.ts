import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-server";
import { clearSessionCookies, getAccessToken } from "@/lib/auth/session";

export async function POST() {
  const accessToken = await getAccessToken();

  if (accessToken) {
    // Best-effort server-side blacklist; a failure here shouldn't block local logout.
    await apiFetch("/auth/logout", {
      method: "POST",
      accessToken,
    }).catch(() => {});
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
