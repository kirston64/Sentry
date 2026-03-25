import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const chat = await prisma.aIChat.findFirst({
    where: { id, userId: session.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chat) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json(chat);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const { model } = await request.json();
  const chat = await prisma.aIChat.updateMany({
    where: { id, userId: session.id },
    data: { model, updatedAt: new Date() },
  });
  return NextResponse.json(chat);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  await prisma.aIChat.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
