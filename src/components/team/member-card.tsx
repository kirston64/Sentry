"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { GitCommit, CheckSquare, MessageCircle, Send, Trash2, Ban, ShieldCheck } from "lucide-react";
import type { TeamMember } from "@/types/team";

const roleColors = {
  owner: "bg-error/20 text-error",
  admin: "bg-warning/20 text-warning",
  developer: "bg-accent/20 text-accent",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  return `${Math.floor(hours / 24)}д назад`;
}

export function MemberCard({
  member,
  onDelete,
  onBan,
  onUnban,
  banned,
}: {
  member: TeamMember;
  onDelete?: () => void;
  onBan?: () => void;
  onUnban?: () => void;
  banned?: boolean;
}) {
  const initials = member.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <Link
      href={`/team/${member.id}`}
      className={clsx(
        "group relative block rounded-lg border bg-surface p-4 transition-all hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        banned ? "border-error/30 opacity-75" : "border-border hover:border-border-focus"
      )}
    >
      {/* Action buttons — shown on hover */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
        {onUnban && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnban(); }}
            className="flex items-center justify-center h-7 w-7 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
            title="Разбанить"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </button>
        )}
        {onBan && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBan(); }}
            className="flex items-center justify-center h-7 w-7 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
            title="Заблокировать"
          >
            <Ban className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="flex items-center justify-center h-7 w-7 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
            title="Удалить пользователя"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Banned badge */}
      {banned && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded px-1.5 py-0.5 bg-error/15 border border-error/25">
          <Ban className="h-3 w-3 text-error" />
          <span className="text-[10px] text-error font-medium">Забанен</span>
        </div>
      )}
      <div className={clsx("flex items-start gap-3", banned && "mt-6")}>
        {/* Avatar */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {initials}
          </div>
          <span
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
              member.isOnline ? "bg-success" : "bg-text-muted"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {member.username}
            </span>
            <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium", roleColors[member.role])}>
              {member.role}
            </span>
          </div>
          <p className="text-xs text-text-muted">{member.fullName}</p>
        </div>
      </div>

      {/* Specialties */}
      <div className="mt-3 flex flex-wrap gap-1">
        {member.specialties.map((s) => (
          <span key={s} className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-secondary">
            {s}
          </span>
        ))}
      </div>

      {/* Contact + Stats */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
        <a
          href={`https://t.me/${member.telegram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded bg-[#229ED9]/10 px-1.5 py-0.5 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
          title={member.telegram}
        >
          <Send className="h-3 w-3" /> TG
        </a>
        <a
          href={`https://discord.com/users/${member.discord.split("#")[0]}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded bg-[#5865F2]/10 px-1.5 py-0.5 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
          title={member.discord}
        >
          <MessageCircle className="h-3 w-3" /> DS
        </a>
        <span className="flex items-center gap-1 ml-1">
          <GitCommit className="h-3 w-3" /> {member.stats.commits}
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" /> {member.stats.tasksCompleted}
        </span>
        <span className="ml-auto">
          {member.isOnline ? "онлайн" : timeAgo(member.lastActiveAt)}
        </span>
      </div>
    </Link>
  );
}
