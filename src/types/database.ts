export type UserRole = "owner" | "developer" | "admin";

export interface Profile {
  id: string;
  github_username: string | null;
  avatar_url: string | null;
  full_name: string | null;
  role: UserRole;
  bio: string | null;
  timezone: string | null;
  discord: string | null;
  telegram: string | null;
  github: string | null;
  created_at: string;
  updated_at: string;
  password_expired: boolean;
  password_expires_in_days: number;
  password_changed_at: string;
}

export interface Project {
  id: string;
  name: string;
  github_repo: string;
  description: string | null;
  server_ip: string | null;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: Profile;
}
