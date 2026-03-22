import { clsx } from "clsx";

interface GaugeBarProps {
  label: string;
  value: number; // 0-100
}

function getColor(v: number) {
  if (v < 60) return "bg-success";
  if (v < 85) return "bg-warning";
  return "bg-error";
}

export function GaugeBar({ label, value }: GaugeBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-secondary">{Math.round(clamped)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", getColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
