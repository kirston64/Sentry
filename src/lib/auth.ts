import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/database";
import crypto from "crypto";

const COOKIE_NAME = "sentry_session";
const JWT_SECRET = process.env.JWT_SECRET || "sentry-dev-secret";
const PASSWORD_MAX_AGE_DAYS = 30;

export async function getSession(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    const passwordAge = Date.now() - new Date(user.passwordChangedAt).getTime();
    const passwordExpired = passwordAge > PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const passwordExpiresIn = Math.max(0, PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000 - passwordAge);
    const passwordExpiresInDays = Math.ceil(passwordExpiresIn / (24 * 60 * 60 * 1000));

    return {
      id: user.id,
      github_username: user.username,
      avatar_url: user.avatar,
      full_name: user.fullName,
      role: user.role as UserRole,
      bio: user.bio,
      timezone: user.timezone,
      discord: user.discord,
      telegram: user.telegram,
      github: user.github,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      password_expired: passwordExpired,
      password_expires_in_days: passwordExpiresInDays,
      password_changed_at: user.passwordChangedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}::${ip.split(".").slice(0, 3).join(".")}`;
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 32);
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function getRequestMeta() {
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent") || "unknown";
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : hdrs.get("x-real-ip") || "127.0.0.1";
  return { userAgent, ip };
}

export function getDeviceLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  let browser = "Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return `${browser} on ${os}`;
}

export async function isPasswordExpiringSoon(userId: string): Promise<{ expiring: boolean; daysLeft: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } });
  if (!user) return { expiring: false, daysLeft: 0 };

  const age = Date.now() - new Date(user.passwordChangedAt).getTime();
  const daysLeft = Math.ceil((PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000 - age) / (24 * 60 * 60 * 1000));
  return { expiring: daysLeft <= 7, daysLeft: Math.max(0, daysLeft) };
}

export { COOKIE_NAME, PASSWORD_MAX_AGE_DAYS };
