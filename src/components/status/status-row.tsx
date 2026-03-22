import { UptimeBar } from "./uptime-bar";

interface StatusRowProps {
  name: string;
  status: "operational" | "degraded" | "down";
  uptimeDays: boolean[];
}

const statusLabel = {
  operational: { text: "Operational", color: "text-emerald-400" },
  degraded: { text: "Degraded", color: "text-yellow-400" },
  down: { text: "Down", color: "text-red-400" },
};

export function StatusRow({ name, status, uptimeDays }: StatusRowProps) {
  const cfg = statusLabel[status];
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-200">{name}</span>
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.text}</span>
      </div>
      <UptimeBar days={uptimeDays} />
    </div>
  );
}
