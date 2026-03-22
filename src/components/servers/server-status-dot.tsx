import { clsx } from "clsx";
import type { ServerStatus } from "@/types/server";

const statusColors: Record<ServerStatus, string> = {
  online: "bg-success",
  offline: "bg-error",
  restarting: "bg-warning",
};

export function ServerStatusDot({ status }: { status: ServerStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "online" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
      )}
      <span className={clsx("relative inline-flex h-2.5 w-2.5 rounded-full", statusColors[status])} />
    </span>
  );
}
