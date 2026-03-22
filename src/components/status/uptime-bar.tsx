interface UptimeBarProps {
  days: boolean[]; // true = up, false = down. 90 entries.
}

export function UptimeBar({ days }: UptimeBarProps) {
  const total = days.length;
  const upCount = days.filter(Boolean).length;
  const pct = ((upCount / total) * 100).toFixed(2);

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${total * 4} 20`} className="w-full h-5" preserveAspectRatio="none">
        {days.map((up, i) => (
          <rect
            key={i}
            x={i * 4}
            y={0}
            width={3}
            height={20}
            rx={1}
            className={up ? "fill-emerald-500" : "fill-red-500"}
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-neutral-500">
        <span>90 дней назад</span>
        <span>{pct}% uptime</span>
        <span>Сегодня</span>
      </div>
    </div>
  );
}
