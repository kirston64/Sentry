"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Play, Square, Coffee, ArrowRight, Users } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";

interface WorkBreak { id: string; startedAt: string; endedAt: string | null }
interface WorkSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  status: "working" | "on_break" | "ended";
  breaks: WorkBreak[];
}

interface UserStat {
  user: { id: string; username: string; fullName: string; role: string };
  totalMin: number;
  breakMin: number;
  days: number;
  sessions: (WorkSession & { workedMin: number; breakMin: number })[];
}

function fmtMin(min: number) {
  if (min < 60) return `${min}м`;
  return `${Math.floor(min / 60)}ч ${min % 60}м`;
}

function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

function calcWorked(session: WorkSession): number {
  const end = session.endedAt ? new Date(session.endedAt) : new Date();
  const totalMs = end.getTime() - new Date(session.startedAt).getTime();
  const breakMs = session.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return acc + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0);
  return Math.max(0, Math.round((totalMs - breakMs) / 60000));
}

function calcBreak(session: WorkSession): number {
  return Math.round(session.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return acc + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0) / 60000);
}

export function WorkTimer() {
  const profile = useProfile();
  const isAdmin = hasRole(profile.role, "admin");

  const [session, setSession] = useState<WorkSession | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStat[]>([]);
  const [showStats, setShowStats] = useState(false);

  useTick(); // re-render every second for live timer

  const fetchSession = useCallback(async () => {
    const r = await fetch("/api/work/session");
    const d = await r.json();
    setSession(d);
  }, []);

  const fetchStats = useCallback(async () => {
    const r = await fetch("/api/work/stats?days=7");
    const d = await r.json();
    setStats(d.users ?? []);
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (isAdmin && showStats) fetchStats(); }, [isAdmin, showStats, fetchStats]);

  const action = async (act: string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/work/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const d = await r.json();
      if (r.ok) setSession(d);
    } finally {
      setLoading(false);
    }
  };

  if (session === undefined) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-hover mb-3"/>
        <div className="h-8 w-32 animate-pulse rounded bg-surface-hover"/>
      </div>
    );
  }

  const workedMin = session && session.status !== "ended" ? calcWorked(session) : 0;
  const breakMin  = session && session.status !== "ended" ? calcBreak(session) : 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-text-muted"/>
          <span className="text-sm font-medium text-text-primary">Рабочее время</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowStats(v => !v)}
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <Users className="h-3 w-3"/> Команда
          </button>
        )}
      </div>

      {/* Status + timer */}
      {!session || session.status === "ended" ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Смена не начата</span>
          <button
            onClick={() => action("start")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/80 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5"/> Начать работу
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Live counters */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={clsx("text-xl font-bold tabular-nums", session.status === "on_break" ? "text-text-muted" : "text-success")}>
                {fmtMin(workedMin)}
              </p>
              <p className="text-[10px] text-text-muted">работа</p>
            </div>
            {breakMin > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold tabular-nums text-warning">{fmtMin(breakMin)}</p>
                <p className="text-[10px] text-text-muted">перерыв</p>
              </div>
            )}
            <div className={clsx(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
              session.status === "working"  ? "bg-success/15 text-success" :
              session.status === "on_break" ? "bg-warning/15 text-warning" : ""
            )}>
              {session.status === "working" ? "● Работает" : "○ Перерыв"}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {session.status === "working" ? (
              <>
                <button
                  onClick={() => action("break_start")}
                  disabled={loading}
                  className="flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning hover:bg-warning/20 disabled:opacity-50 transition-colors"
                >
                  <Coffee className="h-3.5 w-3.5"/> Перерыв
                </button>
                <button
                  onClick={() => action("end")}
                  disabled={loading}
                  className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
                >
                  <Square className="h-3.5 w-3.5"/> Закончить
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => action("break_end")}
                  disabled={loading}
                  className="flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-50 transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5"/> Продолжить
                </button>
                <button
                  onClick={() => action("end")}
                  disabled={loading}
                  className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
                >
                  <Square className="h-3.5 w-3.5"/> Закончить
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin: team stats */}
      {isAdmin && showStats && stats.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Команда сегодня</p>
          {stats.map(u => {
            const todaySessions = u.sessions.filter((s: WorkSession & { workedMin: number; breakMin: number; date?: string }) => s.date === new Date().toISOString().slice(0, 10));
            const todayMin = todaySessions.reduce((a, s) => a + s.workedMin, 0);
            const active = todaySessions.find(s => s.status !== "ended");
            return (
              <div key={u.user.id} className="flex items-center gap-2 text-xs">
                <div className={clsx(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  !active ? "bg-text-muted/30" :
                  active.status === "working" ? "bg-success animate-pulse" : "bg-warning"
                )}/>
                <span className="flex-1 text-text-secondary truncate">
                  {u.user.fullName || u.user.username}
                </span>
                <span className={clsx(
                  "font-medium tabular-nums",
                  active?.status === "working" ? "text-success" :
                  active?.status === "on_break" ? "text-warning" : "text-text-muted"
                )}>
                  {todayMin > 0 ? fmtMin(todayMin) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
