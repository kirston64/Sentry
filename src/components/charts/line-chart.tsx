"use client";

interface LineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  labels?: string[];
}

export function LineChart({
  data,
  width = 400,
  height = 120,
  color = "#007fd4",
  filled = true,
  labels,
}: LineChartProps) {
  if (data.length < 2) return null;

  const padding = { top: 10, right: 10, bottom: labels ? 20 : 10, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPath = `M${points[0]} ${points.join(" L")} L${padding.left + chartW},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {filled && (
        <path
          d={areaPath}
          fill={`url(#fill-${color.replace("#", "")})`}
        />
      )}

      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {labels && labels.map((label, i) => {
        if (!label) return null;
        const x = padding.left + (i / Math.max(labels.length - 1, 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={height - 2}
            textAnchor="middle"
            className="fill-text-muted"
            fontSize="9"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
