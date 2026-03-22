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
} from "lucide-react";
import { NotificationBell } from "./notification-bell";
import type { Profile } from "@/types/database";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/repositories", label: "Repositories", icon: GitBranch },
  { href: "/team", label: "Team", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/deploys", label: "Deploys", icon: Rocket },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/console", label: "Console", icon: TerminalSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

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
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-surface-hover text-text-primary"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-2 py-2">
        {/* Kbd hint */}
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] text-text-muted">
          <Command className="h-3 w-3" />
          <span>Ctrl+K — поиск</span>
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* User */}
        <div className="mt-1 flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            {(profile.github_username ?? "U")[0].toUpperCase()}
          </div>
          <span className="truncate">{profile.github_username ?? "User"}</span>
        </div>
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
