import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
      },
    });

    if (body.status) {
      await prisma.auditLog.create({
        data: { userId: profile.id, action: "task.move", target: `${task.title} → ${body.status}` },
      });
    }

    return NextResponse.json({ ...task, tags: JSON.parse(task.tags) });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { userId: profile.id, action: "task.delete", target: task.title },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
