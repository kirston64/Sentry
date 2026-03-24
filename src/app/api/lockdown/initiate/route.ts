import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") return NextResponse.json({ error: "Только owner" }, { status: 403 });

  const { password, reason } = await req.json();
  if (!password) return NextResponse.json({ error: "Введите пароль" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { password: true, fullName: true } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  // Check no existing pending/active lockdown
  const existing = await prisma.systemLockdown.findFirst({
    where: { status: { in: ["pending", "active"] } },
  });
  if (existing) return NextResponse.json({ error: "Блокировка уже инициирована" }, { status: 409 });

  // Check there is at least one other owner to confirm
  const ownerCount = await prisma.user.count({ where: { role: "owner" } });
  if (ownerCount < 2) {
    return NextResponse.json({ error: "Нужно минимум 2 овнера для активации" }, { status: 400 });
  }

  const lockdown = await prisma.systemLockdown.create({
    data: {
      status: "pending",
      reason: reason?.trim() || null,
      initiatedBy: session.id,
      initiatorName: user.fullName,
    },
  });

  return NextResponse.json(lockdown, { status: 201 });
}
