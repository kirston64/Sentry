import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") return NextResponse.json({ error: "Только owner" }, { status: 403 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Введите пароль" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { password: true, fullName: true } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const lockdown = await prisma.systemLockdown.findFirst({
    where: { status: "pending" },
    orderBy: { initiatedAt: "desc" },
  });
  if (!lockdown) return NextResponse.json({ error: "Нет ожидающей блокировки" }, { status: 404 });
  if (lockdown.initiatedBy === session.id) {
    return NextResponse.json({ error: "Нельзя подтверждать свою же блокировку" }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.systemLockdown.update({
    where: { id: lockdown.id },
    data: {
      status: "active",
      confirmedBy: session.id,
      confirmerName: user.fullName,
      confirmedAt: now,
      activatedAt: now,
    },
  });

  return NextResponse.json(updated);
}
