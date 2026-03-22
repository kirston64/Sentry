import { NextResponse } from "next/server";
import { COOKIE_NAME, getDevProfiles } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function POST(request: Request) {
  const { username, role } = await request.json();

  if (!username || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const profiles = getDevProfiles();
  const template = profiles[role as UserRole];
  if (!template) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const profile = {
    ...template,
    github_username: username,
    full_name: username,
  };

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, JSON.stringify(profile), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
