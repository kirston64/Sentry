"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ScrollText } from "lucide-react";
import { LogViewer } from "@/components/logs/log-viewer";
import { LogFilters } from "@/components/logs/log-filters";
import type { LogEntry, LogLevel } from "@/types/log-entry";

interface ApiLog {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
  server?: { name: string };
}

function mapLog(api: ApiLog): LogEntry {
  return {
    id: api.id,
    timestamp: api.createdAt,
    level: api.level as LogLevel,
    source: api.source,
    message: api.message,
  };
}

const MAX_LOGS = 500;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [levels, setLevels] = useState<Record<LogLevel, boolean>>({
    info: true,
    warn: true,
    error: true,
    debug: true,
  });
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const knownIds = useRef(new Set<string>());

  // Initial load
  useEffect(() => {
    fetch("/api/logs?limit=200")
      .then((r) => r.json())
      .then((data: ApiLog[]) => {
        const mapped = data.map(mapLog);
        mapped.forEach((l) => knownIds.current.add(l.id));
        setLogs(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  // Polling for new logs
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pausedRef.current) return;
      try {
        const res = await fetch("/api/logs?limit=20");
        const data: ApiLog[] = await res.json();
        const newLogs = data
          .map(mapLog)
          .filter((l) => !knownIds.current.has(l.id));

        if (newLogs.length > 0) {
          newLogs.forEach((l) => knownIds.current.add(l.id));
          setLogs((prev) => {
            const next = [...prev, ...newLogs];
            return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
          });
        }
      } catch { /* */ }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleLevel = useCallback((level: LogLevel) => {
    setLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  }, []);

  const sources = [...new Set(logs.map((l) => l.source))].sort();

  const filtered = logs.filter((log) => {
    if (!levels[log.level]) return false;
    if (source && log.source !== source) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-surface" />
        <div className="h-10 animate-pulse rounded bg-surface" />
        <div className="flex-1 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-3">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Live Logs</h1>
        <span className="ml-2 text-xs text-text-muted">{logs.length} total</span>
      </div>

      <LogFilters
        levels={levels}
        onToggleLevel={toggleLevel}
        search={search}
        onSearchChange={setSearch}
        source={source}
        onSourceChange={setSource}
        sources={sources}
      />

      <div className="flex-1 rounded-lg border border-border bg-surface overflow-hidden" style={{ minHeight: 0 }}>
        <LogViewer
          logs={filtered}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onClear={() => { setLogs([]); knownIds.current.clear(); }}
        />
      </div>
    </div>
  );
}
