"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ServerStatusWidget } from "@/components/dashboard/server-status-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FailedLoginsAlert } from "@/components/dashboard/failed-logins-alert";
import { OnCallWidget } from "@/components/dashboard/oncall-widget";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { RingChart } from "@/components/charts/ring-chart";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";
import {
  Server, AlertCircle, GitPullRequest, Users, Activity, AlertTriangle,
  Rocket, XCircle, RefreshCw, Settings2, Eye, EyeOff, GripVertical,
  Save, X, Check,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

// ─── Widget registry ─────────────────────────────────────────────────────────

interface WidgetMeta {
  id: string;
  label: string;
  minRole: "admin" | "owner" | null;
}

const WIDGET_REGISTRY: WidgetMeta[] = [
  { id: "problems",          label: "Блок проблем",      minRole: null  },
  { id: "stat_cards",        label: "Статистика",         minRole: null  },
  { id: "servers",           label: "Серверы",            minRole: null  },
  { id: "quick_actions",     label: "Быстрые действия",   minRole: null  },
  { id: "charts",            label: "Графики",            minRole: null  },
  { id: "oncall",            label: "Дежурство",          minRole: null  },
  { id: "deploys_summary",   label: "Сводка деплоев",     minRole: null  },
  { id: "incidents_summary", label: "Сводка инцидентов",  minRole: null  },
  { id: "failed_logins",     label: "Неудачные входы",    minRole: "admin" },
  { id: "activity",          label: "Аудит / Активность", minRole: "admin" },
];

interface WidgetItem { id: string; visible: boolean; order: number }

const DEFAULT_LAYOUT: WidgetItem[] = WIDGET_REGISTRY.map((w, i) => ({
  id: w.id, visible: true, order: i,
}));

// ─── Data types ───────────────────────────────────────────────────────────────

interface DashboardData {
  servers:   { id: string; name: string; ip: string; port: number; status: string; metrics: { playersOnline: number } }[];
  incidents: { id: string; title: string; severity: string; status: string }[];
  deploys:   { id: string; version: string; environment: string; status: string; commitMsg: string; startedAt: string }[];
  auditLogs: { id: string; action: string; target: string; createdAt: string; user: { username: string; fullName: string } }[];
  users:     { id: string }[];
  playerHistory:   number[];
  uptimePercent:   number;
  commitActivity:  { label: string; value: number }[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const DAYS  = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const profile  = useProfile();
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [live,        setLive]        = useState(false);

  // layout
  const [layout,      setLayout]      = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [editMode,    setEditMode]    = useState(false);
  const [draft,       setDraft]       = useState<WidgetItem[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  // dnd state
  const dragId   = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

  // ── load saved layout ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/me/dashboard-layout")
      .then(r => r.json())
      .then((saved: WidgetItem[] | null) => {
        if (!Array.isArray(saved)) return;
        const merged = [
          ...saved,
          ...DEFAULT_LAYOUT
            .filter(d => !saved.find(s => s.id === d.id))
            .map((d, i) => ({ ...d, order: saved.length + i })),
        ].sort((a, b) => a.order - b.order);
        setLayout(merged);
      })
      .catch(() => {});
  }, []);

  // ── data loading ────────────────────────────────────────────────────────────
  const loadFull = useCallback(async (cancelled: { current: boolean }) => {
    const [servers, incidents, deploys, auditLogs, users, uptime] = await Promise.all([
      fetch("/api/servers").then(r=>r.json()).catch(()=>[]),
      fetch("/api/incidents").then(r=>r.json()).catch(()=>[]),
      fetch("/api/deploys").then(r=>r.json()).catch(()=>[]),
      fetch("/api/audit?limit=5").then(r=>r.json()).catch(()=>[]),
      fetch("/api/users").then(r=>r.json()).catch(()=>[]),
      fetch("/api/uptime?days=7").then(r=>r.json()).catch(()=>[]),
    ]);
    if (cancelled.current) return;

    const uptimeArr = Array.isArray(uptime) ? uptime : [];
    const avgUptime = uptimeArr.length > 0
      ? Math.round(uptimeArr.reduce((s:number, u:{uptimePercent:number}) => s + u.uptimePercent, 0) / uptimeArr.length * 10) / 10
      : 99.7;
    const commitActivity = DAYS.map((label, i) => ({
      label,
      value: deploys.filter((d:{startedAt:string}) => {
        const day = new Date(d.startedAt).getDay();
        return (day===0?6:day-1) === i;
      }).length,
    }));

    setData({ servers, incidents, deploys, auditLogs, users, playerHistory: [], uptimePercent: avgUptime, commitActivity });
    setLastUpdated(new Date());

    if (servers[0]?.id) {
      const srv = await fetch(`/api/servers/${servers[0].id}?range=24h`).then(r=>r.json()).catch(()=>null);
      if (!cancelled.current && srv?.metrics?.length > 1)
        setData(prev => prev ? { ...prev, playerHistory: srv.metrics.map((m:{playersOnline:number})=>m.playersOnline) } : null);
    }
  }, []);

  useEffect(() => {
    let retries=0, timeout: ReturnType<typeof setTimeout>, es: EventSource;
    function connect() {
      es = new EventSource("/api/dashboard/stream");
      es.onopen  = () => { setLive(true); retries=0; };
      es.onerror = () => { setLive(false); es.close(); if(retries<5){const d=Math.min(1000*2**retries,30000);retries++;timeout=setTimeout(connect,d);} };
      es.onmessage = (ev) => { try { const p=JSON.parse(ev.data); setLastUpdated(new Date()); setData(prev=>prev?{...prev,servers:p.servers??prev.servers,incidents:p.incidents??prev.incidents,deploys:p.deploys??prev.deploys}:prev); } catch{/**/} };
    }
    connect();
    return () => { clearTimeout(timeout); es?.close(); setLive(false); };
  }, []);

  useEffect(() => {
    const c = { current: false };
    loadFull(c);
    return () => { c.current = true; };
  }, [loadFull]);

  // ── edit mode ───────────────────────────────────────────────────────────────
  const enterEdit = () => { setDraft([...layout]); setEditMode(true); setSaved(false); };
  const cancelEdit = () => { setEditMode(false); setDraft([]); };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await fetch("/api/me/dashboard-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      setLayout([...draft]);
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = (id: string) =>
    setDraft(prev => prev.map(w => w.id===id ? { ...w, visible: !w.visible } : w));

  const resetLayout = () =>
    setDraft(DEFAULT_LAYOUT.map((w,i) => ({ ...w, order: i })));

  // ── drag & drop on widgets ──────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
    // slight delay so the dragged element renders properly
    requestAnimationFrame(() => {
      (e.target as HTMLElement).style.opacity = "0.4";
    });
  };

  const onDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "";
    dragId.current = null;
    dragOver.current = null;
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver.current === overId) return;
    dragOver.current = overId;
  };

  const onDrop = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    const fromId = dragId.current;
    if (!fromId || fromId === overId) return;
    setDraft(prev => {
      const arr = [...prev];
      const from = arr.findIndex(w => w.id === fromId);
      const to   = arr.findIndex(w => w.id === overId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr.map((w, i) => ({ ...w, order: i }));
    });
  };

  // ── guards ──────────────────────────────────────────────────────────────────
  if (!data) return <DashboardSkeleton />;

  const onlineServers  = data.servers.filter(s=>s.status==="online").length;
  const offlineServers = data.servers.filter(s=>s.status==="offline");
  const failedDeploys  = data.deploys.filter(d=>d.status==="failed");
  const activeIncidents= data.incidents.filter(i=>i.status!=="resolved");
  const hasProblems    = offlineServers.length>0||failedDeploys.length>0||activeIncidents.length>0;
  const playerData     = data.playerHistory.length>1 ? data.playerHistory : [];

  const canSee = (meta: WidgetMeta | undefined) =>
    !!meta && (!meta.minRole || hasRole(profile.role, meta.minRole));

  // current render list
  const activeLayout = (editMode ? draft : layout)
    .sort((a,b) => a.order - b.order);

  // ── widget content ──────────────────────────────────────────────────────────
  function widgetContent(id: string): React.ReactNode {
    if (!data) return null;
    switch (id) {
      case "problems":
        return hasProblems ? (
          <div className="rounded-lg border border-error/40 bg-error/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-error" />
              <h2 className="text-sm font-bold text-error">Обнаружены проблемы</h2>
            </div>
            <div className="space-y-2">
              {offlineServers.map(s=>(
                <Link key={s.id} href="/servers" className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                  <XCircle className="h-3.5 w-3.5 text-error shrink-0"/>
                  <span><span className="text-error font-medium">Сервер офлайн:</span> {s.name} ({s.ip}:{s.port})</span>
                </Link>
              ))}
              {failedDeploys.map(d=>(
                <Link key={d.id} href="/deploys" className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                  <Rocket className="h-3.5 w-3.5 text-error shrink-0"/>
                  <span><span className="text-error font-medium">Деплой упал:</span> {d.version} → {d.environment}</span>
                </Link>
              ))}
              {activeIncidents.map(inc=>(
                <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0"/>
                  <span><span className="text-warning font-medium">{inc.severity}:</span> {inc.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null;

      case "failed_logins":
        return <FailedLoginsAlert />;

      case "stat_cards":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Серверы онлайн" value={`${onlineServers} / ${data.servers.length}`} icon={Server} color="success" href="/servers"/>
            <StatCard title="Активных инцидентов" value={activeIncidents.length} icon={AlertCircle} color="warning" href="/incidents"/>
            <StatCard title="Деплоев сегодня" value={data.deploys.length} icon={GitPullRequest} color="primary" href="/deploys"/>
            <StatCard title="Команда" value={`${data.users.length} чел.`} icon={Users} color="accent" href="/team"/>
          </div>
        );

      case "servers":
        return <ServerStatusWidget />;

      case "quick_actions":
        return <QuickActions />;

      case "charts":
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChartCard title="Игроки за 24ч">
              <div className="h-32">
                {playerData.length>1
                  ? <LineChart data={playerData} color="#007fd4" labels={playerData.map((_,i)=>i%Math.max(1,Math.floor(playerData.length/6))===0?HOURS[Math.round((i/playerData.length)*23)]:"")}/>
                  : <div className="flex h-full items-center justify-center text-xs text-text-muted">Нет данных</div>
                }
              </div>
            </ChartCard>
            <ChartCard title="Коммиты за неделю">
              <div className="h-32"><BarChart data={data.commitActivity} color="#4ec9b0"/></div>
            </ChartCard>
            <ChartCard title="Uptime" className="flex flex-col">
              <div className="relative flex h-32 items-center justify-center">
                <RingChart percent={data.uptimePercent} size={110} label="uptime"/>
              </div>
            </ChartCard>
          </div>
        );

      case "oncall":
        return <OnCallWidget />;

      case "deploys_summary":
        return (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-4 w-4 text-text-muted"/>
              <h3 className="text-sm font-medium text-text-primary">Деплои ({data.deploys.length})</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-success">{data.deploys.filter(d=>d.status==="success").length}</p><p className="text-[10px] text-text-muted">Success</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-error">{failedDeploys.length}</p><p className="text-[10px] text-text-muted">Failed</p></div>
              <div className="flex-1 h-3 rounded-full bg-surface-hover overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{width:`${data.deploys.length>0?(data.deploys.filter(d=>d.status==="success").length/data.deploys.length)*100:0}%`}}/>
              </div>
            </div>
          </div>
        );

      case "incidents_summary":
        return (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-text-muted"/>
              <h3 className="text-sm font-medium text-text-primary">Инциденты</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-warning">{activeIncidents.length}</p><p className="text-[10px] text-text-muted">Активных</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-success">{data.incidents.filter(i=>i.status==="resolved").length}</p><p className="text-[10px] text-text-muted">Resolved</p></div>
              <div className="flex-1 space-y-1">
                {(["P1","P2","P3","P4"] as const).map(sev=>{const c=data.incidents.filter(i=>i.severity===sev).length;return c>0?(
                  <div key={sev} className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-text-muted">{sev}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <div className={clsx("h-full rounded-full",sev==="P1"?"bg-error":sev==="P2"?"bg-warning":sev==="P3"?"bg-primary":"bg-text-muted")} style={{width:`${(c/data.incidents.length)*100}%`}}/>
                    </div>
                    <span className="text-text-muted w-3 text-right">{c}</span>
                  </div>
                ):null;})}
              </div>
            </div>
          </div>
        );

      case "activity":
        return (
          <div className="rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Activity className="h-4 w-4 text-text-muted"/>
              <h2 className="text-sm font-medium text-text-primary">Последние действия</h2>
            </div>
            <div className="divide-y divide-border">
              {data.auditLogs.map(log=>(
                <div key={log.id} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-accent font-medium">{log.user.fullName||log.user.username}</span>
                    <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-warning">{log.action}</span>
                    <span className="truncate text-xs text-text-secondary max-w-[180px] sm:max-w-none">{log.target}</span>
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0">{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
                </div>
              ))}
              {data.auditLogs.length===0 && <p className="px-4 py-4 text-center text-xs text-text-muted">Нет действий</p>}
            </div>
          </div>
        );

      default: return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] text-success font-medium">
              <Check className="h-3 w-3"/> Сохранено
            </span>
          )}
          {live && !editMode && (
            <span className="flex items-center gap-1 text-[11px] text-success font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"/> LIVE
            </span>
          )}
          {lastUpdated && !editMode && (
            <span className="text-xs text-text-muted">
              {lastUpdated.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </span>
          )}
          {!editMode && (
            <button
              onClick={()=>{setRefreshing(true);const c={current:false};loadFull(c).finally(()=>setRefreshing(false));}}
              disabled={refreshing}
              className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
            >
              <RefreshCw className={clsx("h-3 w-3",refreshing&&"animate-spin")}/>
            </button>
          )}

          {editMode ? (
            <div className="flex items-center gap-2">
              <button onClick={resetLayout} className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors">
                Сбросить
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors">
                <X className="h-3.5 w-3.5"/> Отмена
              </button>
              <button
                onClick={saveLayout}
                disabled={saving}
                className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-60 transition-colors"
              >
                <Save className="h-3.5 w-3.5"/>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          ) : (
            <button
              onClick={enterEdit}
              className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5"/> Настроить
            </button>
          )}
        </div>
      </div>

      {/* ── Edit mode hint ── */}
      {editMode && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <GripVertical className="h-4 w-4 shrink-0"/>
          Перетаскивай блоки чтобы изменить порядок · кнопка <Eye className="h-3.5 w-3.5 inline mx-1"/> скрывает блок
        </div>
      )}

      {/* ── Widgets ── */}
      <div className="space-y-4">
        {activeLayout.map(w => {
          const meta = WIDGET_REGISTRY.find(r => r.id === w.id);
          if (!canSee(meta)) return null;
          if (!w.visible && !editMode) return null;

          const content = widgetContent(w.id);
          if (!content && !editMode) return null;

          if (!editMode) {
            return <div key={w.id}>{content}</div>;
          }

          // Edit mode: widget wrapped in draggable shell
          return (
            <div
              key={w.id}
              draggable
              onDragStart={e => onDragStart(e, w.id)}
              onDragEnd={onDragEnd}
              onDragOver={e => onDragOver(e, w.id)}
              onDrop={e => onDrop(e, w.id)}
              className={clsx(
                "group rounded-lg border-2 transition-colors",
                w.visible
                  ? "border-primary/30 bg-surface/50"
                  : "border-border/40 bg-surface/30 opacity-50"
              )}
            >
              {/* Drag handle bar */}
              <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2 cursor-grab active:cursor-grabbing select-none">
                <GripVertical className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors"/>
                <span className="flex-1 text-xs font-medium text-text-secondary">{meta?.label}</span>
                {meta?.minRole && (
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-warning">
                    {meta.minRole}+
                  </span>
                )}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => toggleVisible(w.id)}
                  className="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
                  title={w.visible ? "Скрыть блок" : "Показать блок"}
                >
                  {w.visible ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}
                </button>
              </div>

              {/* Widget content (pointer-events off so drag works) */}
              <div className="pointer-events-none p-0.5">
                {content ?? (
                  <div className="flex h-14 items-center justify-center text-xs text-text-muted italic">
                    нет данных для отображения
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 animate-pulse rounded bg-surface"/>
        <div className="h-5 w-48 animate-pulse rounded bg-surface"/>
      </div>
      <div className="h-12 animate-pulse rounded-lg bg-surface"/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i=>(
          <div key={i} className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-hover"/>
            <div className="h-8 w-16 animate-pulse rounded bg-surface-hover"/>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1,2,3].map(i=>(
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover mb-4"/>
            <div className="h-32 animate-pulse rounded bg-surface-hover"/>
          </div>
        ))}
      </div>
    </div>
  );
}
