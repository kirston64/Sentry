import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { messages } = await request.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Сообщения не переданы" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен" }, { status: 500 });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    signal: AbortSignal.timeout(60_000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sentry-dashboard.local",
      "X-Title": "Sentry Dashboard",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        {
          role: "system",
          content: "Ты AI-ассистент DevOps команды разрабатывающей GTA V RP сервер на RAGE:MP + Node.js + TypeScript. Отвечай чётко и по делу. Можешь помогать с архитектурой, кодом, планированием задач и техническими вопросами.",
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message || `Ошибка ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content
    || data.choices?.[0]?.message?.reasoning
    || "";

  return NextResponse.json({ content });
}
