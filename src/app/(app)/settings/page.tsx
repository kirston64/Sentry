import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canViewSettings, canManageUsers } from "@/lib/rbac";
import { AccessDenied } from "@/components/auth/access-denied";
import { Settings, Users, ShieldAlert, Send, KeyRound, ShieldOff, Bell } from "lucide-react";
import { TelegramSetup } from "@/components/settings/telegram-setup";
import { OTPManager } from "@/components/settings/otp-manager";
import { prisma } from "@/lib/db";
import { DeviceCodesManager } from "@/components/settings/device-codes-manager";
import { UserManager } from "@/components/settings/user-manager";
import { LockdownPanel } from "@/components/lockdown/lockdown-panel";
import { AlertThresholds } from "@/components/settings/alert-thresholds";

export default async function SettingsPage() {
  const profile = await getSession();
  if (!profile) redirect("/");

  if (!canViewSettings(profile.role)) {
    return <AccessDenied message="Настройки доступны только для Admin и Owner." />;
  }

  const isOwner = canManageUsers(profile.role);

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, createdAt: true, passwordChangedAt: true, banned: true },
    orderBy: { createdAt: "asc" },
  });

  const pendingCodes = await prisma.deviceLoginCode.findMany({
    where: { status: "pending", expiresAt: { gt: new Date() } },
    include: { user: { select: { username: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Pending device login codes */}
      {pendingCodes.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-warning">
            <ShieldAlert className="h-4 w-4" />
            Ожидают подтверждения входа ({pendingCodes.length})
          </div>
          <DeviceCodesManager codes={pendingCodes.map(c => ({
            id: c.id,
            code: c.code,
            username: c.user.fullName || c.user.username,
            deviceLabel: c.deviceLabel || "Неизвестно",
            expiresAt: c.expiresAt.toISOString(),
            createdAt: c.createdAt.toISOString(),
          }))} />
        </div>
      )}

      {/* Profile */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Ваш профиль</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-muted">Имя:</span>{" "}
            <span className="text-accent">{profile.full_name || profile.github_username}</span>
          </div>
          <div>
            <span className="text-text-muted">Роль:</span>{" "}
            <span className="text-primary">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* OTP Generator */}
      {isOwner && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <KeyRound className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Коды входа (OTP)</h2>
          </div>
          <OTPManager users={users.map(u => ({
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            role: u.role,
          }))} />
        </div>
      )}

      {/* Telegram Bot */}
      {isOwner && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Send className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Telegram Bot</h2>
          </div>
          <TelegramSetup />
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bell className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-medium text-text-primary">Пороги алертов</h2>
        </div>
        <div className="p-5">
          <AlertThresholds />
        </div>
      </div>

      {/* Emergency Lockdown */}
      {isOwner && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ShieldOff className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Аварийный режим</h2>
          </div>
          <div className="p-5">
            <LockdownPanel />
          </div>
        </div>
      )}

      {/* User management */}
      {isOwner ? (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Users className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Управление пользователями</h2>
          </div>
          <UserManager users={users.map(u => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            passwordChangedAt: u.passwordChangedAt.toISOString(),
            banned: u.banned,
          }))} />
        </div>
      ) : (
        <p className="text-sm text-text-muted">Управление пользователями доступно только для Owner.</p>
      )}
    </div>
  );
}
