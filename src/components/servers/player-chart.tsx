"use client";

interface PlayerChartProps {
  data: number[];
  color?: string;
}

export function PlayerChart({ data, color = "#007fd4" }: PlayerChartProps) {
  if (data.length < 2) return null;

  const w = 200;
  const h = 40;
  const max = Math.max(...data) || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h * 0.9;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${points[0]} ${points.join(" L")} L${w},${h} L0,${h} Z`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
