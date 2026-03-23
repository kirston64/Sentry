import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        metrics: { orderBy: { createdAt: "desc" }, take: 24 },
        deploys: { orderBy: { startedAt: "desc" }, take: 5, include: { user: { select: { username: true, fullName: true } } } },
      },
    });

    if (!server) {
      return NextResponse.json({ error: "Сервер не найден" }, { status: 404 });
    }

    return NextResponse.json({
      ...server,
      metrics: server.metrics.reverse(),
      currentMetrics: server.metrics[server.metrics.length - 1] || null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
