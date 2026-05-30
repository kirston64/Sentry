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
  Sun,
  Moon,
  Sparkles,
  CalendarClock,
  HardDrive,
  Timer,
  BookOpen,
  BookMarked,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "./notification-bell";
import { canViewSection, type AppSection } from "@/lib/rbac";
import { parseSpecialties } from "@/lib/professions";
import type { Profile } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  section: AppSection;
};

const navItems: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard, section: "dashboard" },
  { href: "/servers",      label: "Servers",      icon: Server,          section: "servers" },
  { href: "/repositories", label: "Repositories", icon: GitBranch,       section: "repositories" },
  { href: "/team",         label: "Team",         icon: Users,           section: "team" },
  { href: "/tasks",        label: "Tasks",        icon: CheckSquare,     section: "tasks" },
  { href: "/deploys",      label: "Deploys",      icon: Rocket,          section: "deploys" },
  { href: "/incidents",    label: "Incidents",    icon: AlertTriangle,   section: "incidents" },
  { href: "/logs",         label: "Logs",         icon: ScrollText,      section: "logs" },
  { href: "/chat",         label: "Chat",         icon: MessageSquare,   section: "chat" },
  { href: "/ai",           label: "OpenRouter",   icon: Sparkles,        section: "ai" },
  { href: "/work",         label: "Work Time",    icon: Timer,           section: "work" },
  { href: "/schedule",     label: "Schedule",     icon: CalendarClock,   section: "schedule" },
  { href: "/backups",      label: "Backups",      icon: HardDrive,       section: "backups" },
  { href: "/changelog",    label: "Changelog",    icon: BookOpen,        section: "changelog" },
  { href: "/wiki",         label: "Wiki",         icon: BookMarked,      section: "wiki" },
  { href: "/runbooks",     label: "Runbooks",     icon: ClipboardList,   section: "runbooks" },
  { href: "/reports",      label: "SLA Reports",  icon: BarChart3,       section: "reports" },
  { href: "/log-alerts",   label: "Log Alerts",   icon: Bell,            section: "log-alerts" },
  { href: "/activity",     label: "Activity",     icon: Activity,        section: "activity" },
  { href: "/console",      label: "Console",      icon: TerminalSquare,  section: "console" },
  { href: "/settings",     label: "Settings",     icon: Settings,        section: "settings" },
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
        const [serversRes, incidentsRes, dmsRes] = await Promise.all([
          fetch("/api/servers"),
          fetch("/api/incidents"),
          fetch("/api/direct-messages"),
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
        if (dmsRes.ok) {
          const convos = await dmsRes.json();
          const unread = Array.isArray(convos)
            ? convos.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount ?? 0), 0)
            : 0;
          if (unread) map["/chat"] = unread;
        }
        setAlerts(map);
      } catch { /* ignore */ }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10_000);
    return () => clearInterval(interval);
  }, [profile.id]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-sm font-bold text-text-primary">Forge</span>
        <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {profile.role}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems
          .filter(({ section }) =>
            canViewSection(profile.role, parseSpecialties(profile.specialties ?? "[]"), section)
          )
          .map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
