import { cookies } from "next/headers";
import type { Profile } from "@/types/database";

const COOKIE_NAME = "sentry_session";

const DEV_PROFILES: Record<string, Profile> = {
  owner: {
    id: "dev-owner-001",
    github_username: "owner",
    avatar_url: null,
    full_name: "Owner",
    role: "owner",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: "dev-admin-001",
    github_username: "admin",
    avatar_url: null,
    full_name: "Admin",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  developer: {
    id: "dev-dev-001",
    github_username: "developer",
    avatar_url: null,
    full_name: "Developer",
    role: "developer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export async function getSession(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;

  try {
    return JSON.parse(session.value) as Profile;
  } catch {
    return null;
  }
}

export function getDevProfiles() {
  return DEV_PROFILES;
}

export { COOKIE_NAME };
