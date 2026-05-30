"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Timer, Play, Square, Coffee, ArrowRight, Users,
  Clock, TrendingUp, Calendar, Download, RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkBreak { id: string; startedAt: string; endedAt: string | null }
interface WorkSession {
  id: string; userId: string; date: string;
  startedAt: string; endedAt: string | null;
  status: "working" | "on_break" | "ended";
  note: string | null;
  breaks: WorkBreak[];
  workedMin?: number; breakMin?: number;
}

interface DayStats { workedMin: number; breakMin: number; sessions: WorkSession[] }
interface UserStat {
  user: { id: string; username: string; fullName: string; role: string };
  totalMin: number; breakMin: number; daysWorked: number; avgDailyMin: number;
  byDay: Record<string, DayStats>;
  sessions: WorkSession[];
  activeSession: WorkSession | null;
}
interface StatsResponse {
  users: UserStat[];
  sessions: WorkSession[];
  dateRange: string[];
  days: number;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmtMin(min: number) {
  if (min <= 0) return "—";
  if (min < 60) return `${min}м`;
  return `${Math.floor(min / 60)}ч ${min % 60 > 0 ? `${min % 60}м` : ""}`.trim();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
}

function todayIso() { return new Date().toISOString().slice(0, 10); }

function calcWorked(s: WorkSession): number {
  const end = s.endedAt ? new Date(s.endedAt) : new Date();
  const totalMs = end.getTime() - new Date(s.startedAt).getTime();
  const breakMs = s.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return acc + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0);
  return Math.max(0, Math.round((totalMs - breakMs) / 60000));
}

function calcBreak(s: WorkSession): number {
  return Math.round(s.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return acc + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0) / 60000);
}

// Heat colour for hours worked
function heatColor(min: number) {
  if (min <= 0) return "bg-surface-hover text-text-muted";
  if (min < 120) return "bg-primary/10 text-primary";
  if (min < 300) return "bg-success/15 text-success";
  if (min < 480) return "bg-success/30 text-success";
  return "bg-success/50 text-success font-semibold";
}

function roleBadge(role: string) {
  if (role === "owner") return "bg-warning/15 text-warning";
  if (role === "admin") return "bg-primary/15 text-primary";
  return "bg-surface-hover text-text-muted";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkPage() {
  const profile = useProfile();
  const isAdmin = hasRole(profile.role, "admin");

  const [tab, setTab] = useState<"my" | "team">("my");
  const [session, setSession] = useState<WorkSession | null | undefined>(undefined);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [days, setDays] = useState(14);

  // Live clock tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchSession = useCallback(async () => {
    const r = await fetch("/api/work/session");
    setSession(r.ok ? await r.json() : null);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/work/stats?days=${days}`);
      if (r.ok) setStats(await r.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try {
      const r = await fetch("/api/work/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (r.ok) {
        const updated = await r.json();
        setSession(updated);
        fetchStats();
      }
    } finally { setActionLoading(false); }
  };

  // Derived
  const workedMin = session && session.status !== "ended" ? calcWorked(session) : 0;
  const breakMin  = session && session.status !== "ended" ? calcBreak(session)  : 0;
  void tick; // triggers re-render

  // My stats from stats response
  const myStats = stats?.users.find(u => u.user.id === profile.id);

  // CSV export for team
  const exportCsv = () => {
    if (!stats) return;
    const rows = [["Сотрудник", "Роль", "Дней", "Всего (ч)", "Перерывы (ч)", "Среднее/день"]];
    for (const u of stats.users) {
      rows.push([
        u.user.fullName || u.user.username,
        u.user.role,
        String(u.daysWorked),
        (u.totalMin / 60).toFixed(1),
        (u.breakMin / 60).toFixed(1),
        fmtMin(u.avgDailyMin),
      ]);
    }
    const csv = rows.map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `work-stats-${todayIso()}.csv`;
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Рабочее время</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchSession(); fetchStats(); }}
            className="rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          {isAdmin && (
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-secondary outline-none">
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      {isAdmin && (
        <div className="flex gap-1 border-b border-border">
          {(["my", "team"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2 text-sm transition-colors border-b-2 -mb-px",
                tab === t
                  ? "border-primary text-text-primary font-medium"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              )}>
              {t === "my" ? "Моя смена" : "Команда"}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════ MY TAB ══════════════════════════════ */}
      {tab === "my" && (
        <div className="space-y-6">

          {/* ── Today's Session Card ── */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-text-muted mb-1">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className={clsx(
                  "text-4xl font-bold tabular-nums",
                  !session || session.status === "ended" ? "text-text-muted" :
                  session.status === "on_break" ? "text-warning" : "text-success"
                )}>
                  {fmtMin(workedMin) === "—" ? "0м" : fmtMin(workedMin)}
                </p>
                <p className="text-xs text-text-muted mt-1">отработано сегодня</p>
              </div>

              {/* Status badge */}
              <div className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                !session || session.status === "ended" ? "bg-surface-hover text-text-muted" :
                session.status === "on_break" ? "bg-warning/15 text-warning" :
                "bg-success/15 text-success"
              )}>
                {!session || session.status === "ended" ? "Не работаю" :
                 session.status === "on_break" ? "На перерыве" : "● Работаю"}
              </div>
            </div>

            {/* Stats row */}
            {session && session.status !== "ended" && (
              <div className="flex gap-6 mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-xs text-text-muted">Начало</p>
                  <p className="text-sm font-medium text-text-primary">{fmtTime(session.startedAt)}</p>
                </div>
                {session.breaks.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted">Перерывов</p>
                    <p className="text-sm font-medium text-warning">{fmtMin(breakMin)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-muted">Перерывов</p>
                  <p className="text-sm font-medium text-text-secondary">{session.breaks.length} шт.</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              {(!session || session.status === "ended") && (
                <button onClick={() => doAction("start")} disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/80 disabled:opacity-50 transition-colors">
                  <Play className="h-4 w-4" /> Начать рабочий день
                </button>
              )}
              {session?.status === "working" && (
                <>
                  <button onClick={() => doAction("break_start")} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning hover:bg-warning/20 disabled:opacity-50 transition-colors">
                    <Coffee className="h-4 w-4" /> Перерыв
                  </button>
                  <button onClick={() => doAction("end")} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors">
                    <Square className="h-4 w-4" /> Завершить день
                  </button>
                </>
              )}
              {session?.status === "on_break" && (
                <>
                  <button onClick={() => doAction("break_end")} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50 transition-colors">
                    <ArrowRight className="h-4 w-4" /> Вернуться к работе
                  </button>
                  <button onClick={() => doAction("end")} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors">
                    <Square className="h-4 w-4" /> Завершить день
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Today's Timeline ── */}
          {session && session.status !== "ended" && session.breaks.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-text-muted" /> Перерывы сегодня
              </h2>
              <div className="space-y-1.5">
                {session.breaks.map((b, i) => {
                  const dur = Math.round(((b.endedAt ? new Date(b.endedAt) : new Date()).getTime() - new Date(b.startedAt).getTime()) / 60000);
                  return (
                    <div key={b.id} className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="text-text-muted w-4">{i + 1}.</span>
                      <span>{fmtTime(b.startedAt)}</span>
                      <span className="text-text-muted">—</span>
                      <span>{b.endedAt ? fmtTime(b.endedAt) : <span className="text-warning">сейчас</span>}</span>
                      <span className="ml-auto text-warning">{fmtMin(dur)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── My History ── */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Calendar className="h-4 w-4 text-text-muted" />
              <h2 className="text-sm font-medium text-text-primary">История ({days} дней)</h2>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-surface-hover"/>)}
              </div>
            ) : !myStats || myStats.sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <Clock className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Нет данных за выбранный период</p>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-4 border-b border-border px-4 py-3 bg-surface-hover/30">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{fmtMin(myStats.totalMin)}</p>
                    <p className="text-[10px] text-text-muted">всего отработано</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{myStats.daysWorked}</p>
                    <p className="text-[10px] text-text-muted">рабочих дней</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{fmtMin(myStats.avgDailyMin)}</p>
                    <p className="text-[10px] text-text-muted">среднее в день</p>
                  </div>
                </div>
                {/* Day rows */}
                <div className="divide-y divide-border">
                  {stats!.dateRange.slice().reverse().map(date => {
                    const day = myStats.byDay[date];
                    const isToday = date === todayIso();
                    if (!day && !isToday) return null;
                    return (
                      <div key={date} className={clsx(
                        "flex items-center gap-4 px-4 py-3",
                        isToday && "bg-primary/5"
                      )}>
                        <div className="w-28 shrink-0">
                          <p className="text-xs font-medium text-text-primary">{fmtDate(date)}</p>
                          {isToday && <p className="text-[10px] text-primary">сегодня</p>}
                        </div>
                        {day ? (
                          <>
                            <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                              <div className="h-full bg-success rounded-full"
                                style={{ width: `${Math.min(100, (day.workedMin / 480) * 100)}%` }} />
                            </div>
                            <span className="w-16 text-right text-sm font-medium text-success tabular-nums">
                              {fmtMin(day.workedMin)}
                            </span>
                            {day.breakMin > 0 && (
                              <span className="w-16 text-right text-xs text-warning tabular-nums">
                                ☕ {fmtMin(day.breakMin)}
                              </span>
                            )}
                            {/* Session times */}
                            <div className="text-[10px] text-text-muted text-right w-24 shrink-0">
                              {day.sessions.map(s => (
                                <div key={s.id}>
                                  {fmtTime(s.startedAt)}{s.endedAt ? `–${fmtTime(s.endedAt)}` : "–…"}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-text-muted italic flex-1">не работал</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TEAM TAB ══════════════════════════════ */}
      {tab === "team" && isAdmin && (
        <div className="space-y-6">

          {/* ── Currently Active ── */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-text-muted" />
                <h2 className="text-sm font-medium text-text-primary">Сейчас в работе</h2>
              </div>
              <button onClick={exportCsv}
                className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-hover"/>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats?.users.map(u => {
                  const active = u.activeSession;
                  const todayMin = u.byDay[todayIso()]?.workedMin ?? 0;
                  const breakNow = active?.status === "on_break" ? calcBreak(active) : 0;
                  const workNow  = active && active.status !== "ended" ? calcWorked(active) : todayMin;
                  return (
                    <div key={u.user.id} className={clsx(
                      "rounded-lg border p-3 flex items-center gap-3",
                      active?.status === "working"  ? "border-success/30 bg-success/5" :
                      active?.status === "on_break" ? "border-warning/30 bg-warning/5" :
                      "border-border bg-surface"
                    )}>
                      <div className={clsx(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        active?.status === "working"  ? "bg-success animate-pulse" :
                        active?.status === "on_break" ? "bg-warning" : "bg-text-muted/30"
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-primary truncate">
                          {u.user.fullName || u.user.username}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {active?.status === "working"  ? `работает · ${fmtMin(workNow)}` :
                           active?.status === "on_break" ? `перерыв · ${fmtMin(breakNow)}` :
                           todayMin > 0 ? `закончил · ${fmtMin(todayMin)}` : "не работал"}
                        </p>
                      </div>
                      <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase", roleBadge(u.user.role))}>
                        {u.user.role}
                      </span>
                    </div>
                  );
                })}
                {(!stats?.users.length) && (
                  <div className="col-span-3 text-center py-8 text-xs text-text-muted">Нет данных</div>
                )}
              </div>
            )}
          </div>

          {/* ── Weekly Heat Table ── */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <TrendingUp className="h-4 w-4 text-text-muted" />
              <h2 className="text-sm font-medium text-text-primary">Статистика команды</h2>
              <span className="ml-auto text-[10px] text-text-muted">{days} дней</span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse rounded bg-surface-hover"/>)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/40">
                      <th className="sticky left-0 bg-surface-hover/40 px-4 py-2.5 text-left font-medium text-text-secondary w-36">
                        Сотрудник
                      </th>
                      {stats?.dateRange.map(date => (
                        <th key={date} className={clsx(
                          "px-1.5 py-2.5 text-center font-medium min-w-[48px]",
                          date === todayIso() ? "text-primary" : "text-text-muted"
                        )}>
                          {new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" })}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-right font-medium text-text-secondary">Итого</th>
                      <th className="px-3 py-2.5 text-right font-medium text-text-secondary">Avg/день</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats?.users.map(u => (
                      <tr key={u.user.id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-text-primary">
                          <div className="truncate max-w-[128px]">{u.user.fullName || u.user.username}</div>
                          <div className={clsx("text-[9px] font-semibold uppercase", roleBadge(u.user.role).split(" ")[1])}>
                            {u.user.role}
                          </div>
                        </td>
                        {stats.dateRange.map(date => {
                          const day = u.byDay[date];
                          return (
                            <td key={date} className="px-1 py-1.5 text-center">
                              {day ? (
                                <span className={clsx(
                                  "inline-block rounded px-1.5 py-0.5 tabular-nums text-[10px]",
                                  heatColor(day.workedMin)
                                )}>
                                  {Math.floor(day.workedMin / 60) > 0
                                    ? `${Math.floor(day.workedMin / 60)}ч`
                                    : `${day.workedMin}м`}
                                </span>
                              ) : (
                                <span className="text-text-muted/30">·</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 text-right font-semibold text-text-primary tabular-nums">
                          {fmtMin(u.totalMin)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-secondary tabular-nums">
                          {fmtMin(u.avgDailyMin)}
                        </td>
                      </tr>
                    ))}
                    {!stats?.users.length && (
                      <tr>
                        <td colSpan={100} className="py-12 text-center text-xs text-text-muted">
                          Нет данных за выбранный период
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
