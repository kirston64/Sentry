import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

    const where: Record<string, unknown> = {};
    if (action) where.action = { startsWith: action };

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { username: true, fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
