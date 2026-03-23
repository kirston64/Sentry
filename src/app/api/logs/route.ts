import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const level = searchParams.get("level");
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

    const where: Record<string, unknown> = {};
    if (serverId) where.serverId = serverId;
    if (level) where.level = level;

    const logs = await prisma.logEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { server: { select: { name: true } } },
    });

    return NextResponse.json(logs.reverse());
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
