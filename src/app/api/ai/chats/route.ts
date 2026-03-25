import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const chats = await prisma.aIChat.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, model: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(chats);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { title, model } = await request.json();
  const chat = await prisma.aIChat.create({
    data: {
      userId: session.id,
      title: title || "Новый чат",
      model: model || "nvidia/nemotron-3-super-120b-a12b:free",
    },
  });
  return NextResponse.json(chat, { status: 201 });
}
