interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface ${className ?? ""}`}>
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
