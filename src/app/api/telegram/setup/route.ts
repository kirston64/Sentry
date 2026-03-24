import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setWebhook } from "@/lib/telegram";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const webhookUrl = `${url}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);
  return NextResponse.json(result);
}
