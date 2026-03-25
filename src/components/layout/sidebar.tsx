"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Server,
  GitBranch,
  Users,
  CheckSquare,
  Activity,
  TerminalSquare,
  Settings,
  Rocket,
  AlertTriangle,
  ScrollText,
  Shield,
  LogOut,
  Command,
  Lock,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "./notification-bell";
import { hasRole as hasRoleFn } from "@/lib/rbac";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: UserRole;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/repositories", label: "Repositories", icon: GitBranch },
  { href: "/team", label: "Team", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/deploys", label: "Deploys", icon: Rocket },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/ai", label: "AI Ассистент", icon: Sparkles },
  { href: "/activity", label: "Activity", icon: Activity, minRole: "admin" },
  { href: "/console", label: "Console", icon: TerminalSquare },
  { href: "/settings", label: "Settings", icon: Settings, minRole: "admin" },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("sentry_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sentry_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const [alerts, setAlerts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const [serversRes, incidentsRes] = await Promise.all([
          fetch("/api/servers"),
          fetch("/api/incidents"),
        ]);
        const map: Record<string, number> = {};
        if (serversRes.ok) {
          const servers = await serversRes.json();
          const offline = servers.filter((s: { status: string }) => s.status === "offline").length;
          if (offline) map["/servers"] = offline;
        }
        if (incidentsRes.ok) {
          const incidents = await incidentsRes.json();
          const active = incidents.filter((i: { status: string }) => i.status !== "resolved").length;
          if (active) map["/incidents"] = active;
        }
        setAlerts(map);
      } catch { /* ignore */ }
    }
    fetchAlerts();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-sm font-bold text-text-primary">Sentry</span>
        <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {profile.role}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map(({ href, label, icon: Icon, minRole }) => {
          const locked = minRole && !hasRoleFn(profile.role, minRole);
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          if (locked) {
            return (
              <div
                key={href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-muted/40 cursor-not-allowed"
                title={`Требуется роль: ${minRole}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <Lock className="ml-auto h-3 w-3" />
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {alerts[href] && (
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white animate-alert-pulse pointer-events-none">
                  {alerts[href]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-2">
        {/* Kbd hint */}
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] text-text-muted">
          <Command className="h-3 w-3" />
          <span>Ctrl+K — поиск</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-xs">{theme === "dark" ? "Светлая тема" : "Тёмная тема"}</span>
        </button>

        {/* Notification bell */}
        <NotificationBell />

        {/* Password expiry warning */}
        {profile.password_expires_in_days <= 7 && (
          <Link
            href="/profile"
            className="mx-1 mb-1 flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1.5 text-[10px] text-warning transition-colors hover:bg-warning/20"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {profile.password_expires_in_days === 0
              ? "Пароль истёк!"
              : `Пароль истекает через ${profile.password_expires_in_days} дн.`
            }
          </Link>
        )}

        {/* User */}
        <Link
          href="/profile"
          className="mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
              {(profile.github_username ?? "U")[0].toUpperCase()}
            </div>
          )}
          <span className="truncate">{profile.full_name || profile.github_username || "User"}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-error"
        >
          <LogOut className="h-4 w-4" />
          Выход
        </button>
      </div>
    </aside>
  );
}
