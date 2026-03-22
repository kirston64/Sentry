import Link from "next/link";
import { clsx } from "clsx";
import { GitCommit, CheckSquare, GitPullRequest } from "lucide-react";
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

export function MemberCard({ member }: { member: TeamMember }) {
  const initials = member.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <Link
      href={`/team/${member.id}`}
      className="rounded-lg border border-border bg-surface p-4 transition-all hover:border-border-focus hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start gap-3">
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

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <GitCommit className="h-3 w-3" /> {member.stats.commits}
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="h-3 w-3" /> {member.stats.tasksCompleted}
        </span>
        <span className="flex items-center gap-1">
          <GitPullRequest className="h-3 w-3" /> {member.stats.prsReviewed}
        </span>
        <span className="ml-auto">
          {member.isOnline ? "онлайн" : timeAgo(member.lastActiveAt)}
        </span>
      </div>
    </Link>
  );
}
