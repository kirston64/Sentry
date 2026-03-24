"use client";

import { useState, useEffect } from "react";
import { LineChart } from "@/components/charts/line-chart";

type Range = "1h" | "6h" | "24h";

interface MetricPoint {
  playersOnline: number;
  cpuPercent: number;
  ramPercent: number;
  createdAt: string;
}

interface MetricsChartsProps {
  serverId: string;
}

const RANGES: { key: Range; label: string }[] = [
  { key: "1h", label: "1 час" },
  { key: "6h", label: "6 часов" },
  { key: "24h", label: "24 часа" },
];

function fmtLabel(iso: string, range: Range): string {
  const d = new Date(iso);
  if (range === "1h") return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getHours()}:00`;
}

export function MetricsCharts({ serverId }: MetricsChartsProps) {
  const [range, setRange] = useState<Range>("1h");
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = () => {
      fetch(`/api/servers/${serverId}?range=${range}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) {
            setMetrics(data.metrics || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serverId, range]);

  const playerData = metrics.map((m) => m.playersOnline);
  const cpuData = metrics.map((m) => Math.round(m.cpuPercent));
  const ramData = metrics.map((m) => Math.round(m.ramPercent));

  const labelStep = Math.max(1, Math.floor(metrics.length / 8));
  const labels = metrics.map((m, i) =>
    i % labelStep === 0 || i === metrics.length - 1 ? fmtLabel(m.createdAt, range) : ""
  );

  const lastPlayer = playerData[playerData.length - 1] ?? 0;
  const lastCpu = cpuData[cpuData.length - 1] ?? 0;
  const lastRam = ramData[ramData.length - 1] ?? 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Метрики</h3>
        <div className="flex gap-1 rounded border border-border bg-bg p-0.5">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                range === key
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-hover" />
          ))}
        </div>
      ) : metrics.length < 2 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          Нет данных за выбранный период
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Players */}
          <div className="rounded-lg border border-border bg-bg p-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-text-muted">Игроки онлайн</span>
              <span className="text-xl font-bold text-text-primary">{lastPlayer}</span>
            </div>
            <div className="h-24">
              <LineChart data={playerData} color="#007fd4" labels={labels} />
            </div>
          </div>

          {/* CPU */}
          <div className="rounded-lg border border-border bg-bg p-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-text-muted">CPU</span>
              <span
                className={`text-xl font-bold ${
                  lastCpu > 80 ? "text-error" : lastCpu > 60 ? "text-warning" : "text-success"
                }`}
              >
                {lastCpu}%
              </span>
            </div>
            <div className="h-24">
              <LineChart
                data={cpuData}
                color={lastCpu > 80 ? "#ef4444" : lastCpu > 60 ? "#f97316" : "#007fd4"}
                labels={labels}
              />
            </div>
          </div>

          {/* RAM */}
          <div className="rounded-lg border border-border bg-bg p-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-text-muted">RAM</span>
              <span
                className={`text-xl font-bold ${
                  lastRam > 85 ? "text-error" : lastRam > 65 ? "text-warning" : "text-success"
                }`}
              >
                {lastRam}%
              </span>
            </div>
            <div className="h-24">
              <LineChart
                data={ramData}
                color={lastRam > 85 ? "#ef4444" : "#a855f7"}
                labels={labels}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
