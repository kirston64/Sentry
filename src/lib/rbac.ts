import type { UserRole } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  developer: 0,
  admin: 1,
  owner: 2,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageProjects(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canManageUsers(role: UserRole): boolean {
  return hasRole(role, "owner");
}

export function canViewAuditLogs(role: UserRole): boolean {
  return hasRole(role, "admin");
}
