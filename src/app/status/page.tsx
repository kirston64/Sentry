"use client";

import { useMemo } from "react";
import { StatusHeader } from "@/components/status/status-header";
import { StatusRow } from "@/components/status/status-row";

// Generate deterministic-ish 90-day uptime data
function generateUptime(seed: number, reliability: number): boolean[] {
  const days: boolean[] = [];
  let rng = seed;
  for (let i = 0; i < 90; i++) {
    rng = (rng * 16807 + 7) % 2147483647;
    days.push((rng % 1000) / 1000 < reliability);
  }
  return days;
}

const SERVICES = [
  { name: "Sentry RP #1 — Game Server", seed: 42, reliability: 0.97, status: "operational" as const },
  { name: "Sentry RP #2 Dev — Game Server", seed: 77, reliability: 0.93, status: "operational" as const },
  { name: "Sentry RP #3 Event — Game Server", seed: 13, reliability: 0.85, status: "down" as const },
  { name: "API Gateway", seed: 99, reliability: 0.995, status: "operational" as const },
  { name: "Database Cluster", seed: 55, reliability: 0.99, status: "operational" as const },
  { name: "Voice Server (pma-voice)", seed: 33, reliability: 0.96, status: "operational" as const },
  { name: "Anti-Cheat Service", seed: 21, reliability: 0.98, status: "operational" as const },
  { name: "Discord Bot", seed: 88, reliability: 0.94, status: "degraded" as const },
];

export default function StatusPage() {
  const services = useMemo(
    () => SERVICES.map((s) => ({ ...s, uptimeDays: generateUptime(s.seed, s.reliability) })),
    []
  );

  const allOp = services.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-100">Sentry RP</h1>
          <p className="text-xs text-neutral-500 mt-1">System Status</p>
        </div>

        <StatusHeader allOperational={allOp} />

        <div className="space-y-3">
          {services.map((svc) => (
            <StatusRow
              key={svc.name}
              name={svc.name}
              status={svc.status}
              uptimeDays={svc.uptimeDays}
            />
          ))}
        </div>

        <p className="text-center text-[10px] text-neutral-600 pt-4">
          Sentry RP Dev-Ops Dashboard
        </p>
      </div>
    </div>
  );
}
