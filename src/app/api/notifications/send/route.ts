import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, type } = await request.json();
  const results: Record<string, boolean> = {};

  const discord = await prisma.webhookConfig.findUnique({ where: { type: "discord" } });
  if (discord?.enabled && discord.url && (!type || type === "discord")) {
    try {
      await fetch(discord.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{ title: "Forge Dev-Ops Alert", description: message, color: 0xff4444, timestamp: new Date().toISOString() }],
        }),
      });
      results.discord = true;
    } catch {
      results.discord = false;
    }
  }

  const telegram = await prisma.webhookConfig.findUnique({ where: { type: "telegram" } });
  if (telegram?.enabled && telegram.url && (!type || type === "telegram")) {
    try {
      await fetch(telegram.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegram.secret, text: `*Forge Alert*\n${message}`, parse_mode: "Markdown" }),
      });
      results.telegram = true;
    } catch {
      results.telegram = false;
    }
  }

  return NextResponse.json({ sent: results });
}
