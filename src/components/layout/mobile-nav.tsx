"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Server, CheckSquare, AlertTriangle, HardDrive } from "lucide-react";
import { clsx } from "clsx";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/servers", icon: Server, label: "Servers" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/incidents", icon: AlertTriangle, label: "Incidents" },
  { href: "/backups", icon: HardDrive, label: "Backups" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface md:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
              active ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
