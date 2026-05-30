import type { UserRole } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  developer: 0,
  admin: 1,
  owner: 2,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── Section-based access ────────────────────────────────────────────────────

export type AppSection =
  | "dashboard" | "servers" | "repositories" | "team" | "tasks" | "deploys"
  | "incidents" | "logs" | "chat" | "ai" | "schedule" | "backups" | "changelog"
  | "wiki" | "runbooks" | "reports" | "log-alerts" | "activity" | "console"
  | "settings" | "work";

// Sections allowed per specialty key (developer role, no admin/owner bypass needed here)
const SPECIALTY_SECTIONS: Record<string, Set<AppSection>> = {
  // === Управление проектом ===
  ceo: new Set([
    "dashboard","servers","repositories","team","tasks","deploys","incidents",
    "logs","chat","ai","schedule","backups","changelog","wiki","runbooks",
    "reports","log-alerts","activity","console","settings",
  ]),
  pm: new Set([
    "dashboard","tasks","incidents","deploys","team","reports","runbooks",
    "schedule","activity","wiki","chat","changelog","repositories",
  ]),
  hr: new Set([
    "dashboard","tasks","team","reports","schedule","activity","wiki","chat","changelog",
  ]),

  // === Разработка ===
  tech_lead: new Set([
    "dashboard","servers","repositories","team","tasks","deploys","incidents",
    "logs","chat","ai","schedule","backups","changelog","wiki","runbooks",
    "reports","log-alerts","activity","console",
  ]),
  senior_dev: new Set([
    "dashboard","servers","tasks","incidents","deploys","logs","team","reports",
    "runbooks","log-alerts","console","wiki","chat","repositories","backups","changelog","ai",
  ]),
  middle_dev: new Set([
    "dashboard","servers","tasks","incidents","deploys","logs","team","runbooks",
    "console","wiki","chat","repositories","changelog",
  ]),
  junior_dev: new Set([
    "dashboard","tasks","runbooks","team","wiki","chat","changelog",
  ]),
  devops: new Set([
    "dashboard","servers","tasks","incidents","deploys","logs","team","reports",
    "runbooks","log-alerts","schedule","activity","console","wiki","chat",
    "repositories","backups","changelog","ai",
  ]),
  discord_dev: new Set([
    "dashboard","tasks","deploys","team","wiki","chat","changelog","ai",
  ]),
  launcher_dev: new Set([
    "dashboard","tasks","deploys","team","wiki","chat","changelog",
  ]),

  // === Геймдизайн и контент ===
  lead_gd: new Set([
    "dashboard","tasks","team","reports","wiki","chat","changelog",
  ]),
  senior_gd: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  narrative_designer: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  junior_gd: new Set([
    "dashboard","tasks","wiki","chat","changelog",
  ]),
  rp_consultant: new Set([
    "dashboard","tasks","team","wiki","chat",
  ]),

  // === 3D и визуальный контент ===
  art_director: new Set([
    "dashboard","tasks","team","reports","wiki","chat","changelog",
  ]),
  env_artist: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  vehicle_artist: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  uiux_designer: new Set([
    "dashboard","tasks","team","wiki","chat","changelog","ai",
  ]),
  animator: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  texture_artist: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),

  // === Маркетинг и PR ===
  head_marketing: new Set([
    "dashboard","tasks","team","reports","wiki","chat","changelog",
  ]),
  smm: new Set([
    "dashboard","tasks","chat","changelog",
  ]),
  copywriter: new Set([
    "dashboard","tasks","chat","changelog","wiki",
  ]),
  influencer_manager: new Set([
    "dashboard","tasks","chat","changelog",
  ]),
  video_editor: new Set([
    "dashboard","tasks","chat","changelog",
  ]),

  // === Администрирование и поддержка ===
  head_admin: new Set([
    "dashboard","servers","tasks","incidents","logs","team","reports","runbooks",
    "log-alerts","schedule","activity","wiki","chat","changelog","backups",
  ]),
  tech_admin: new Set([
    "dashboard","servers","tasks","incidents","logs","team","runbooks",
    "log-alerts","console","wiki","chat","changelog",
  ]),
  moderator: new Set([
    "dashboard","incidents","team","chat","changelog",
  ]),
  support: new Set([
    "dashboard","incidents","team","chat",
  ]),
  community_manager: new Set([
    "dashboard","tasks","team","reports","chat","changelog","wiki",
  ]),
  qa: new Set([
    "dashboard","servers","tasks","incidents","logs","team","reports",
    "runbooks","wiki","chat","changelog",
  ]),

  // === Технические теги (обратная совместимость) ===
  lua: new Set(["dashboard","tasks","team","wiki","chat","changelog"]),
  backend: new Set([
    "dashboard","tasks","incidents","deploys","logs","team","runbooks",
    "console","wiki","chat","repositories","changelog",
  ]),
  frontend: new Set([
    "dashboard","tasks","team","wiki","chat","changelog","ai",
  ]),
  sysadmin: new Set([
    "dashboard","servers","tasks","incidents","logs","team","runbooks",
    "log-alerts","console","wiki","chat","changelog",
  ]),
  dba: new Set([
    "dashboard","servers","tasks","logs","team","wiki","chat","changelog",
  ]),
  mapper: new Set([
    "dashboard","tasks","team","wiki","chat","changelog",
  ]),
  designer: new Set([
    "dashboard","tasks","team","wiki","chat","changelog","ai",
  ]),
  anticheat: new Set([
    "dashboard","servers","tasks","incidents","logs","team","runbooks",
    "console","wiki","chat","changelog",
  ]),
  network: new Set([
    "dashboard","servers","tasks","incidents","logs","team","runbooks",
    "console","wiki","chat","changelog",
  ]),
  gamedesign: new Set([
    "dashboard","tasks","team","reports","wiki","chat","changelog",
  ]),
  video: new Set(["dashboard","tasks","chat","changelog"]),
  manager: new Set([
    "dashboard","tasks","team","reports","schedule","wiki","chat","changelog",
  ]),
};

/**
 * Returns true if the user may see a given app section.
 * - admin/owner: always true
 * - developer with no specialties: all non-settings sections (preserve existing behavior)
 * - developer with specialties: union of their specialty sections
 */
export function canViewSection(
  role: UserRole,
  specialties: string[],
  section: AppSection,
): boolean {
  if (hasRole(role, "admin")) return true;
  if (section === "settings") return false; // settings requires admin+

  if (specialties.length === 0) return true; // no specialties → same as before (all non-settings)

  for (const spec of specialties) {
    if (SPECIALTY_SECTIONS[spec]?.has(section)) return true;
  }
  return false;
}

// ─── Page-level guards ───────────────────────────────────────────────────────

export function canViewSettings(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canViewActivity(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canDeployProd(role: UserRole): boolean {
  return hasRole(role, "owner");
}

export function canDeployDev(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canRestartServer(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canCreateIncident(role: UserRole, severity?: "P1" | "P2" | "P3" | "P4"): boolean {
  if (severity === "P1" || severity === "P2") return hasRole(role, "admin");
  return true;
}

export function canUseConsole(role: UserRole, serverType: "production" | "development"): boolean {
  if (serverType === "production") return hasRole(role, "admin");
  return true;
}

export function canManageUsers(role: UserRole): boolean {
  return hasRole(role, "owner");
}

export function getPermissionLabel(role: UserRole): string {
  switch (role) {
    case "owner":     return "Full Access";
    case "admin":     return "Admin Access";
    case "developer": return "Limited Access";
  }
}
