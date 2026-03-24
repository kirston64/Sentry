import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const level = searchParams.get("level");
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (serverId) where.serverId = serverId;
    if (level) where.level = level;
    if (search) where.message = { contains: search };

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
