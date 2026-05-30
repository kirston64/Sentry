"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ServerStatusWidget } from "@/components/dashboard/server-status-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FailedLoginsAlert } from "@/components/dashboard/failed-logins-alert";
import { OnCallWidget } from "@/components/dashboard/oncall-widget";
import { WorkTimer } from "@/components/dashboard/work-timer";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { RingChart } from "@/components/charts/ring-chart";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";
import {
  Server, AlertCircle, GitPullRequest, Users, Activity, AlertTriangle,
  Rocket, XCircle, RefreshCw, Settings2, Eye, EyeOff, GripVertical,
  Save, X, Check, Maximize2, Minus,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

// ─── Widget registry ──────────────────────────────────────────────────────────

interface WidgetMeta {
  id: string;
  label: string;
  minRole: "admin" | "owner" | null;
}

const WIDGET_REGISTRY: WidgetMeta[] = [
  { id: "problems",          label: "Блок проблем",      minRole: null    },
  { id: "stat_cards",        label: "Статистика",         minRole: null    },
  { id: "servers",           label: "Серверы",            minRole: null    },
  { id: "quick_actions",     label: "Быстрые действия",   minRole: null    },
  { id: "charts",            label: "Графики",            minRole: null    },
  { id: "oncall",            label: "Дежурство",          minRole: null    },
  { id: "deploys_summary",   label: "Сводка деплоев",     minRole: null    },
  { id: "incidents_summary", label: "Сводка инцидентов",  minRole: null    },
  { id: "work_timer",        label: "Рабочее время",       minRole: null    },
  { id: "failed_logins",     label: "Неудачные входы",    minRole: "admin" },
  { id: "activity",          label: "Аудит / Активность", minRole: "admin" },
];

// cols: 12=full, 6=half, 4=third
// compact: reduced max-height
interface WidgetItem {
  id: string;
  visible: boolean;
  order: number;
  cols: 12 | 6 | 4;
  compact: boolean;
}

const DEFAULT_LAYOUT: WidgetItem[] = [
  { id: "problems",          visible: true, order: 0, cols: 12, compact: false },
  { id: "stat_cards",        visible: true, order: 1, cols: 12, compact: false },
  { id: "servers",           visible: true, order: 2, cols: 12, compact: false },
  { id: "quick_actions",     visible: true, order: 3, cols: 12, compact: false },
  { id: "charts",            visible: true, order: 4, cols: 12, compact: false },
  { id: "oncall",            visible: true, order: 5, cols: 6,  compact: false },
  { id: "deploys_summary",   visible: true, order: 6, cols: 6,  compact: false },
  { id: "incidents_summary", visible: true, order: 7, cols: 6,  compact: false },
  { id: "work_timer",        visible: true, order: 5, cols: 6,  compact: false },
  { id: "failed_logins",     visible: true, order: 9, cols: 12, compact: false },
  { id: "activity",          visible: true, order: 10, cols: 12, compact: false },
];

// ─── Data types ───────────────────────────────────────────────────────────────

interface DashboardData {
  servers:   { id: string; name: string; ip: string; port: number; status: string; metrics: { playersOnline: number } }[];
  incidents: { id: string; title: string; severity: string; status: string }[];
  deploys:   { id: string; version: string; environment: string; status: string; commitMsg: string; startedAt: string }[];
  auditLogs: { id: string; action: string; target: string; createdAt: string; user: { username: string; fullName: string } }[];
  users:     { id: string }[];
  playerHistory:  number[];
  uptimePercent:  number;
  commitActivity: { label: string; value: number }[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const DAYS  = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

// grid col-span classes (Tailwind needs full strings, not dynamic)
const COL_CLASS: Record<number, string> = {
  12: "col-span-12",
  6:  "col-span-12 md:col-span-6",
  4:  "col-span-12 md:col-span-4",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const profile = useProfile();
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [live,        setLive]        = useState(false);

  const [layout,   setLayout]   = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const [draft,    setDraft]    = useState<WidgetItem[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const dragId = useRef<string | null>(null);
  // {id, side} — which widget + which edge the cursor is closest to
  const [dropTarget, setDropTarget] = useState<{ id: string; side: "before" | "after" } | null>(null);

  // ── load layout ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/me/dashboard-layout")
      .then(r => r.json())
      .then((remote: WidgetItem[] | null) => {
        if (!Array.isArray(remote)) return;
        const merged = [
          ...remote.map(w => ({
            ...w,
            cols: (([4,6,12].includes(w.cols) ? w.cols : 12) as 12|6|4),
            compact: w.compact ?? false,
          })),
          ...DEFAULT_LAYOUT.filter(d => !remote.find(s => s.id === d.id))
            .map((d, i) => ({ ...d, order: remote.length + i })),
        ].sort((a, b) => a.order - b.order);
        setLayout(merged);
      })
      .catch(() => {});
  }, []);

  // ── data loading ─────────────────────────────────────────────────────────────
  const fetchData = async (): Promise<DashboardData> => {
    const toArr = (v: unknown) => Array.isArray(v) ? v : [];
    const j = (r: Response) => r.ok ? r.json().catch(() => []) : [];
    const [rawS, rawI, rawD, rawA, rawU, rawUp] = await Promise.all([
      fetch("/api/servers").then(j).catch(()=>[]),
      fetch("/api/incidents").then(j).catch(()=>[]),
      fetch("/api/deploys").then(j).catch(()=>[]),
      fetch("/api/audit?limit=5").then(j).catch(()=>[]),
      fetch("/api/users").then(j).catch(()=>[]),
      fetch("/api/uptime?days=7").then(j).catch(()=>[]),
    ]);
    const servers   = toArr(rawS);
    const incidents = toArr(rawI);
    const deploys   = toArr(rawD);
    const auditLogs = toArr(rawA);
    const users     = toArr(rawU);
    const uptimeArr = toArr(rawUp);
    const avgUptime = uptimeArr.length > 0
      ? Math.round(uptimeArr.reduce((s:number,u:{uptimePercent:number})=>s+u.uptimePercent,0)/uptimeArr.length*10)/10
      : 99.7;
    const commitActivity = DAYS.map((label, i) => ({
      label,
      value: deploys.filter((d:{startedAt:string}) => {
        try { return (new Date(d.startedAt).getDay()||7)-1===i; } catch { return false; }
      }).length,
    }));
    return { servers, incidents, deploys, auditLogs, users, playerHistory: [], uptimePercent: avgUptime, commitActivity };
  };

  const loadFull = useCallback(async () => {
    try {
      const d = await fetchData();
      setData(d);
      setLastUpdated(new Date());
      if (d.servers[0]?.id) {
        const srv = await fetch(`/api/servers/${d.servers[0].id}?range=24h`).then(r=>r.json()).catch(()=>null);
        if (Array.isArray(srv?.metrics) && srv.metrics.length > 1)
          setData(prev => prev ? { ...prev, playerHistory: srv.metrics.map((m:{playersOnline:number})=>m.playersOnline) } : prev);
      }
    } catch {
      setData(prev => prev ?? { servers:[], incidents:[], deploys:[], auditLogs:[], users:[], playerHistory:[], uptimePercent:0, commitActivity:[] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let retries=0, timeout: ReturnType<typeof setTimeout>, es: EventSource;
    function connect() {
      es = new EventSource("/api/dashboard/stream");
      es.onopen  = () => { setLive(true); retries=0; };
      es.onerror = () => { setLive(false); es.close(); if(retries<5){const d=Math.min(1000*2**retries,30000);retries++;timeout=setTimeout(connect,d);} };
      es.onmessage = (ev) => { try{ const p=JSON.parse(ev.data); setLastUpdated(new Date()); setData(prev=>prev?{...prev,servers:p.servers??prev.servers,incidents:p.incidents??prev.incidents,deploys:p.deploys??prev.deploys}:prev); }catch{/**/} };
    }
    connect();
    return ()=>{ clearTimeout(timeout); es?.close(); setLive(false); };
  }, []);

  // Load data on mount — no cancellation needed, setData on unmounted component is harmless in React 18
  useEffect(() => { loadFull(); }, [loadFull]);

  // ── edit helpers ──────────────────────────────────────────────────────────
  const enterEdit  = () => { setDraft([...layout]); setEditMode(true); setSaved(false); };
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
      setTimeout(()=>setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const toggleVisible = (id: string) =>
    setDraft(prev => prev.map(w => w.id===id ? { ...w, visible: !w.visible } : w));

  const setCols = (id: string, cols: 12|6|4) =>
    setDraft(prev => prev.map(w => w.id===id ? { ...w, cols } : w));

  const toggleCompact = (id: string) =>
    setDraft(prev => prev.map(w => w.id===id ? { ...w, compact: !w.compact } : w));

  const resetLayout = () =>
    setDraft(DEFAULT_LAYOUT.map((w,i)=>({ ...w, order: i })));

  // ── drag & drop ───────────────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => { (e.target as HTMLElement).style.opacity = "0.4"; });
  };

  const onDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "";
    dragId.current = null;
    setDropTarget(null);
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragId.current === overId) return;
    // Determine left vs right half of the target element
    const rect = e.currentTarget.getBoundingClientRect();
    const side: "before" | "after" = e.clientX < rect.left + rect.width / 2 ? "before" : "after";
    setDropTarget(prev =>
      prev?.id === overId && prev?.side === side ? prev : { id: overId, side }
    );
  };

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear when truly leaving the widget (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
    }
  };

  const onDrop = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    const fromId = dragId.current;
    const side   = dropTarget?.side ?? "after";
    setDropTarget(null);
    if (!fromId || fromId === overId) return;
    setDraft(prev => {
      const arr  = [...prev];
      const from = arr.findIndex(w => w.id === fromId);
      const to   = arr.findIndex(w => w.id === overId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      // Recalculate 'to' index after removal
      const newTo = arr.findIndex(w => w.id === overId);
      arr.splice(side === "before" ? newTo : newTo + 1, 0, item);
      return arr.map((w, i) => ({ ...w, order: i }));
    });
  };

  // ── guards ────────────────────────────────────────────────────────────────
  if (!data) return <DashboardSkeleton />;

  const onlineServers   = data.servers.filter(s=>s.status==="online").length;
  const offlineServers  = data.servers.filter(s=>s.status==="offline");
  const failedDeploys   = data.deploys.filter(d=>d.status==="failed");
  const activeIncidents = data.incidents.filter(i=>i.status!=="resolved");
  const hasProblems     = offlineServers.length>0||failedDeploys.length>0||activeIncidents.length>0;
  const playerData      = data.playerHistory.length>1 ? data.playerHistory : [];

  const canSee = (meta: WidgetMeta|undefined) =>
    !!meta && (!meta.minRole || hasRole(profile.role, meta.minRole));

  const activeLayout = (editMode ? draft : layout).sort((a,b)=>a.order-b.order);

  // ── widget content ────────────────────────────────────────────────────────
  function widgetContent(id: string): React.ReactNode {
    if (!data) return null;
    switch (id) {
      case "problems":
        return hasProblems ? (
          <div className="rounded-lg border border-error/40 bg-error/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-error"/>
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

      case "failed_logins": return <FailedLoginsAlert />;

      case "stat_cards":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Серверы онлайн" value={`${onlineServers} / ${data.servers.length}`} icon={Server} color="success" href="/servers"/>
            <StatCard title="Активных инцидентов" value={activeIncidents.length} icon={AlertCircle} color="warning" href="/incidents"/>
            <StatCard title="Деплоев сегодня" value={data.deploys.length} icon={GitPullRequest} color="primary" href="/deploys"/>
            <StatCard title="Команда" value={`${data.users.length} чел.`} icon={Users} color="accent" href="/team"/>
          </div>
        );

      case "servers": return <ServerStatusWidget />;
      case "quick_actions": return <QuickActions />;

      case "charts":
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ChartCard title="Игроки за 24ч">
              <div className="h-32">
                {playerData.length>1
                  ? <LineChart data={playerData} color="#007fd4" labels={playerData.map((_,i)=>i%Math.max(1,Math.floor(playerData.length/6))===0?HOURS[Math.round((i/playerData.length)*23)]:"")}/>
                  : <div className="flex h-full items-center justify-center text-xs text-text-muted">Нет данных</div>}
              </div>
            </ChartCard>
            <ChartCard title="Коммиты за неделю">
              <div className="h-32"><BarChart data={data.commitActivity} color="#4ec9b0"/></div>
            </ChartCard>
            <ChartCard title="Uptime" className="flex flex-col">
              <div className="flex h-32 items-center justify-center">
                <RingChart percent={data.uptimePercent} size={110} label="uptime"/>
              </div>
            </ChartCard>
          </div>
        );

      case "oncall": return <OnCallWidget />;
      case "work_timer": return <WorkTimer />;

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
                {(["P1","P2","P3","P4"] as const).map(sev=>{
                  const c=data.incidents.filter(i=>i.severity===sev).length;
                  return c>0?(
                    <div key={sev} className="flex items-center gap-2 text-[10px]">
                      <span className="w-5 text-text-muted">{sev}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                        <div className={clsx("h-full rounded-full",sev==="P1"?"bg-error":sev==="P2"?"bg-warning":sev==="P3"?"bg-primary":"bg-text-muted")} style={{width:`${(c/data.incidents.length)*100}%`}}/>
                      </div>
                      <span className="text-text-muted w-3 text-right">{c}</span>
                    </div>
                  ):null;
                })}
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
              {data.auditLogs.length===0&&<p className="px-4 py-4 text-center text-xs text-text-muted">Нет действий</p>}
            </div>
          </div>
        );

      default: return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Header */}
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
              onClick={()=>{setRefreshing(true);loadFull().finally(()=>setRefreshing(false));}}
              disabled={refreshing}
              className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
            >
              <RefreshCw className={clsx("h-3 w-3",refreshing&&"animate-spin")}/>
            </button>
          )}

          {editMode ? (
            <div className="flex items-center gap-2">
              <button onClick={resetLayout} className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors">Сбросить</button>
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

      {/* Edit hint */}
      {editMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <GripVertical className="h-4 w-4 shrink-0"/>
          <span>Перетаскивай блоки · меняй ширину <b>1/3 · 1/2 · Full</b> · кнопка <b>↕</b> делает блок компактным</span>
        </div>
      )}

      {/* Widget grid */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {activeLayout.map(w => {
          const meta = WIDGET_REGISTRY.find(r => r.id === w.id);
          if (!canSee(meta)) return null;
          if (!w.visible && !editMode) return null;

          const content = widgetContent(w.id);
          if (!content && !editMode) return null;

          const colClass = COL_CLASS[w.cols] ?? "col-span-12";

          if (!editMode) {
            return (
              <div key={w.id} className={colClass}>
                {w.compact
                  ? <div className="max-h-[180px] overflow-hidden rounded-lg">{content}</div>
                  : content
                }
              </div>
            );
          }

          // Edit mode wrapper
          const showBefore = dropTarget?.id === w.id && dropTarget.side === "before";
          const showAfter  = dropTarget?.id === w.id && dropTarget.side === "after";

          return (
            <div
              key={w.id}
              className={clsx(
                colClass,
                "group relative transition-all duration-150",
                // Left / right drop indicators as border highlight
                showBefore && "outline outline-2 outline-offset-2 outline-primary [outline-style:solid] [clip-path:inset(0_50%_0_0)]",
                showAfter  && "outline outline-2 outline-offset-2 outline-primary [outline-style:solid] [clip-path:inset(0_0_0_50%)]",
              )}
              draggable
              onDragStart={e => onDragStart(e, w.id)}
              onDragEnd={onDragEnd}
              onDragOver={e => onDragOver(e, w.id)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, w.id)}
            >
              {/* Left drop line */}
              {showBefore && (
                <div className="pointer-events-none absolute -left-[3px] inset-y-0 w-[3px] rounded-full bg-primary z-20"/>
              )}
              {/* Right drop line */}
              {showAfter && (
                <div className="pointer-events-none absolute -right-[3px] inset-y-0 w-[3px] rounded-full bg-primary z-20"/>
              )}
              <div className={clsx(
                "rounded-lg border-2 transition-colors",
                w.visible ? "border-primary/35" : "border-border/40 opacity-50"
              )}>

                {/* Handle bar */}
                <div className="flex items-center gap-1.5 border-b border-border/50 bg-surface/80 px-2 py-1.5 cursor-grab active:cursor-grabbing select-none rounded-t-lg">
                  <GripVertical className="h-4 w-4 text-text-muted shrink-0"/>
                  <span className="flex-1 truncate text-[11px] font-medium text-text-secondary">{meta?.label}</span>

                  {/* Width buttons */}
                  <div className="flex items-center rounded border border-border overflow-hidden">
                    {([4,6,12] as const).map(c => (
                      <button
                        key={c}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setCols(w.id, c)}
                        className={clsx(
                          "px-2 py-0.5 text-[10px] font-medium transition-colors border-r border-border last:border-r-0",
                          w.cols === c
                            ? "bg-primary text-white"
                            : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                        )}
                        title={c===12?"Полная ширина":c===6?"Половина ширины":"Треть ширины"}
                      >
                        {c===12?"Full":c===6?"½":"⅓"}
                      </button>
                    ))}
                  </div>

                  {/* Compact toggle */}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => toggleCompact(w.id)}
                    className={clsx(
                      "rounded p-1 transition-colors",
                      w.compact ? "text-primary bg-primary/10" : "text-text-muted hover:text-text-primary"
                    )}
                    title={w.compact ? "Развернуть" : "Компактный вид"}
                  >
                    {w.compact ? <Maximize2 className="h-3.5 w-3.5"/> : <Minus className="h-3.5 w-3.5"/>}
                  </button>

                  {/* Visible toggle */}
                  {meta?.minRole && (
                    <span className="rounded bg-warning/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-warning">{meta.minRole}+</span>
                  )}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => toggleVisible(w.id)}
                    className="rounded p-1 text-text-muted hover:text-text-primary transition-colors"
                    title={w.visible ? "Скрыть" : "Показать"}
                  >
                    {w.visible ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}
                  </button>
                </div>

                {/* Content */}
                <div className={clsx(
                  "pointer-events-none overflow-hidden",
                  w.compact && "max-h-[160px]"
                )}>
                  {content ?? (
                    <div className="flex h-14 items-center justify-center text-xs text-text-muted italic px-4">
                      нет данных
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 animate-pulse rounded bg-surface"/>
        <div className="h-5 w-48 animate-pulse rounded bg-surface"/>
      </div>
      <div className="grid grid-cols-12 gap-4">
        {[12,12,6,6].map((c,i)=>(
          <div key={i} className={clsx(COL_CLASS[c], "rounded-lg border border-border bg-surface p-4")}>
            <div className="h-4 w-24 animate-pulse rounded bg-surface-hover mb-4"/>
            <div className="h-24 animate-pulse rounded bg-surface-hover"/>
          </div>
        ))}
      </div>
    </div>
  );
}
