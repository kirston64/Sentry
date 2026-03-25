import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

type Priority = "critical" | "high" | "medium" | "low";

const CRITICAL = /срочно|критич|asap|горит|блокир|urgent|critical|немедленно|прямо сейчас/i;
const HIGH     = /важно|высокий|приоритет|быстро|скоро|important|high|надо|нужно/i;
const LOW      = /потом|не срочно|когда.нибудь|позже|low|можно подождать|при случае|когда будет время/i;

function detectPriority(line: string): Priority {
  if (CRITICAL.test(line)) return "critical";
  if (HIGH.test(line))     return "high";
  if (LOW.test(line))      return "low";
  return "medium";
}

function cleanTitle(line: string): string {
  return line
    .replace(/^[-*•>\d]+[.)]\s*/, "")   // strip list markers: -, *, 1., 2)
    .replace(/\(.*?\)/g, "")             // strip parenthetical notes like (низкий приоритет)
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Текст не передан" }, { status: 400 });

  const lines = text
    .split(/\n+/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 2);

  const tasks = lines.map((line: string) => ({
    title: cleanTitle(line).slice(0, 120) || line.slice(0, 120),
    description: "",
    priority: detectPriority(line),
  })).filter((t: { title: string }) => t.title.length > 0);

  return NextResponse.json({ tasks });
}
