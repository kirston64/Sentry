import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: profile.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
