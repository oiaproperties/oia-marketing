import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  ADMIN: [], // empty = allow all
  CONTENT_CREATOR: ["/agents/content", "/ai", "/tasks"],
  SEO_SPECIALIST: ["/agents/seo", "/ai", "/tasks"],
  SOCIAL_MANAGER: ["/agents/social", "/ai", "/tasks"],
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token?.role as string) || "CONTENT_CREATOR";
    const pathname = req.nextUrl.pathname;

    // Admin sees everything
    if (role === "ADMIN") return NextResponse.next();

    const allowed = ROLE_ALLOWED_PATHS[role] || [];

    // Always allow API routes and auth pages
    if (pathname.startsWith("/api/") || pathname.startsWith("/login")) {
      return NextResponse.next();
    }

    // Allow if the path starts with one of the allowed prefixes
    const isAllowed = allowed.some(p => pathname === p || pathname.startsWith(p + "/"));
    if (isAllowed) return NextResponse.next();

    // Redirect to their default page
    const defaultPage = allowed[0] || "/login";
    return NextResponse.redirect(new URL(defaultPage, req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
