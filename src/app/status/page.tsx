"use client";

import { useState, useEffect } from "react";
import { StatusHeader } from "@/components/status/status-header";
import { AlertTriangle, Users, RefreshCw, CheckCircle, XCircle, Code, Copy, Check } from "lucide-react";

interface ServerStatus {
  name: string;
  status: "online" | "offline" | "restarting";
  uptimeSeconds: number;
  players: number;
  maxPlayers: number;
  uptimePercent: number;
}

interface ActiveIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  lastUpdate: string | null;
}

interface UptimeDay {
  date: string;
  uptimePercent: number;
}

interface UptimeData {
  serverId: string;
  serverName: string;
  uptimePercent: number;
  avgResponseMs: number | null;
  daily: UptimeDay[];
}

interface StatusData {
  servers: ServerStatus[];
  incidents: ActiveIncident[];
  timestamp: string;
}

const statusConfig = {
  online: { label: "Operational", color: "text-emerald-400", dot: "bg-emerald-400" },
  offline: { label: "Down", color: "text-red-400", dot: "bg-red-400" },
  restarting: { label: "Restarting", color: "text-yellow-400", dot: "bg-yellow-400" },
};

function formatUptime(seconds: number): string {
  if (seconds === 0) return "Down";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function UptimeBar({ daily }: { daily: UptimeDay[] }) {
  // Show last 90 days as small bars
  const last90 = daily.slice(-90);
  return (
    <div className="flex gap-px mt-2">
      {last90.map((day, i) => {
        const pct = day.uptimePercent;
        const color =
          pct >= 99.5 ? "bg-emerald-500" :
          pct >= 95 ? "bg-yellow-500" :
          pct >= 80 ? "bg-orange-500" :
          "bg-red-500";
        return (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}
            title={`${day.date}: ${pct}%`}
          />
        );
      })}
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [uptime, setUptime] = useState<UptimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statusRes, uptimeRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/uptime?days=90"),
      ]);
      const statusJson = await statusRes.json();
      const uptimeJson = await uptimeRes.json();
      setData(statusJson);
      setUptime(Array.isArray(uptimeJson) ? uptimeJson : []);
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOp = data?.servers.every((s) => s.status === "online") ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-8 w-48 mx-auto animate-pulse rounded bg-neutral-800" />
          <div className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-100">Forge RP</h1>
          <p className="text-xs text-neutral-500 mt-1">System Status</p>
        </div>

        <StatusHeader allOperational={allOp} />

        {/* Active Incidents */}
        {data && data.incidents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Active Incidents
            </h3>
            {data.incidents.map((inc) => (
              <div
                key={inc.id}
                className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-200">{inc.title}</span>
                      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                        {inc.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {inc.status} - {timeAgo(inc.createdAt)}
                    </p>
                    {inc.lastUpdate && (
                      <p className="mt-1 text-xs text-neutral-400">{inc.lastUpdate}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Server Status with Uptime */}
        <div className="space-y-3">
          {data?.servers.map((srv) => {
            const cfg = statusConfig[srv.status];
            const srvUptime = uptime.find((u) => u.serverName === srv.name);
            return (
              <div
                key={srv.name}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot} ${srv.status === "online" ? "shadow-[0_0_8px_rgba(52,211,153,0.5)]" : srv.status === "offline" ? "shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse" : ""}`} />
                    <span className="text-sm font-medium text-neutral-200">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {srvUptime && (
                      <span className={`text-xs font-mono ${srvUptime.uptimePercent >= 99 ? "text-emerald-400" : srvUptime.uptimePercent >= 95 ? "text-yellow-400" : "text-red-400"}`}>
                        {srvUptime.uptimePercent}%
                      </span>
                    )}
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-6 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {srv.players}/{srv.maxPlayers} players
                  </span>
                  <span>Uptime: {formatUptime(srv.uptimeSeconds)}</span>
                  {srvUptime?.avgResponseMs && (
                    <span>Avg response: {srvUptime.avgResponseMs}ms</span>
                  )}
                </div>

                {/* 90-day uptime bar */}
                {srvUptime && srvUptime.daily.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] text-neutral-600 mb-1">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                    <UptimeBar daily={srvUptime.daily} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Uptime Summary */}
        {uptime.length > 0 && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">
              90-Day Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {uptime.map((u) => (
                <div key={u.serverId} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {u.uptimePercent >= 99 ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span className={`text-lg font-bold font-mono ${u.uptimePercent >= 99 ? "text-emerald-400" : u.uptimePercent >= 95 ? "text-yellow-400" : "text-red-400"}`}>
                      {u.uptimePercent}%
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">{u.serverName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh + timestamp */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[10px] text-neutral-600">
            Last updated: {data ? new Date(data.timestamp).toLocaleString("ru-RU") : "—"}
          </p>
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            disabled={refreshing}
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="text-center text-[10px] text-neutral-600 pt-2">
          Forge RP Dev-Ops Dashboard
        </p>

        {/* Embed code */}
        <EmbedCode />
      </div>
    </div>
  );
}

function EmbedCode() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://yoursite.com";
  const code = `<iframe\n  src="${origin}/status"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:12px;"\n  title="Server Status"\n></iframe>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-neutral-800 pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors mx-auto"
      >
        <Code className="h-3.5 w-3.5" />
        {open ? "Скрыть embed-код" : "Вставить на сайт (embed)"}
      </button>
      {open && (
        <div className="mt-3 relative">
          <pre className="rounded-lg bg-neutral-900 border border-neutral-700 p-3 text-[11px] text-neutral-400 overflow-x-auto font-mono whitespace-pre-wrap">
            {code}
          </pre>
          <button
            onClick={copy}
            className="absolute right-2 top-2 rounded border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
