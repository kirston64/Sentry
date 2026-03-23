import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
        timeline: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { username: true, fullName: true } } },
        },
        postmortem: true,
        tasks: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Инцидент не найден" }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "resolved") updateData.resolvedAt = new Date();

      await prisma.incidentEvent.create({
        data: {
          incidentId: id,
          message: `Статус изменён на: ${body.status}`,
          authorId: profile.id,
        },
      });
    }

    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;

    if (body.timelineMessage) {
      await prisma.incidentEvent.create({
        data: { incidentId: id, message: body.timelineMessage, authorId: profile.id },
      });
    }

    if (body.postmortem) {
      const { whatBroke, rootCause, fix, prevention } = body.postmortem;
      await prisma.postmortem.upsert({
        where: { incidentId: id },
        create: { incidentId: id, whatBroke, rootCause, fix, prevention, authorId: profile.id },
        update: { whatBroke, rootCause, fix, prevention },
      });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
        timeline: { orderBy: { createdAt: "asc" }, include: { author: { select: { username: true, fullName: true } } } },
        postmortem: true,
      },
    });

    return NextResponse.json(incident);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
