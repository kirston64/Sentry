import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "sentry_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sentry-dev-secret"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthPage = request.nextUrl.pathname === "/";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isStatusPage = request.nextUrl.pathname === "/status";

  if (isApiRoute || isStatusPage) return NextResponse.next();

  let validSession = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      validSession = true;
    } catch {
      // Invalid/expired token — clear it
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  if (!validSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (validSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
