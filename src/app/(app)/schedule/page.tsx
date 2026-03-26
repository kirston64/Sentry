"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, CalendarClock, ChevronDown } from "lucide-react";

interface Server { id: string; name: string; }
interface ScheduledRestart {
  id: string;
  serverId: string;
  cronExpr: string;
  label: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  server: { id: string; name: string };
}

const PRESETS = [
  { label: "Каждый день в 06:00", cron: "0 6 * * *" },
  { label: "Каждый день в 03:00", cron: "0 3 * * *" },
  { label: "Каждые 12ч (00:00 и 12:00)", cron: "0 0,12 * * *" },
  { label: "По воскресеньям в 04:00", cron: "0 4 * * 0" },
  { label: "Каждый час", cron: "0 * * * *" },
];

function humanCron(expr: string) {
  const found = PRESETS.find(p => p.cron === expr);
  if (found) return found.label;
  return expr;
}

export default function SchedulePage() {
  const [restarts, setRestarts] = useState<ScheduledRestart[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serverId: "", cronExpr: "0 6 * * *", label: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetch("/api/scheduled-restarts").then(r => r.json()).catch(() => []),
      fetch("/api/servers").then(r => r.json()).catch(() => []),
    ]);
    if (Array.isArray(r)) setRestarts(r);
    if (Array.isArray(s)) setServers(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/scheduled-restarts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (res.ok) setRestarts(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
  };

  const remove = async (id: string) => {
    await fetch(`/api/scheduled-restarts/${id}`, { method: "DELETE" });
    setRestarts(prev => prev.filter(r => r.id !== id));
  };

  const create = async () => {
    if (!form.serverId || !form.cronExpr) return;
    setSaving(true);
    const res = await fetch("/api/scheduled-restarts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setRestarts(prev => [...prev, data]);
      setShowForm(false);
      setForm({ serverId: "", cronExpr: "0 6 * * *", label: "" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Расписание перезапусков</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-primary/30 bg-surface p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">Новое расписание</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Сервер</label>
              <div className="relative">
                <select
                  value={form.serverId}
                  onChange={e => setForm(p => ({ ...p, serverId: e.target.value }))}
                  className="w-full h-8 pl-3 pr-7 rounded border border-border bg-bg text-sm text-text-primary appearance-none focus:outline-none focus:border-primary"
                >
                  <option value="">Выбрать сервер...</option>
                  {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Cron / Пресет</label>
              <div className="relative">
                <select
                  value={form.cronExpr}
                  onChange={e => setForm(p => ({ ...p, cronExpr: e.target.value }))}
                  className="w-full h-8 pl-3 pr-7 rounded border border-border bg-bg text-sm text-text-primary appearance-none focus:outline-none focus:border-primary"
                >
                  {PRESETS.map(p => <option key={p.cron} value={p.cron}>{p.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Метка (необязательно)</label>
              <input
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Напр. Ночной рестарт"
                className="w-full h-8 px-3 rounded border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !form.serverId}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 px-4 py-2 text-[11px] font-medium text-text-muted border-b border-border bg-surface-hover">
          <span>Сервер</span>
          <span>Расписание</span>
          <span>Последний запуск</span>
          <span>Статус</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-surface-hover/30 mx-4 my-1 rounded" />
            ))
          ) : restarts.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Нет запланированных перезапусков</p>
            </div>
          ) : (
            restarts.map(r => (
              <div key={r.id} className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 px-4 py-3 items-center text-sm ${!r.enabled ? "opacity-50" : ""}`}>
                <div>
                  <span className="font-medium text-text-primary">{r.server.name}</span>
                  {r.label && <span className="ml-2 text-xs text-text-muted">{r.label}</span>}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 text-text-muted" />
                  <span className="text-text-secondary">{humanCron(r.cronExpr)}</span>
                  <code className="text-[10px] text-text-muted bg-surface-hover px-1 rounded">{r.cronExpr}</code>
                </div>
                <div className="text-xs text-text-muted px-4">
                  {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString("ru-RU") : "Ещё не запускался"}
                </div>
                <button
                  onClick={() => toggle(r.id, r.enabled)}
                  className="px-2 text-text-muted hover:text-primary transition-colors"
                  title={r.enabled ? "Выключить" : "Включить"}
                >
                  {r.enabled ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="px-2 text-text-muted hover:text-error transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
