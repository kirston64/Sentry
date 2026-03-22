import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "sentry_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME);
  const isAuthPage = request.nextUrl.pathname === "/";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isStatusPage = request.nextUrl.pathname === "/status";

  if (isApiRoute || isStatusPage) return NextResponse.next();

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
