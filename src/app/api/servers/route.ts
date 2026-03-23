import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      include: {
        metrics: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    const result = servers.map((s) => ({
      id: s.id,
      name: s.name,
      ip: s.ip,
      port: s.port,
      maxPlayers: s.maxPlayers,
      status: s.status,
      gameMode: s.gameMode,
      mapName: s.mapName,
      metrics: s.metrics[0] || { playersOnline: 0, cpuPercent: 0, ramPercent: 0, uptimeSeconds: 0, tickRate: 0 },
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
