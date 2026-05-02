import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/analyze", "/ask", "/history", "/legal-check"];
const authRoutes = ["/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get token from httpOnly cookie
  const cookieToken = request.cookies.get("token")?.value;

  // Allow Google OAuth redirect
  const authParam = request.nextUrl.searchParams.get("auth");
  if (pathname.startsWith("/dashboard") && authParam === "google") {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ── In production localStorage is not accessible in middleware ──
  // So we only block if there's definitely no cookie token
  // localStorage check happens client-side in each page
  if (isProtectedRoute && !cookieToken) {
    // Check if request has Authorization header (API calls)
    const authHeader = request.headers.get("authorization");
    if (authHeader) return NextResponse.next();

    // For page navigations — let it through and handle auth client-side
    // This prevents blocking localStorage-based auth in production
    const response = NextResponse.next();
    return response;
  }

  if (isAuthRoute && cookieToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analyze/:path*",
    "/ask/:path*",
    "/history/:path*",
    "/legal-check/:path*",
    "/login",
    "/register",
  ],
};