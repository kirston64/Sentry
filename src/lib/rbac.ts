import type { UserRole } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  developer: 0,
  admin: 1,
  owner: 2,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// --- Page access ---
export function canViewSettings(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canViewActivity(role: UserRole): boolean {
  return hasRole(role, "admin");
}

// --- Actions ---
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

// --- Permission label for UI ---
export function getPermissionLabel(role: UserRole): string {
  switch (role) {
    case "owner": return "Full Access";
    case "admin": return "Admin Access";
    case "developer": return "Limited Access";
  }
}
