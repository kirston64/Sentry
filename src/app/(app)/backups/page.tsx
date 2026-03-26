"use client";

import { useState, useEffect, useCallback } from "react";
import { HardDrive, Plus, Trash2, RefreshCw, ChevronDown, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

interface Server { id: string; name: string; }
interface Backup {
  id: string;
  name: string;
  status: string;
  size: number;
  notes: string | null;
  createdAt: string;
  finishedAt: string | null;
  server: { id: string; name: string } | null;
  creator: { username: string; fullName: string };
}

function fmtSize(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return <span className="flex items-center gap-1 text-success text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Готов</span>;
  if (status === "failed") return <span className="flex items-center gap-1 text-error text-xs"><XCircle className="h-3.5 w-3.5" /> Ошибка</span>;
  if (status === "running") return <span className="flex items-center gap-1 text-warning text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Выполняется</span>;
  return <span className="flex items-center gap-1 text-text-muted text-xs"><Clock className="h-3.5 w-3.5" /> Ожидание</span>;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serverId: "", name: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([
      fetch("/api/backups").then(r => r.json()).catch(() => []),
      fetch("/api/servers").then(r => r.json()).catch(() => []),
    ]);
    if (Array.isArray(b)) setBackups(b);
    if (Array.isArray(s)) setServers(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh while any backup is pending/running
  useEffect(() => {
    const hasPending = backups.some(b => b.status === "pending" || b.status === "running");
    if (!hasPending) return;
    const t = setTimeout(() => load(), 4000);
    return () => clearTimeout(t);
  }, [backups, load]);

  const create = async () => {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: form.serverId || null, name: form.name, notes: form.notes || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setBackups(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ serverId: "", name: "", notes: "" });
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/backups/${id}`, { method: "DELETE" });
    setBackups(prev => prev.filter(b => b.id !== id));
  };

  const totalSize = backups.filter(b => b.status === "success").reduce((s, b) => s + b.size, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Бекапы</h1>
          <span className="text-xs text-text-muted bg-surface border border-border rounded px-2 py-0.5">
            {fmtSize(totalSize)} всего
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Создать бекап
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-primary/30 bg-surface p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">Новый бекап</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Название *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Напр. backup-2026-03-26"
                className="w-full h-8 px-3 rounded border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Сервер (необязательно)</label>
              <div className="relative">
                <select
                  value={form.serverId}
                  onChange={e => setForm(p => ({ ...p, serverId: e.target.value }))}
                  className="w-full h-8 pl-3 pr-7 rounded border border-border bg-bg text-sm text-text-primary appearance-none focus:outline-none focus:border-primary"
                >
                  <option value="">Общий / без сервера</option>
                  {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Заметка</label>
              <input
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Необязательно"
                className="w-full h-8 px-3 rounded border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !form.name}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
            >
              {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Создание...</> : "Создать"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-2 text-[11px] font-medium text-text-muted border-b border-border bg-surface-hover">
          <span>Название</span>
          <span className="px-4">Сервер</span>
          <span className="px-4">Размер</span>
          <span className="px-4">Статус</span>
          <span className="px-4">Создан</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-surface-hover/30 mx-4 my-1 rounded" />
            ))
          ) : backups.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Нет бекапов</p>
            </div>
          ) : (
            backups.map(b => (
              <div key={b.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-3 items-center text-sm">
                <div>
                  <p className="font-medium text-text-primary">{b.name}</p>
                  {b.notes && <p className="text-[11px] text-text-muted">{b.notes}</p>}
                </div>
                <div className="px-4 text-xs text-text-secondary">{b.server?.name ?? "—"}</div>
                <div className="px-4 text-xs text-text-secondary">{fmtSize(b.size)}</div>
                <div className="px-4"><StatusBadge status={b.status} /></div>
                <div className="px-4 text-[11px] text-text-muted whitespace-nowrap">
                  {fmtDate(b.createdAt)}
                  <span className="block text-[10px] opacity-60">@{b.creator.username}</span>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="p-1 text-text-muted hover:text-error transition-colors"
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
