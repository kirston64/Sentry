import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canViewSettings, canManageUsers } from "@/lib/rbac";
import { AccessDenied } from "@/components/auth/access-denied";
import { Settings, Users } from "lucide-react";

const MOCK_USERS = [
  { username: "owner", role: "owner" },
  { username: "admin", role: "admin" },
  { username: "dev1", role: "developer" },
  { username: "dev2", role: "developer" },
];

export default async function SettingsPage() {
  const profile = await getSession();
  if (!profile) redirect("/");

  if (!canViewSettings(profile.role)) {
    return <AccessDenied message="Настройки доступны только для Admin и Owner." />;
  }

  const isOwner = canManageUsers(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Ваш профиль</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-muted">Имя:</span>{" "}
            <span className="text-accent">{profile.github_username}</span>
          </div>
          <div>
            <span className="text-text-muted">Роль:</span>{" "}
            <span className="text-primary">{profile.role}</span>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Users className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Управление пользователями</h2>
          </div>
          <div className="divide-y divide-border">
            {MOCK_USERS.map((u) => (
              <div key={u.username} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-text-primary">{u.username}</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isOwner && (
        <p className="text-sm text-text-muted">Управление пользователями доступно только для Owner.</p>
      )}
    </div>
  );
}
