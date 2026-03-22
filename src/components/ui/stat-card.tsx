"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";
import { AnimatedCounter } from "./animated-counter";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "accent" | "warning" | "error" | "success";
  href?: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
}

const colorMap = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  error: "text-error",
  success: "text-success",
};

const trendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColor = { up: "text-success", down: "text-error", neutral: "text-text-muted" };

export function StatCard({ title, value, icon: Icon, color = "primary", href, trend }: StatCardProps) {
  const content = (
    <div className={clsx(
      "rounded-lg border border-border bg-surface p-5 transition-all hover:border-border-focus",
      href && "cursor-pointer hover:bg-surface-hover"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-text-primary">
              {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
            </p>
            {trend && (
              <span className={clsx("flex items-center gap-0.5 text-[10px]", trendColor[trend.direction])}>
                {(() => { const TIcon = trendIcon[trend.direction]; return <TIcon className="h-3 w-3" />; })()}
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <Icon className={clsx("h-8 w-8", colorMap[color])} />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
