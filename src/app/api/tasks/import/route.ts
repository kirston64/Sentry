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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен" }, { status: 500 });

  const prompt = `You are a DevOps team assistant. Parse the following text and extract tasks from it.
Return ONLY a JSON array, no extra text, no markdown, no \`\`\`.

For each task determine:
- title: short name (max 80 chars), in the original language
- description: details if present, otherwise empty string
- priority: one of "critical", "high", "medium", "low"
  - critical: срочно/urgent/asap/горит/блокирует/critical
  - high: важно/важный/быстро/high/important
  - low: потом/не срочно/позже/low/when possible
  - medium: everything else

Text:
${text}

Answer (JSON array only):`;

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
        { role: "system", content: "You are a JSON-only API. You must respond with a valid JSON array and nothing else. No markdown, no explanations, no code blocks." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message || `OpenRouter error ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  const raw: string = msg.content || msg.reasoning || msg.reasoning_content || "";

  try {
    // Try to extract JSON array from anywhere in the response
    const match = raw.match(/\[[\s\S]*\]/);
    const jsonStr = match ? match[0] : raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const tasks: ParsedTask[] = JSON.parse(jsonStr);
    if (!Array.isArray(tasks)) throw new Error();
    return NextResponse.json({ tasks });
  } catch {
    // Last resort: return raw so user sees what model said
    return NextResponse.json({ error: `Модель вернула неожиданный ответ: ${raw.slice(0, 200)}` }, { status: 500 });
  }
}
