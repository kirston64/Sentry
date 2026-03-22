"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
}

export function BarChart({
  data,
  width = 400,
  height = 120,
  color = "#4ec9b0",
}: BarChartProps) {
  if (data.length === 0) return null;

  const padding = { top: 10, right: 10, bottom: 22, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.value)) || 1;
  const barWidth = chartW / data.length * 0.6;
  const gap = chartW / data.length * 0.4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const y = padding.top + chartH - barH;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx="2"
              fill={color}
              opacity="0.8"
            />
            <text
              x={x + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              className="fill-text-muted"
              fontSize="9"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
