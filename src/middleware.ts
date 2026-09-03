import { auth } from "@/auth.config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = 
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/login" || 
    nextUrl.pathname === "/manifest.json" || 
    nextUrl.pathname.startsWith("/icons/") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname === "/favicon.ico";

  if (isApiAuthRoute) return NextResponse.next();

  // Handle temporary session expiration on browser close
  const rememberMe = (req.auth?.user as any)?.rememberMe;
  const hasSessionActive = req.cookies.has("session_active");
  if (isLoggedIn && rememberMe === false && !hasSessionActive) {
    let response;
    if (nextUrl.pathname === "/login") {
      response = NextResponse.next();
    } else {
      response = NextResponse.redirect(new URL("/login", req.url));
    }
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    response.cookies.delete("next-auth.callback-url");
    response.cookies.delete("__Secure-next-auth.callback-url");
    response.cookies.delete("next-auth.pkce.code_verifier");
    return response;
  }

  if (isPublicRoute) {
    if (isLoggedIn && nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // RBAC route protection
  if (nextUrl.pathname.startsWith("/dashboard/super-admin") && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (nextUrl.pathname.startsWith("/dashboard/operator") && userRole !== "OPERATOR" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (nextUrl.pathname.startsWith("/dashboard/pengasuh") && userRole !== "PENGASUH") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (nextUrl.pathname.startsWith("/dashboard/mustahiq") && userRole !== "MUSTAHIQ") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (nextUrl.pathname.startsWith("/dashboard/munawib")) {
    if (nextUrl.pathname.startsWith("/dashboard/munawib/scan") || nextUrl.pathname.startsWith("/dashboard/munawib/absensi")) {
      if (userRole !== "MUNAWIB" && userRole !== "MUSTAHIQ") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    } else {
      if (userRole !== "MUNAWIB") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
    }
  }
  if (nextUrl.pathname.startsWith("/dashboard/bendahara") && userRole !== "BENDAHARA") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (nextUrl.pathname.startsWith("/dashboard/wali") && userRole !== "WALI_SANTRI") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
