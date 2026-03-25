import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ tasks: [], incidents: [], users: [] });

    const [tasks, incidents, users] = await Promise.all([
      prisma.task.findMany({
        where: { title: { contains: q } },
        select: { id: true, title: true, status: true, priority: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.incident.findMany({
        where: { title: { contains: q } },
        select: { id: true, title: true, severity: true, status: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { fullName: { contains: q } },
          ],
        },
        select: { id: true, username: true, fullName: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({ tasks, incidents, users });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
