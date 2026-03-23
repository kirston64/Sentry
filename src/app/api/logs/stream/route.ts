import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  const encoder = new TextEncoder();
  let lastId = "";

  const stream = new ReadableStream({
    async start(controller) {
      const where: Record<string, unknown> = {};
      if (serverId) where.serverId = serverId;

      const initial = await prisma.logEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { server: { select: { name: true } } },
      });

      for (const log of initial.reverse()) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
        lastId = log.id;
      }
    },
    async pull(controller) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const where: Record<string, unknown> = {};
        if (serverId) where.serverId = serverId;
        if (lastId) {
          const lastLog = await prisma.logEntry.findUnique({ where: { id: lastId } });
          if (lastLog) where.createdAt = { gt: lastLog.createdAt };
        }

        const newLogs = await prisma.logEntry.findMany({
          where,
          orderBy: { createdAt: "asc" },
          take: 50,
          include: { server: { select: { name: true } } },
        });

        for (const log of newLogs) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
          lastId = log.id;
        }
      } catch {
        // connection closed
      }
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

export const dynamic = "force-dynamic";
