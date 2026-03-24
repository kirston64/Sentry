import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function deriveStatus(status: string, lastSeenAt: Date | null): string {
  if (!lastSeenAt) return "offline";
  const staleSec = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (staleSec > 120) return "offline";
  return status;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "24h";
    const rangeMs = range === "1h" ? 3_600_000 : range === "6h" ? 21_600_000 : 86_400_000;
    const since = new Date(Date.now() - rangeMs);

    const [server, rawMetrics, latestMetric] = await Promise.all([
      prisma.server.findUnique({
        where: { id },
        include: {
          deploys: { orderBy: { startedAt: "desc" }, take: 5, include: { user: { select: { username: true, fullName: true } } } },
        },
      }),
      prisma.serverMetrics.findMany({
        where: { serverId: id, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.serverMetrics.findFirst({
        where: { serverId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 });
    }

    // Downsample to ~120 points max
    const step = Math.max(1, Math.floor(rawMetrics.length / 120));
    const metrics = rawMetrics.filter((_, i) => i % step === 0);

    return NextResponse.json({
      ...server,
      status: deriveStatus(server.status, server.lastSeenAt),
      metrics,
      currentMetrics: latestMetric || null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "owner" && session.role !== "admin")) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.server.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
