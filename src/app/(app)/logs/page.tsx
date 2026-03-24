"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollText, Shield, Server, Search, ChevronDown, RefreshCw, FileDown,
} from "lucide-react";
import { downloadCSV, downloadJSON } from "@/lib/export";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  action: string;
  target: string;
  details: string | null;
  createdAt: string;
  user: { id: string; username: string; fullName: string; role: string };
}

interface ServerLog {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
  server: { name: string };
}

interface UserOption {
  id: string;
  username: string;
  fullName: string;
}

interface ServerOption {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}с`;
  if (sec < 3600) return `${Math.floor(sec / 60)}м`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}ч`;
  return new Date(iso).toLocaleDateString("ru-RU");
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: "text-success bg-success/10",
  UPDATE: "text-primary bg-primary/10",
  DELETE: "text-error bg-error/10",
  LOGIN:  "text-accent bg-accent/10",
  LOGOUT: "text-text-muted bg-surface-hover",
};

function actionColor(action: string) {
  for (const key of Object.keys(ACTION_COLOR)) {
    if (action.toUpperCase().startsWith(key)) return ACTION_COLOR[key];
  }
  return "text-warning bg-warning/10";
}

const LEVEL_STYLE: Record<string, string> = {
  error: "text-error bg-error/10 border-error/20",
  warn:  "text-warning bg-warning/10 border-warning/20",
  info:  "text-primary bg-primary/10 border-primary/20",
  debug: "text-text-muted bg-surface-hover border-border",
};

// ─── Audit Tab ─────────────────────────────────────────────────────────────────

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const knownIds = useRef(new Set<string>());

  const fetchLogs = useCallback(async (replace = false) => {
    const params = new URLSearchParams({ limit: "300" });
    if (userId) params.set("userId", userId);
    if (action) params.set("action", action);
    const data: AuditLog[] = await fetch(`/api/audit?${params}`).then((r) => r.json()).catch(() => []);
    if (!Array.isArray(data)) return;
    if (replace) {
      knownIds.current = new Set(data.map((l) => l.id));
      setLogs(data);
    } else {
      const fresh = data.filter((l) => !knownIds.current.has(l.id));
      if (fresh.length) {
        fresh.forEach((l) => knownIds.current.add(l.id));
        setLogs((prev) => [...fresh, ...prev].slice(0, 500));
      }
    }
  }, [userId, action]);

  useEffect(() => {
    setLoading(true);
    fetchLogs(true).finally(() => setLoading(false));
  }, [fetchLogs]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data: UserOption[]) => {
      if (Array.isArray(data)) setUsers(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const iv = setInterval(() => fetchLogs(false), 15_000);
    return () => clearInterval(iv);
  }, [fetchLogs]);

  const filtered = search
    ? logs.filter((l) => l.action.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const actions = [...new Set(logs.map((l) => l.action.split("_")[0]))].sort();

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="h-8 pl-8 pr-3 rounded border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-48"
          />
        </div>
        <div className="relative">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-8 pl-3 pr-7 rounded border border-border bg-surface text-sm text-text-primary appearance-none focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Все пользователи</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-8 pl-3 pr-7 rounded border border-border bg-surface text-sm text-text-primary appearance-none focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Все действия</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        </div>
        <span className="ml-auto text-xs text-text-muted">{filtered.length} записей</span>
        <button
          onClick={() =>
            downloadCSV(
              filtered.map((l) => ({
                id: l.id,
                action: l.action,
                target: l.target,
                details: l.details ?? "",
                createdAt: l.createdAt,
                user: l.user.fullName || l.user.username,
                username: l.user.username,
                role: l.user.role,
              })),
              `audit-${new Date().toISOString().slice(0, 10)}`
            )
          }
          className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Скачать CSV"
        >
          <FileDown className="h-3.5 w-3.5" />
          CSV
        </button>
        <button
          onClick={() =>
            downloadJSON(filtered, `audit-${new Date().toISOString().slice(0, 10)}`)
          }
          className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Скачать JSON"
        >
          <FileDown className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-0 text-[11px] font-medium text-text-muted border-b border-border px-4 py-2 bg-surface-hover">
          <span className="pr-6">Пользователь</span>
          <span>Действие / Объект</span>
          <span>Детали</span>
          <span className="text-right">Время</span>
        </div>
        <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse bg-surface-hover/50 mx-4 my-1 rounded" />
            ))
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">Нет событий</p>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-0 px-4 py-2.5 text-xs items-center hover:bg-surface-hover/40 transition-colors">
                <div className="pr-6 min-w-0">
                  <span className="font-medium text-text-primary">{log.user.fullName || log.user.username}</span>
                  <span className="ml-1.5 text-[10px] text-text-muted">@{log.user.username}</span>
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-text-secondary truncate">{log.target}</span>
                </div>
                <div className="min-w-0 text-text-muted truncate pr-4">{log.details || "—"}</div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-text-muted" title={fmtDate(log.createdAt)}>{timeAgo(log.createdAt)} назад</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Server Logs Tab ───────────────────────────────────────────────────────────

function ServerLogsTab() {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverId, setServerId] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());

  const fetchLogs = useCallback(async (replace = false) => {
    const params = new URLSearchParams({ limit: "300" });
    if (serverId) params.set("serverId", serverId);
    if (level) params.set("level", level);
    if (search) params.set("search", search);
    const data: ServerLog[] = await fetch(`/api/logs?${params}`).then((r) => r.json()).catch(() => []);
    if (!Array.isArray(data)) return;
    if (replace) {
      knownIds.current = new Set(data.map((l) => l.id));
      setLogs(data);
    } else {
      const fresh = data.filter((l) => !knownIds.current.has(l.id));
      if (fresh.length) {
        fresh.forEach((l) => knownIds.current.add(l.id));
        setLogs((prev) => [...prev, ...fresh].slice(-500));
      }
    }
  }, [serverId, level, search]);

  useEffect(() => {
    setLoading(true);
    fetchLogs(true).finally(() => setLoading(false));
  }, [fetchLogs]);

  useEffect(() => {
    fetch("/api/servers").then((r) => r.json()).then((data: ServerOption[]) => {
      if (Array.isArray(data)) setServers(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const iv = setInterval(() => fetchLogs(false), 10_000);
    return () => clearInterval(iv);
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const LEVELS = ["error", "warn", "info", "debug"];
  const levelCounts = LEVELS.reduce<Record<string, number>>((acc, l) => {
    acc[l] = logs.filter((e) => e.level === l).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск в логах..."
            className="h-8 pl-8 pr-3 rounded border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-56"
          />
        </div>
        <div className="relative">
          <select
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            className="h-8 pl-3 pr-7 rounded border border-border bg-surface text-sm text-text-primary appearance-none focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Все серверы</option>
            {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        </div>
        <div className="flex items-center gap-1 rounded border border-border bg-surface p-1">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(level === l ? "" : l)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                level === l
                  ? LEVEL_STYLE[l]
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {l} {levelCounts[l] > 0 && <span className="opacity-60">({levelCounts[l]})</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAutoScroll((v) => !v)}
          className={`flex items-center gap-1 h-8 px-2 rounded border text-xs transition-colors ${
            autoScroll ? "border-primary text-primary bg-primary/10" : "border-border text-text-muted hover:text-text-primary"
          }`}
        >
          <RefreshCw className="h-3 w-3" />
          Авто-скролл
        </button>
        <span className="ml-auto text-xs text-text-muted">{logs.length} строк</span>
        <button
          onClick={() =>
            downloadCSV(
              logs.map((l) => ({
                id: l.id,
                level: l.level,
                source: l.source,
                message: l.message,
                server: l.server?.name ?? "",
                createdAt: l.createdAt,
              })),
              `server-logs-${new Date().toISOString().slice(0, 10)}`
            )
          }
          className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Скачать CSV"
        >
          <FileDown className="h-3.5 w-3.5" />
          CSV
        </button>
        <button
          onClick={() =>
            downloadJSON(logs, `server-logs-${new Date().toISOString().slice(0, 10)}`)
          }
          className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Скачать JSON"
        >
          <FileDown className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>

      {/* Log terminal */}
      <div className="rounded-lg border border-border bg-[#0d0d0d] font-mono text-xs overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-surface">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-error/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <span className="text-[10px] text-text-muted">system logs</span>
        </div>
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-3 space-y-0.5">
          {loading ? (
            <span className="text-text-muted animate-pulse">Загрузка логов...</span>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">
              <p>Логи появятся после SSH-сбора метрик</p>
              <p className="text-xs mt-1 opacity-60">Серверы должны быть подключены по SSH</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2 hover:bg-white/5 px-1 py-0.5 rounded leading-5 group">
                <span className="text-text-muted/50 shrink-0 w-16 text-right">{fmtTime(log.createdAt)}</span>
                <span className={`shrink-0 w-12 text-center font-bold uppercase text-[10px] my-auto ${
                  log.level === "error" ? "text-error" :
                  log.level === "warn"  ? "text-warning" :
                  log.level === "info"  ? "text-primary" : "text-text-muted"
                }`}>{log.level}</span>
                <span className="shrink-0 text-accent/70 w-20 truncate">{log.server?.name}</span>
                <span className="shrink-0 text-text-muted/70 w-24 truncate">{log.source}</span>
                <span className={`flex-1 break-all ${
                  log.level === "error" ? "text-error/90" :
                  log.level === "warn"  ? "text-warning/90" : "text-text-secondary"
                }`}>{log.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [tab, setTab] = useState<"audit" | "server">("audit");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Логи</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => setTab("audit")}
          className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "audit"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          Аудит дашборда
        </button>
        <button
          onClick={() => setTab("server")}
          className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "server"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          Серверные логи
        </button>
      </div>

      {tab === "audit" ? <AuditTab /> : <ServerLogsTab />}
    </div>
  );
}
