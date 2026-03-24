import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lockdown = await prisma.systemLockdown.findFirst({
    where: { status: { in: ["pending", "active"] } },
    orderBy: { initiatedAt: "desc" },
  });

  return NextResponse.json(lockdown ?? { status: "inactive" });
}

// Deactivate lockdown (any owner, with password)
export async function DELETE(req: Request) {
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
    where: { status: { in: ["pending", "active"] } },
    orderBy: { initiatedAt: "desc" },
  });
  if (!lockdown) return NextResponse.json({ error: "Нет активной блокировки" }, { status: 404 });

  await prisma.systemLockdown.update({
    where: { id: lockdown.id },
    data: {
      status: "inactive",
      deactivatedBy: session.id,
      deactivaterName: user.fullName,
      deactivatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
