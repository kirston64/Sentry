import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен" }, { status: 500 });

  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      timeline: { orderBy: { createdAt: "asc" }, include: { author: { select: { username: true } } } },
      assignee: { select: { username: true, fullName: true } },
      creator: { select: { username: true, fullName: true } },
      postmortem: true,
    },
  });

  if (!incident) return NextResponse.json({ error: "Инцидент не найден" }, { status: 404 });

  // Grab last 30 error/warn logs around the incident time
  const recentLogs = await prisma.logEntry.findMany({
    where: {
      level: { in: ["error", "warn"] },
      createdAt: { gte: new Date(incident.createdAt.getTime() - 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { server: { select: { name: true } } },
  });

  const timelineText = incident.timeline
    .map((e) => `[${new Date(e.createdAt).toISOString()}] ${e.author.username}: ${e.message}`)
    .join("\n");

  const logsText = recentLogs.length > 0
    ? recentLogs
        .map((l) => `[${l.level.toUpperCase()}] ${l.server?.name} | ${l.source}: ${l.message}`)
        .join("\n")
    : "Нет логов в базе за этот период";

  const prompt = `Ты опытный DevOps-инженер. Проанализируй следующий инцидент и дай конкретные рекомендации.

## Инцидент
- Название: ${incident.title}
- Severity: ${incident.severity}
- Статус: ${incident.status}
- Создан: ${incident.createdAt.toISOString()}
- Исполнитель: ${incident.assignee ? `${incident.assignee.fullName} (@${incident.assignee.username})` : "не назначен"}

## Timeline событий
${timelineText || "Нет событий"}

## Логи за последний час до инцидента (error/warn)
${logsText}

## Задача
1. Определи вероятную корневую причину
2. Предложи немедленные действия для устранения
3. Предложи долгосрочные меры для предотвращения
4. Оцени severity (правильно ли выставлен ${incident.severity}?)

Отвечай кратко и по делу, на русском языке.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
  }

  const data = await response.json();
  const analysis = data.choices?.[0]?.message?.content ?? "Нет ответа от AI";

  return NextResponse.json({ analysis });
}
