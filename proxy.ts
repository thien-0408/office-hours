import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";

const PUBLIC_PATHS = [
  "/",
  "/welcome",
  "/login",
  "/register",
  "/public/office-hours",
  "/forgot-password",
  "/reset-password",
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/public/office-hours/") ||
    pathname.startsWith("/api/auth/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|models|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf)$).*)",
  ],
};
