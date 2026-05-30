import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function todayDate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// GET — current user's active session today
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const work = await prisma.workSession.findFirst({
    where: { userId: session.id, date: todayDate(), status: { not: "ended" } },
    include: { breaks: { orderBy: { startedAt: "asc" } } },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(work ?? null);
}

// POST — actions: start | end | break_start | break_end
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, note } = await req.json();
  const today = todayDate();

  // Find active session
  const active = await prisma.workSession.findFirst({
    where: { userId: session.id, date: today, status: { not: "ended" } },
    include: { breaks: { orderBy: { startedAt: "asc" } } },
    orderBy: { startedAt: "desc" },
  });

  if (action === "start") {
    if (active) return NextResponse.json({ error: "Рабочая смена уже начата" }, { status: 400 });
    const work = await prisma.workSession.create({
      data: { userId: session.id, date: today, status: "working", note: note ?? null },
      include: { breaks: true },
    });
    return NextResponse.json(work, { status: 201 });
  }

  if (!active) return NextResponse.json({ error: "Активная смена не найдена" }, { status: 404 });

  if (action === "break_start") {
    if (active.status !== "working") return NextResponse.json({ error: "Уже на перерыве" }, { status: 400 });
    await prisma.workBreak.create({ data: { sessionId: active.id } });
    const updated = await prisma.workSession.update({
      where: { id: active.id },
      data: { status: "on_break" },
      include: { breaks: { orderBy: { startedAt: "asc" } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "break_end") {
    if (active.status !== "on_break") return NextResponse.json({ error: "Не на перерыве" }, { status: 400 });
    const openBreak = active.breaks.find(b => !b.endedAt);
    if (openBreak) {
      await prisma.workBreak.update({ where: { id: openBreak.id }, data: { endedAt: new Date() } });
    }
    const updated = await prisma.workSession.update({
      where: { id: active.id },
      data: { status: "working" },
      include: { breaks: { orderBy: { startedAt: "asc" } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "end") {
    // Close open break if any
    const openBreak = active.breaks.find(b => !b.endedAt);
    if (openBreak) {
      await prisma.workBreak.update({ where: { id: openBreak.id }, data: { endedAt: new Date() } });
    }
    const updated = await prisma.workSession.update({
      where: { id: active.id },
      data: { status: "ended", endedAt: new Date() },
      include: { breaks: { orderBy: { startedAt: "asc" } } },
    });
    await prisma.auditLog.create({
      data: { userId: session.id, action: "work.end", target: session.github_username ?? session.id, details: today },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
