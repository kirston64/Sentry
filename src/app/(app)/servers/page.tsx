"use client";

import { useState, useEffect, useCallback } from "react";
import { Server as ServerIcon, Plus, CheckSquare, Square, RefreshCw, X, Loader2 } from "lucide-react";
import { ServerCard } from "@/components/servers/server-card";
import { AddServerModal } from "@/components/servers/add-server-modal";
import type { Server, ServerMetrics } from "@/types/server";

interface ServerData extends Server {
  metrics: ServerMetrics;
  type: string;
  lastSeenAt: string | null;
  hasSSH: boolean;
  collectError: string | null;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [uptimeMap, setUptimeMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const triggerCollect = useCallback((serverList: ServerData[]) => {
    const toCollect = serverList.filter((s) => {
      if (!s.hasSSH) return false;
      if (!s.lastSeenAt) return true;
      return (Date.now() - new Date(s.lastSeenAt).getTime()) > 25_000;
    });
    if (toCollect.length === 0) return;

    Promise.allSettled(
      toCollect.map((s) => fetch(`/api/servers/${s.id}/collect`, { method: "POST" }))
    ).then(() => {
      fetch("/api/servers").then((r) => r.json()).then(setServers);
    });
  }, []);

  const fetchServers = useCallback(async () => {
    const [data, uptimeData] = await Promise.all([
      fetch("/api/servers").then((r) => r.json()),
      fetch("/api/uptime?days=30").then((r) => r.json()).catch(() => []),
    ]);
    setServers(data);
    const map: Record<string, number> = {};
    if (Array.isArray(uptimeData)) {
      for (const u of uptimeData) map[u.serverId] = u.uptimePercent;
    }
    setUptimeMap(map);
    setLoading(false);
    triggerCollect(data);
  }, [triggerCollect]);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 10_000);
    return () => clearInterval(interval);
  }, [fetchServers]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(servers.filter(s => s.hasSSH).map(s => s.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const bulkCollect = async () => {
    setBulkLoading(true);
    await Promise.allSettled(
      [...selected].map(id => fetch(`/api/servers/${id}/collect`, { method: "POST" }))
    );
    await fetchServers();
    setBulkLoading(false);
    clearSelection();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-text-primary">Servers</h1>
            <span className="ml-2 text-xs text-text-muted">
              {servers.filter((s) => s.status === "online").length} / {servers.length} онлайн
            </span>
          </div>
          <div className="flex items-center gap-2">
            {servers.some(s => s.hasSSH) && (
              <button
                onClick={selected.size > 0 ? clearSelection : selectAll}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                {selected.size > 0 ? <Square className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                {selected.size > 0 ? "Снять выбор" : "Выбрать все"}
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить сервер
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-xs text-text-secondary">Выбрано: {selected.size}</span>
            <button
              onClick={bulkCollect}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Собрать метрики
            </button>
            <button
              onClick={clearSelection}
              className="ml-auto flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Отмена
            </button>
          </div>
        )}

        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <ServerIcon className="mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-muted">Нет подключённых серверов</p>
            <p className="mt-1 text-xs text-text-muted">
              Нажми «Добавить сервер» и запусти агент на своём сервере
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить первый сервер
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                baseMetrics={server.metrics}
                uptimePercent={uptimeMap[server.id]}
                selected={selected.has(server.id)}
                onSelect={server.hasSSH ? toggleSelect : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddServerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchServers();
          }}
        />
      )}
    </>
  );
}
