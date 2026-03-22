"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, ChevronRight, GitCommit, Clock, User } from "lucide-react";
import type { Deploy } from "@/types/deploy";

const statusConfig = {
  success: { label: "Success", color: "bg-success/20 text-success", dot: "bg-success" },
  failed: { label: "Failed", color: "bg-error/20 text-error", dot: "bg-error" },
  rolling: { label: "Rolling", color: "bg-warning/20 text-warning", dot: "bg-warning animate-pulse" },
  pending: { label: "Pending", color: "bg-text-muted/20 text-text-muted", dot: "bg-text-muted" },
};

const envColors = {
  production: "text-error",
  staging: "text-warning",
  development: "text-accent",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  return `${Math.floor(hours / 24)}д назад`;
}

function duration(start: string, end: string | null) {
  if (!end) return "...";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(diff / 1000);
  return s < 60 ? `${s}с` : `${Math.floor(s / 60)}м ${s % 60}с`;
}

export function DeployCard({ deploy }: { deploy: Deploy }) {
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[deploy.status];

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        {/* Timeline dot */}
        <div className="flex flex-col items-center">
          <span className={clsx("h-3 w-3 rounded-full", s.dot)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{deploy.version}</span>
            <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-medium", s.color)}>{s.label}</span>
            <span className={clsx("text-[10px]", envColors[deploy.environment])}>{deploy.environment}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <GitCommit className="h-3 w-3" />
              {deploy.commitSha} — {deploy.commitMsg}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-text-muted shrink-0">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {deploy.triggeredBy}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {duration(deploy.startedAt, deploy.finishedAt)}
          </span>
          <span>{timeAgo(deploy.startedAt)}</span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-[#0c0c0c] px-4 py-3 font-mono text-[11px]">
          {deploy.logs.map((log, i) => (
            <div key={i} className={clsx(
              "leading-relaxed",
              log.startsWith("ERROR") ? "text-error" : log.includes("complete") || log.includes("passed") ? "text-success" : "text-text-secondary"
            )}>
              <span className="text-text-muted mr-2">[{String(i + 1).padStart(2, "0")}]</span>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
