import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/analyze", "/ask", "/history", "/legal-check"];
const authRoutes = ["/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get token from httpOnly cookie
  const token = request.cookies.get("token")?.value;

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

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
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