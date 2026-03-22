"use client";

import { useState, useCallback, useRef } from "react";
import { ScrollText } from "lucide-react";
import { useInterval } from "@/hooks/useInterval";
import { LogViewer } from "@/components/logs/log-viewer";
import { LogFilters } from "@/components/logs/log-filters";
import { LOG_TEMPLATES } from "@/lib/mock-data";
import type { LogEntry, LogLevel } from "@/types/log-entry";

const NAMES = ["Arthas", "Kratos", "Snake", "Goku", "Jax", "Nova", "Rex", "Mira", "Zed", "Luna"];
const RESOURCES = ["ox_inventory", "esx_identity", "pma-voice", "sentry_anticheat", "sentry_admin", "mysql-async"];
const TABLES = ["users", "vehicles", "inventories", "properties", "jobs"];
const ITEMS = ["Pistol", "Medkit", "Phone", "Lockpick", "Radio"];
const VEHICLES = ["adder", "zentorno", "sultan", "elegy", "baller"];
const JOBS = ["police", "ambulance", "mechanic", "taxi", "unemployed"];
const ERRORS = ["ETIMEDOUT", "ECONNRESET", "EPERM", "ENOMEM"];
const LOCATIONS = ["Legion Square", "Pillbox Hospital", "MRPD", "Paleto Bay", "Sandy Shores"];

function fillTemplate(template: string): string {
  return template
    .replace("{player}", NAMES[Math.floor(Math.random() * NAMES.length)])
    .replace("{resource}", RESOURCES[Math.floor(Math.random() * RESOURCES.length)])
    .replace("{ms}", String(Math.floor(Math.random() * 500) + 10))
    .replace("{mb}", String(Math.floor(Math.random() * 2000) + 1500))
    .replace("{kb}", String(Math.floor(Math.random() * 512) + 32))
    .replace("{id}", String(Math.floor(Math.random() * 900) + 100))
    .replace("{count}", String(Math.floor(Math.random() * 60) + 2))
    .replace("{percent}", String(Math.floor(Math.random() * 40) + 60))
    .replace("{bytes}", String(Math.floor(Math.random() * 4096) + 128))
    .replace("{tick}", String(Math.floor(Math.random() * 20) + 40))
    .replace("{table}", TABLES[Math.floor(Math.random() * TABLES.length)])
    .replace("{item}", ITEMS[Math.floor(Math.random() * ITEMS.length)])
    .replace("{price}", String(Math.floor(Math.random() * 5000) + 100))
    .replace("{vehicle}", VEHICLES[Math.floor(Math.random() * VEHICLES.length)])
    .replace("{job}", JOBS[Math.floor(Math.random() * JOBS.length)])
    .replace("{error}", ERRORS[Math.floor(Math.random() * ERRORS.length)])
    .replace("{model}", VEHICLES[Math.floor(Math.random() * VEHICLES.length)])
    .replace("{location}", LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]);
}

function generateLog(): LogEntry {
  const levels: LogLevel[] = ["info", "info", "info", "warn", "error", "debug", "debug"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const templates = LOG_TEMPLATES[level];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    source: LOG_TEMPLATES.sources[Math.floor(Math.random() * LOG_TEMPLATES.sources.length)],
    message: fillTemplate(template),
  };
}

const MAX_LOGS = 500;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const initial: LogEntry[] = [];
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const log = generateLog();
      log.timestamp = new Date(now - (30 - i) * 1500).toISOString();
      initial.push(log);
    }
    return initial;
  });

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

  useInterval(() => {
    if (pausedRef.current) return;
    setLogs((prev) => {
      const batch = [generateLog()];
      if (Math.random() > 0.6) batch.push(generateLog());
      const next = [...prev, ...batch];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    });
  }, 1200);

  const toggleLevel = useCallback((level: LogLevel) => {
    setLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  }, []);

  const filtered = logs.filter((log) => {
    if (!levels[log.level]) return false;
    if (source && log.source !== source) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
        sources={LOG_TEMPLATES.sources}
      />

      <div className="flex-1 rounded-lg border border-border bg-surface overflow-hidden" style={{ minHeight: 0 }}>
        <LogViewer
          logs={filtered}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onClear={() => setLogs([])}
        />
      </div>
    </div>
  );
}
