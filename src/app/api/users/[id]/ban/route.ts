import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendCriticalAlert } from "@/lib/telegram";

// POST — ban user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Только owner может банить пользователей" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: "Нельзя забанить себя" }, { status: 400 });
  }

  const { reason } = await req.json().catch(() => ({ reason: "" }));

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Нельзя забанить другого owner" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: {
      banned: true,
      banReason: reason?.trim() || "Нарушение правил",
      bannedAt: new Date(),
      bannedBy: session.id,
    },
  });

  // Invalidate all sessions for the banned user
  await prisma.session.deleteMany({ where: { userId: id } });

  sendCriticalAlert(
    `Пользователь заблокирован`,
    `🚫 <b>${target.fullName}</b> (<code>@${target.username}</code>) заблокирован.\n\n` +
    `👮 Заблокировал: ${session.full_name || session.github_username}\n` +
    `📝 Причина: ${reason?.trim() || "Нарушение правил"}`
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}

// DELETE — unban user
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Только owner может разбанивать пользователей" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.user.update({
    where: { id },
    data: { banned: false, banReason: null, bannedAt: null, bannedBy: null },
  });

  return NextResponse.json({ ok: true });
}
