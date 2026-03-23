"use client";

import { use } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  GitCommit, CheckSquare, GitPullRequest, Clock,
  Globe, MessageCircle, Send, Github, Briefcase,
  AlertTriangle, Rocket,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TEAM_MEMBERS, DEPLOYS, SEED_INCIDENTS, SEED_TASKS } from "@/lib/mock-data";
import type { Incident } from "@/types/incident";
import type { Task } from "@/types/task";

const roleColors = {
  owner: "bg-error/20 text-error",
  admin: "bg-warning/20 text-warning",
  developer: "bg-accent/20 text-accent",
};

const statusColors = {
  todo: "text-text-muted",
  in_progress: "text-warning",
  done: "text-success",
};

const statusLabels = {
  todo: "To Do",
  in_progress: "В работе",
  done: "Готово",
};

const priorityColors = {
  low: "bg-text-muted/20 text-text-muted",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  critical: "bg-error/20 text-error",
};

const severityColors = {
  P1: "bg-error/20 text-error",
  P2: "bg-warning/20 text-warning",
  P3: "bg-primary/20 text-primary",
  P4: "bg-text-muted/20 text-text-muted",
};

const incidentStatusLabels: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const deployStatusColors: Record<string, string> = {
  success: "text-success",
  failed: "text-error",
  rolling: "text-warning",
  pending: "text-text-muted",
};

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function SkillBar({ name, level }: { name: string; level: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{name}</span>
        <span className="text-text-muted">{level}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full",
            level >= 90 ? "bg-success" : level >= 70 ? "bg-primary" : level >= 50 ? "bg-warning" : "bg-text-muted"
          )}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = TEAM_MEMBERS.find((m) => m.id === id);

  const [tasks] = useLocalStorage<Task[]>("sentry_tasks", SEED_TASKS);
  const [incidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);

  if (!member) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">Участник не найден</p>
      </div>
    );
  }

  const initials = member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const memberDays = daysSince(member.joinedAt);

  // Real data from the system
  const myTasks = tasks.filter((t) => t.assigneeId === member.id);
  const activeTasks = myTasks.filter((t) => t.status !== "done");
  const doneTasks = myTasks.filter((t) => t.status === "done");

  const myIncidents = incidents.filter((i) => i.assigneeId === member.id);
  const activeIncidents = myIncidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = myIncidents.filter((i) => i.status === "resolved");

  const myDeploys = DEPLOYS.filter((d) => d.triggeredBy === member.username);
  const failedDeploys = myDeploys.filter((d) => d.status === "failed");

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Team", href: "/team" },
        { label: member.username },
      ]} />

      {/* Profile header */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className={clsx("flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold", member.avatarColor)}>
              {initials}
            </div>
            <span
              className={clsx(
                "absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-surface",
                member.isOnline ? "bg-success" : "bg-text-muted"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary">{member.username}</h2>
              <span className={clsx("rounded px-2 py-0.5 text-xs font-medium", roleColors[member.role])}>
                {member.role}
              </span>
              {member.isOnline && (
                <span className="flex items-center gap-1 text-[10px] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  онлайн
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{member.fullName}</p>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">{member.bio}</p>

            <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px]">
              <span className="flex items-center gap-1 text-text-muted"><Globe className="h-3 w-3" /> {member.timezone}</span>
              <a
                href={`https://t.me/${member.telegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-[#229ED9]/10 px-2 py-0.5 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
              >
                <Send className="h-3 w-3" /> {member.telegram}
              </a>
              <a
                href={`https://discord.com/users/${member.discord.split("#")[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-[#5865F2]/10 px-2 py-0.5 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
              >
                <MessageCircle className="h-3 w-3" /> {member.discord}
              </a>
              <a
                href={`https://github.com/${member.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-text-secondary hover:bg-white/10 transition-colors"
              >
                <Github className="h-3 w-3" /> {member.github}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-lg font-bold text-text-primary">{memberDays}</p>
          <p className="text-[10px] text-text-muted">дней в команде</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-lg font-bold text-text-primary">{member.weeklyHours}ч</p>
          <p className="text-[10px] text-text-muted">часов/неделя</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-lg font-bold text-text-primary">{member.stats.commits}</p>
          <p className="text-[10px] text-text-muted">коммитов</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className="text-lg font-bold text-text-primary">{member.stats.prsReviewed}</p>
          <p className="text-[10px] text-text-muted">PR reviews</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className={clsx("text-lg font-bold", activeTasks.length > 0 ? "text-warning" : "text-success")}>{activeTasks.length}</p>
          <p className="text-[10px] text-text-muted">активных задач</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 text-center">
          <p className={clsx("text-lg font-bold", activeIncidents.length > 0 ? "text-error" : "text-success")}>{activeIncidents.length}</p>
          <p className="text-[10px] text-text-muted">инцидентов</p>
        </div>
      </div>

      {/* Active incidents alert */}
      {activeIncidents.length > 0 && (
        <div className="rounded-lg border border-error/40 bg-error/10 p-4 animate-alert-pulse">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-error" />
            <h3 className="text-sm font-bold text-error">Активные инциденты ({activeIncidents.length})</h3>
          </div>
          {activeIncidents.map((inc) => (
            <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-center justify-between py-1.5 text-xs hover:bg-error/5 rounded px-2 -mx-2 transition-colors">
              <div className="flex items-center gap-2">
                <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-bold", severityColors[inc.severity])}>{inc.severity}</span>
                <span className="text-text-secondary">{inc.title}</span>
              </div>
              <span className="text-text-muted">{incidentStatusLabels[inc.status]}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assigned tasks */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-medium text-text-primary">Задачи ({myTasks.length})</h3>
            </div>
            <Link href="/tasks" className="text-[10px] text-primary hover:underline">все задачи</Link>
          </div>
          <div className="divide-y divide-border">
            {myTasks.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-text-muted">Нет назначенных задач</p>
            )}
            {myTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={clsx("text-[10px] font-medium", statusColors[task.status])}>
                  {statusLabels[task.status]}
                </span>
                <span className="flex-1 text-xs text-text-secondary truncate">{task.title}</span>
                <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-medium", priorityColors[task.priority])}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deploys */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-medium text-text-primary">Деплои ({myDeploys.length})</h3>
            </div>
            <Link href="/deploys" className="text-[10px] text-primary hover:underline">все деплои</Link>
          </div>
          <div className="divide-y divide-border">
            {myDeploys.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-text-muted">Нет деплоев</p>
            )}
            {myDeploys.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={clsx("text-xs font-medium", deployStatusColors[dep.status])}>
                  {dep.status === "failed" ? "FAIL" : "OK"}
                </span>
                <span className="text-xs text-accent">{dep.version}</span>
                <span className="text-[10px] text-text-muted">→ {dep.environment}</span>
                <span className="ml-auto text-[10px] text-text-muted">
                  {new Date(dep.startedAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Incident history */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-medium text-text-primary">История инцидентов ({myIncidents.length})</h3>
            </div>
            <Link href="/incidents" className="text-[10px] text-primary hover:underline">все инциденты</Link>
          </div>
          <div className="divide-y divide-border">
            {myIncidents.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-text-muted">Нет инцидентов</p>
            )}
            {myIncidents.map((inc) => (
              <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors">
                <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-bold", severityColors[inc.severity])}>{inc.severity}</span>
                <span className="flex-1 text-xs text-text-secondary truncate">{inc.title}</span>
                <span className={clsx("text-[10px]", inc.status === "resolved" ? "text-success" : "text-warning")}>
                  {incidentStatusLabels[inc.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-primary">Навыки</h3>
          </div>
          <div className="space-y-3">
            {member.skills.map((skill) => (
              <SkillBar key={skill.name} name={skill.name} level={skill.level} />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] text-text-muted mb-2">Специализации</p>
            <div className="flex flex-wrap gap-1.5">
              {member.specialties.map((s) => (
                <span key={s} className="rounded-md border border-border px-2 py-1 text-[10px] text-text-secondary">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] text-text-muted mb-1">Текущий проект</p>
            <p className="text-xs text-accent">{member.currentProject}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
