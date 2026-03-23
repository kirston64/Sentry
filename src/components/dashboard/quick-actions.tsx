"use client";

import { Rocket, RotateCcw, Plus, FileText, Lock } from "lucide-react";
import { useProfile } from "@/components/auth/profile-context";
import { canDeployDev, canRestartServer } from "@/lib/rbac";
import { clsx } from "clsx";
import Link from "next/link";

export function QuickActions() {
  const profile = useProfile();

  const actions = [
    { icon: Rocket, label: "Deploy to Dev", color: "text-success", allowed: canDeployDev(profile.role), href: "/deploys" },
    { icon: RotateCcw, label: "Restart Server", color: "text-warning", allowed: canRestartServer(profile.role), href: "/console" },
    { icon: Plus, label: "Create Task", color: "text-primary", allowed: true, href: "/tasks" },
    { icon: FileText, label: "View Logs", color: "text-accent", allowed: true, href: "/logs" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map(({ icon: Icon, label, color, allowed, href }) =>
        allowed ? (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-border-focus hover:bg-surface-hover hover:text-text-primary"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            {label}
          </Link>
        ) : (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-text-muted/40 cursor-not-allowed"
            title={`Требуется роль Admin или выше`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <Lock className="ml-auto h-3 w-3" />
          </div>
        )
      )}
    </div>
  );
}
