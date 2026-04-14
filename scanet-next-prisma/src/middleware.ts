import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = [
    "/auth",
    "/forgot-password",
    "/reset-password",
    "/join-event",
    "/api/auth",
    "/api/join-event",
    "/api/email/track",
    "/api/email/process-scheduled",
  ];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Static files and API routes that handle their own auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies (support both NextAuth v4 and v5 cookie names)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // If no session and trying to access protected route, redirect to auth
  if (!sessionToken && !isPublicPath) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If has session and trying to access auth pages, redirect to home
  if (
    sessionToken &&
    (pathname === "/auth" || pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
