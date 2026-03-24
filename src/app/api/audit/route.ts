import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
