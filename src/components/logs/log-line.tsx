"use client";

import { clsx } from "clsx";
import type { LogEntry } from "@/types/log-entry";

const levelColors = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-error",
  debug: "text-text-muted",
};

const levelBg = {
  info: "bg-primary/15 text-primary",
  warn: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  debug: "bg-text-muted/15 text-text-muted",
};

export function LogLine({ entry }: { entry: LogEntry }) {
  const ts = new Date(entry.timestamp);
  const time = ts.toLocaleTimeString("ru-RU", { hour12: false, fractionalSecondDigits: 3 });

  // Highlight JSON-like fragments and numbers in message
  const parts = entry.message.split(/(\{[^}]+\}|\b\d+(?:\.\d+)?(?:ms|MB|KB|%|s)?\b)/g);

  return (
    <div className="flex gap-3 px-3 py-0.5 font-mono text-xs hover:bg-surface-hover/50 group">
      <span className="text-text-muted shrink-0 select-none">{time}</span>
      <span className={clsx("w-12 shrink-0 text-center rounded px-1 text-[10px] font-bold uppercase", levelBg[entry.level])}>
        {entry.level}
      </span>
      <span className="text-accent shrink-0 w-28 truncate">{entry.source}</span>
      <span className="text-text-secondary">
        {parts.map((part, i) =>
          /^\{[^}]+\}$/.test(part) ? (
            <span key={i} className="text-accent">{part}</span>
          ) : /^\d+/.test(part) ? (
            <span key={i} className="text-warning">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    </div>
  );
}
