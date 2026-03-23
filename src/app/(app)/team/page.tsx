"use client";

import { useState, useMemo } from "react";
import { Users, Filter } from "lucide-react";
import { MemberCard } from "@/components/team/member-card";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import type { UserRole } from "@/types/database";

export default function TeamPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [onlineFilter, setOnlineFilter] = useState<"all" | "online" | "offline">("all");

  const filtered = useMemo(() => {
    return TEAM_MEMBERS.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (onlineFilter === "online" && !m.isOnline) return false;
      if (onlineFilter === "offline" && m.isOnline) return false;
      return true;
    });
  }, [roleFilter, onlineFilter]);

  const online = TEAM_MEMBERS.filter((m) => m.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Team</h1>
        <span className="ml-2 text-xs text-text-muted">
          {online} / {TEAM_MEMBERS.length} онлайн
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
          Фильтры:
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все роли</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
        </select>
        <div className="flex gap-1">
          {(["all", "online", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOnlineFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                onlineFilter === f ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {f === "all" ? "Все" : f === "online" ? "Онлайн" : "Офлайн"}
            </button>
          ))}
        </div>
        {(roleFilter !== "all" || onlineFilter !== "all") && (
          <button
            onClick={() => { setRoleFilter("all"); setOnlineFilter("all"); }}
            className="text-[10px] text-primary hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-text-muted">Нет участников с выбранными фильтрами</p>
        )}
      </div>
    </div>
  );
}
