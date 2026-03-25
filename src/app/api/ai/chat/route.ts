import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { chatId, message, model } = await request.json();
  if (!chatId || !message) return NextResponse.json({ error: "chatId и message обязательны" }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен" }, { status: 500 });

  // Load chat history
  const chat = await prisma.aIChat.findFirst({
    where: { id: chatId, userId: session.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chat) return NextResponse.json({ error: "Чат не найден" }, { status: 404 });

  // Save user message
  await prisma.aIChatMessage.create({ data: { chatId, role: "user", content: message } });

  // Update chat title from first message
  if (chat.messages.length === 0) {
    const title = message.slice(0, 60) + (message.length > 60 ? "..." : "");
    await prisma.aIChat.update({ where: { id: chatId }, data: { title } });
  }

  const selectedModel = model || chat.model;

  // Build messages history
  const history = chat.messages.map((m) => ({ role: m.role, content: m.content }));
  history.push({ role: "user", content: message });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    signal: AbortSignal.timeout(60_000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: history,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message || `Ошибка ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  const content: string = msg.content || "";
  const reasoning: string = msg.reasoning || msg.reasoning_content || "";

  // Save assistant message
  await prisma.aIChatMessage.create({ data: { chatId, role: "assistant", content, reasoning: reasoning || null } });
  await prisma.aIChat.update({ where: { id: chatId }, data: { updatedAt: new Date(), model: selectedModel } });

  return NextResponse.json({ content, reasoning });
}
