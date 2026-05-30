"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Play, Square, Coffee, ArrowRight, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";
import Link from "next/link";

interface WorkBreak { id: string; startedAt: string; endedAt: string | null }
interface WorkSession {
  id: string; userId: string; date: string;
  startedAt: string; endedAt: string | null;
  status: "working" | "on_break" | "ended";
  breaks: WorkBreak[];
}

interface ActiveUser {
  user: { id: string; username: string; fullName: string };
  activeSession: WorkSession | null;
  totalMin: number;
}

function fmtMin(min: number) {
  if (min <= 0) return "0м";
  if (min < 60) return `${min}м`;
  return `${Math.floor(min / 60)}ч ${min % 60 > 0 ? `${min % 60}м` : ""}`.trim();
}

function calcWorked(s: WorkSession): number {
  const end = s.endedAt ? new Date(s.endedAt) : new Date();
  const totalMs = end.getTime() - new Date(s.startedAt).getTime();
  const breakMs = s.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ? new Date(b.endedAt) : new Date();
    return acc + (bEnd.getTime() - new Date(b.startedAt).getTime());
  }, 0);
  return Math.max(0, Math.round((totalMs - breakMs) / 60000));
}

export function WorkTimer() {
  const profile = useProfile();
  const isAdmin = hasRole(profile.role, "admin");

  const [session, setSession] = useState<WorkSession | null | undefined>(undefined);
  const [team, setTeam] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const fetchSession = useCallback(async () => {
    const r = await fetch("/api/work/session");
    setSession(r.ok ? await r.json() : null);
  }, []);

  const fetchTeam = useCallback(async () => {
    if (!isAdmin) return;
    const r = await fetch("/api/work/stats?days=1");
    if (r.ok) {
      const d = await r.json();
      setTeam(d.users ?? []);
    }
  }, [isAdmin]);

  useEffect(() => { fetchSession(); fetchTeam(); }, [fetchSession, fetchTeam]);

  const doAction = async (action: string) => {
    setLoading(true);
    try {
      const r = await fetch("/api/work/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (r.ok) { setSession(await r.json()); fetchTeam(); }
    } finally { setLoading(false); }
  };

  if (session === undefined) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-hover" />
        <div className="h-8 w-20 animate-pulse rounded bg-surface-hover" />
      </div>
    );
  }

  const workedMin = session && session.status !== "ended" ? calcWorked(session) : 0;
  const active    = session && session.status !== "ended";
  const onBreak   = session?.status === "on_break";

  const today = new Date().toISOString().slice(0, 10);
  const onlineTeam = isAdmin ? team.filter(u =>
    u.activeSession && u.activeSession.status !== "ended"
  ) : [];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Рабочее время</span>
        </div>
        <Link href="/work" className="text-text-muted hover:text-primary transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <div>
          <p className={clsx(
            "text-2xl font-bold tabular-nums",
            !active ? "text-text-muted" : onBreak ? "text-warning" : "text-success"
          )}>
            {fmtMin(workedMin)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {!active ? "смена не начата" : onBreak ? "на перерыве" : "отработано"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {!active && (
            <button onClick={() => doAction("start")} disabled={loading}
              className="flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-medium text-white hover:bg-success/80 disabled:opacity-50 transition-colors">
              <Play className="h-3.5 w-3.5" /> Начать
            </button>
          )}
          {active && !onBreak && (
            <>
              <button onClick={() => doAction("break_start")} disabled={loading}
                className="rounded border border-warning/40 bg-warning/10 p-1.5 text-warning hover:bg-warning/20 disabled:opacity-50 transition-colors"
                title="Перерыв">
                <Coffee className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => doAction("end")} disabled={loading}
                className="rounded border border-border p-1.5 text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
                title="Закончить день">
                <Square className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {onBreak && (
            <>
              <button onClick={() => doAction("break_end")} disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-50 transition-colors">
                <ArrowRight className="h-3.5 w-3.5" /> Продолжить
              </button>
              <button onClick={() => doAction("end")} disabled={loading}
                className="rounded border border-border p-1.5 text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
                title="Закончить день">
                <Square className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Team online (admin only) */}
      {isAdmin && onlineTeam.length > 0 && (
        <div className="border-t border-border pt-2.5 space-y-1.5">
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide">
            Работают сейчас ({onlineTeam.length})
          </p>
          {onlineTeam.slice(0, 4).map(u => {
            const min = u.activeSession ? calcWorked(u.activeSession) : 0;
            const todayTotal = (u as { byDay?: Record<string, { workedMin: number }> }).byDay?.[today]?.workedMin ?? min;
            return (
              <div key={u.user.id} className="flex items-center gap-2 text-xs">
                <div className={clsx(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  u.activeSession?.status === "on_break" ? "bg-warning" : "bg-success animate-pulse"
                )} />
                <span className="flex-1 text-text-secondary truncate">
                  {u.user.fullName || u.user.username}
                </span>
                <span className={clsx(
                  "tabular-nums font-medium",
                  u.activeSession?.status === "on_break" ? "text-warning" : "text-success"
                )}>
                  {fmtMin(todayTotal || min)}
                </span>
              </div>
            );
          })}
          {onlineTeam.length > 4 && (
            <p className="text-[10px] text-text-muted">+{onlineTeam.length - 4} ещё</p>
          )}
        </div>
      )}
    </div>
  );
}
