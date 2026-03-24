"use client";

import { useState, useEffect, useCallback } from "react";
import { Server as ServerIcon, Plus } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
    const data = await fetch("/api/servers").then((r) => r.json());
    setServers(data);
    setLoading(false);
    triggerCollect(data);
  }, [triggerCollect]);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 10_000);
    return () => clearInterval(interval);
  }, [fetchServers]);

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
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Добавить сервер
          </button>
        </div>

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
              <ServerCard key={server.id} server={server} baseMetrics={server.metrics} />
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
