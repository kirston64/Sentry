import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = tasks.map((t) => ({
      ...t,
      tags: JSON.parse(t.tags),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { title, description, assigneeId, priority, tags, incidentId } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Укажите название задачи" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        assigneeId: assigneeId || null,
        creatorId: profile.id,
        priority: priority || "medium",
        tags: JSON.stringify(tags || []),
        incidentId: incidentId || null,
      },
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
      },
    });

    await prisma.auditLog.create({
      data: { userId: profile.id, action: "task.create", target: title },
    });

    return NextResponse.json({ ...task, tags: JSON.parse(task.tags) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
