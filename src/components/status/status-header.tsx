import { clsx } from "clsx";

interface StatusHeaderProps {
  allOperational: boolean;
}

export function StatusHeader({ allOperational }: StatusHeaderProps) {
  return (
    <div
      className={clsx(
        "rounded-lg p-6 text-center",
        allOperational ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
      )}
    >
      <div
        className={clsx(
          "mx-auto mb-3 h-4 w-4 rounded-full",
          allOperational ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)] animate-pulse"
        )}
      />
      <h2 className={clsx("text-lg font-bold", allOperational ? "text-emerald-400" : "text-red-400")}>
        {allOperational ? "All Systems Operational" : "Partial System Outage"}
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Последнее обновление: {new Date().toLocaleString("ru-RU")}
      </p>
    </div>
  );
}
