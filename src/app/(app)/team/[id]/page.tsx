import { notFound } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, GitCommit, CheckSquare, GitPullRequest, Clock, MapPin } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/mock-data";

const roleColors = {
  owner: "bg-error/20 text-error",
  admin: "bg-warning/20 text-warning",
  developer: "bg-accent/20 text-accent",
};

// Simulated recent activity per member
const MEMBER_ACTIVITY: Record<string, { action: string; target: string; time: string }[]> = {
  "tm-1": [
    { action: "Обновил CI/CD pipeline", target: "deploy.yml", time: "2ч назад" },
    { action: "Мёрж в main", target: "fivem-core", time: "5ч назад" },
    { action: "Code review", target: "PR #41", time: "1д назад" },
  ],
  "tm-2": [
    { action: "Фикс vehicle sync", target: "sync.lua", time: "30м назад" },
    { action: "Обновил античит", target: "anticheat-v2", time: "3ч назад" },
    { action: "Тест на dev сервере", target: "server-02", time: "6ч назад" },
  ],
  "tm-3": [
    { action: "Дизайн нового инвентаря", target: "inventory-nui", time: "1ч назад" },
    { action: "Пуш CSS стилей", target: "nui-styles", time: "4ч назад" },
  ],
  "tm-4": [
    { action: "Миграция БД", target: "properties", time: "4ч назад" },
    { action: "Оптимизация запросов", target: "player-data", time: "1д назад" },
  ],
  "tm-5": [
    { action: "NPC AI патрулирование", target: "dealer-npc", time: "45м назад" },
    { action: "Система торговли", target: "trade-system", time: "6ч назад" },
  ],
  "tm-6": [
    { action: "Настройка firewall", target: "server-01", time: "12ч назад" },
    { action: "SSL обновление", target: "nginx", time: "1д назад" },
  ],
  "tm-7": [
    { action: "Интерьер банка", target: "bank-interior", time: "3ч назад" },
    { action: "Экспорт моделей", target: "models/v3", time: "1д назад" },
  ],
};

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = TEAM_MEMBERS.find((m) => m.id === id);
  if (!member) notFound();

  const initials = member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const activity = MEMBER_ACTIVITY[member.id] ?? [];

  return (
    <div className="space-y-6">
      <Link href="/team" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" />
        Назад к команде
      </Link>

      {/* Profile header */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
              {initials}
            </div>
            <span
              className={clsx(
                "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-surface",
                member.isOnline ? "bg-success" : "bg-text-muted"
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">{member.username}</h2>
              <span className={clsx("rounded px-2 py-0.5 text-xs font-medium", roleColors[member.role])}>
                {member.role}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{member.fullName}</p>
            <p className="mt-1 text-xs text-text-muted">
              {member.isOnline ? "Сейчас онлайн" : `Был(а) ${new Date(member.lastActiveAt).toLocaleString("ru-RU")}`}
            </p>
          </div>
        </div>

        {/* Specialties */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.specialties.map((s) => (
            <span key={s} className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary">
              {s}
            </span>
          ))}
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-md bg-surface-hover p-3 text-center">
            <GitCommit className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-1 text-lg font-bold text-text-primary">{member.stats.commits}</p>
            <p className="text-[10px] text-text-muted">Коммитов</p>
          </div>
          <div className="rounded-md bg-surface-hover p-3 text-center">
            <CheckSquare className="mx-auto h-4 w-4 text-success" />
            <p className="mt-1 text-lg font-bold text-text-primary">{member.stats.tasksCompleted}</p>
            <p className="text-[10px] text-text-muted">Задач</p>
          </div>
          <div className="rounded-md bg-surface-hover p-3 text-center">
            <GitPullRequest className="mx-auto h-4 w-4 text-accent" />
            <p className="mt-1 text-lg font-bold text-text-primary">{member.stats.prsReviewed}</p>
            <p className="text-[10px] text-text-muted">PR Reviews</p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Clock className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-medium text-text-primary">Последняя активность</h3>
        </div>
        <div className="divide-y divide-border">
          {activity.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-text-secondary">{a.action}</span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-warning">{a.target}</span>
              </div>
              <span className="text-xs text-text-muted">{a.time}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Нет активности</p>
          )}
        </div>
      </div>
    </div>
  );
}
