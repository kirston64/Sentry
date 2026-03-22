"use client";

import { Search } from "lucide-react";
import { clsx } from "clsx";
import type { LogLevel } from "@/types/log-entry";

interface LogFiltersProps {
  levels: Record<LogLevel, boolean>;
  onToggleLevel: (level: LogLevel) => void;
  search: string;
  onSearchChange: (val: string) => void;
  source: string;
  onSourceChange: (val: string) => void;
  sources: string[];
}

const levelConfig: { level: LogLevel; label: string; color: string; activeColor: string }[] = [
  { level: "info", label: "INFO", color: "text-primary", activeColor: "bg-primary/20 text-primary border-primary/40" },
  { level: "warn", label: "WARN", color: "text-warning", activeColor: "bg-warning/20 text-warning border-warning/40" },
  { level: "error", label: "ERROR", color: "text-error", activeColor: "bg-error/20 text-error border-error/40" },
  { level: "debug", label: "DEBUG", color: "text-text-muted", activeColor: "bg-text-muted/20 text-text-muted border-text-muted/40" },
];

export function LogFilters({ levels, onToggleLevel, search, onSearchChange, source, onSourceChange, sources }: LogFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Level toggles */}
      <div className="flex gap-1">
        {levelConfig.map((cfg) => (
          <button
            key={cfg.level}
            onClick={() => onToggleLevel(cfg.level)}
            className={clsx(
              "rounded border px-2 py-1 text-[10px] font-bold transition-colors",
              levels[cfg.level]
                ? cfg.activeColor
                : "border-border text-text-muted/40 hover:text-text-muted"
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Source filter */}
      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        className="rounded border border-border bg-background px-2 py-1 text-xs text-text-primary outline-none focus:border-border-focus"
      >
        <option value="">Все источники</option>
        {sources.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по логам..."
          className="w-full rounded border border-border bg-background pl-7 pr-3 py-1 text-xs text-text-primary outline-none focus:border-border-focus"
        />
      </div>
    </div>
  );
}
