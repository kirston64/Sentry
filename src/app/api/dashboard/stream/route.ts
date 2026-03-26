import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getDashboardSnapshot() {
  const [servers, incidents, deploys] = await Promise.all([
    prisma.server.findMany({
      include: { metrics: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.incident.findMany({
      where: { status: { not: "resolved" } },
      select: { id: true, title: true, severity: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.deploy.findMany({
      select: { id: true, version: true, environment: true, status: true, commitMsg: true },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  const now = Date.now();
  const serversWithStatus = servers.map(s => ({
    id: s.id,
    name: s.name,
    status: s.lastSeenAt && (now - s.lastSeenAt.getTime()) < 15 * 60 * 1000 ? "online" : "offline",
    metrics: s.metrics[0] ?? null,
  }));

  return { servers: serversWithStatus, incidents, deploys, ts: now };
}

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Initial snapshot
      try {
        const snapshot = await getDashboardSnapshot();
        send(snapshot);
      } catch {
        send({ error: "Ошибка загрузки" });
      }

      // Poll every 10 seconds
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const snapshot = await getDashboardSnapshot();
          send(snapshot);
        } catch {
          // skip
        }
      }, 10_000);

      // Cleanup on close
      return () => {
        closed = true;
        clearInterval(interval);
      };
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
