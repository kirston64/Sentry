import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

interface ParsedTask {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Текст не передан" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY не настроен" }, { status: 500 });

  const prompt = `Ты помощник DevOps команды. Разбери следующий текст и извлеки из него задачи.
Верни ТОЛЬКО JSON массив без лишнего текста, без markdown, без \`\`\`.

Для каждой задачи определи:
- title: краткое название (до 80 символов)
- description: подробности если есть, иначе пустая строка
- priority: одно из "critical", "high", "medium", "low"
  - critical: срочно, критично, asap, горит, блокирует
  - high: важно, приоритет, быстро
  - low: потом, не срочно, когда будет время
  - medium: всё остальное

Текст:
${text}

Ответ (только JSON массив):`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || "Ошибка Gemini" }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip possible markdown code blocks
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const tasks: ParsedTask[] = JSON.parse(cleaned);

    if (!Array.isArray(tasks)) throw new Error("Не массив");

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Не удалось разобрать ответ от Gemini" }, { status: 500 });
  }
}
