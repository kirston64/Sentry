import Link from "next/link";
import { clsx } from "clsx";
import { Clock } from "lucide-react";
import type { Incident } from "@/types/incident";

const severityConfig = {
  P1: { color: "bg-error/20 text-error", label: "P1 Critical" },
  P2: { color: "bg-warning/20 text-warning", label: "P2 High" },
  P3: { color: "bg-primary/20 text-primary", label: "P3 Medium" },
  P4: { color: "bg-text-muted/20 text-text-muted", label: "P4 Low" },
};

const statusConfig = {
  investigating: { color: "text-error", label: "Investigating" },
  identified: { color: "text-warning", label: "Identified" },
  monitoring: { color: "text-primary", label: "Monitoring" },
  resolved: { color: "text-success", label: "Resolved" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}ч назад`;
  return `${Math.floor(hours / 24)}д назад`;
}

export function IncidentCard({ incident }: { incident: Incident }) {
  const sev = severityConfig[incident.severity];
  const st = statusConfig[incident.status];
  const assignee = incident.assignee;

  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-all hover:border-border-focus hover:bg-surface-hover"
    >
      <span className={clsx("rounded px-2 py-1 text-[10px] font-bold", sev.color)}>
        {incident.severity}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{incident.title}</p>
        <div className="mt-0.5 flex items-center gap-3 text-[10px] text-text-muted">
          <span className={st.color}>{st.label}</span>
          {assignee && <span>→ {assignee.username}</span>}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(incident.createdAt)}
          </span>
        </div>
      </div>

      <span className="text-[10px] text-text-muted">
        {incident.timeline.length} событий
      </span>
    </Link>
  );
}
