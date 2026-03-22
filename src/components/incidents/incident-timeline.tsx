import { clsx } from "clsx";
import type { IncidentEvent } from "@/types/incident";

export function IncidentTimeline({ events }: { events: IncidentEvent[] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, i) => (
          <div key={i} className="relative">
            {/* Dot */}
            <div
              className={clsx(
                "absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface",
                i === 0 ? "bg-primary" : i === events.length - 1 ? "bg-success" : "bg-text-muted"
              )}
            />

            <div>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{new Date(event.timestamp).toLocaleString("ru-RU")}</span>
                <span className="text-accent">{event.author}</span>
              </div>
              <p className="mt-0.5 text-sm text-text-secondary">{event.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
