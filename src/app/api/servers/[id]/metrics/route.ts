import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const server = await prisma.server.findUnique({ where: { id } });
    if (!server || server.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
    }

    const body = await request.json();
    const { playersOnline, cpuPercent, ramPercent, uptimeSeconds, tickRate } = body;

    await prisma.$transaction([
      prisma.serverMetrics.create({
        data: {
          serverId: id,
          playersOnline: Number(playersOnline) || 0,
          cpuPercent: Number(cpuPercent) || 0,
          ramPercent: Number(ramPercent) || 0,
          uptimeSeconds: Number(uptimeSeconds) || 0,
          tickRate: Number(tickRate) || 64,
        },
      }),
      prisma.server.update({
        where: { id },
        data: {
          status: "online",
          lastSeenAt: new Date(),
        },
      }),
      // Keep only last 1440 metric points (24h at 1/min)
      prisma.serverMetrics.deleteMany({
        where: {
          serverId: id,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
