import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/database";

const COOKIE_NAME = "sentry_session";
const JWT_SECRET = process.env.JWT_SECRET || "sentry-dev-secret";

export async function getSession(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    return {
      id: user.id,
      github_username: user.username,
      avatar_url: user.avatar,
      full_name: user.fullName,
      role: user.role as UserRole,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export { COOKIE_NAME };
