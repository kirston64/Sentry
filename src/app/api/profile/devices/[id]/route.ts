import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;

    await prisma.trustedDevice.deleteMany({
      where: { id, userId: profile.id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
