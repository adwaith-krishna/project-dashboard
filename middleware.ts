import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Let Next.js internal requests, public assets, and api routes pass through
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.startsWith("/favicon.ico") ||
    path.endsWith(".svg") ||
    path.endsWith(".png")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("dashboard-session")?.value;
  let session: { id: string; email: string; role: "ADMIN" | "CLIENT"; project_id: string | null } | null = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie));
    } catch (e) {
      console.error("Failed to parse session cookie in middleware:", e);
    }
  }

  // Redirect root page to correct space
  if (path === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  // Handle Login, Signup and Reset Password page routing (public routes)
  if (path === "/login" || path === "/signup" || path === "/reset-password") {
    if (session) {
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All other pages require authentication
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin space guards
  if (path.startsWith("/admin")) {
    if (session.role !== "ADMIN") {
      // Access denied for non-admins
      return NextResponse.redirect(new URL("/login?error=denied", request.url));
    }
  }

  // Client portal space guards
  if (path.startsWith("/portal")) {
    if (session.role !== "CLIENT" || !session.project_id) {
      // Access denied for non-clients or unassigned users
      return NextResponse.redirect(new URL("/login?error=denied", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
